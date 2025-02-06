import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateUniqueUsername = async (firstName, lastName) => {
    const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
    
    while (true) {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return username;
      }
      
      username = `${baseUsername}${counter}`;
      counter++;
    }
  };

  const generateUniqueId = async (prefix, collection) => {
    let counter = 1;
    let id = '';
    let isUnique = false;
    
    while (!isUnique) {
      id = `${prefix}${counter.toString().padStart(3, '0')}`;
      const q = query(collection(db, "users"), where("customId", "==", id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        counter++;
        if (counter > 999) {
          throw new Error(`No available IDs in range ${prefix}001-${prefix}999`);
        }
      }
    }
    return id;
  };

  const setCookieData = (userData) => {
    // Store complete user profile data
    const userProfile = {
      isAuthenticated: true,
      uid: userData.uid,
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      countryCode: userData.countryCode,
      userType: userData.userType,
      createdAt: userData.createdAt,
      lastLogin: new Date().toISOString()
    };

    // Split data into chunks if it's too large (cookies have size limits)
    const userProfileString = JSON.stringify(userProfile);
    const chunkSize = 4000; // Standard cookie size limit is ~4KB
    
    if (userProfileString.length > chunkSize) {
      const chunks = Math.ceil(userProfileString.length / chunkSize);
      for (let i = 0; i < chunks; i++) {
        const chunk = userProfileString.slice(i * chunkSize, (i + 1) * chunkSize);
        Cookies.set(`auth_${i}`, chunk, {
          expires: 7,
          secure: true,
          sameSite: 'strict'
        });
      }
      // Store the number of chunks
      Cookies.set('auth_chunks', chunks.toString(), {
        expires: 7,
        secure: true,
        sameSite: 'strict'
      });
    } else {
      Cookies.set('auth', userProfileString, {
        expires: 7,
        secure: true,
        sameSite: 'strict'
      });
    }
  };

  const clearCookieData = () => {
    const chunks = parseInt(Cookies.get('auth_chunks') || '0');
    if (chunks > 0) {
      for (let i = 0; i < chunks; i++) {
        Cookies.remove(`auth_${i}`);
      }
      Cookies.remove('auth_chunks');
    }
    Cookies.remove('auth');
  };

  const getUserFromCookies = useCallback(() => {
    try {
      const chunks = parseInt(Cookies.get('auth_chunks') || '0');
      if (chunks > 0) {
        let userProfileString = '';
        for (let i = 0; i < chunks; i++) {
          userProfileString += Cookies.get(`auth_${i}`) || '';
        }
        return JSON.parse(userProfileString);
      }
      
      const authCookie = Cookies.get('auth');
      return authCookie ? JSON.parse(authCookie) : null;
    } catch (error) {
      console.error('Error parsing auth cookies:', error);
      clearCookieData();
      return null;
    }
  }, []); // No dependencies needed as it only uses external functions

  const signup = async (email, password, userData) => {
    const username = await generateUniqueUsername(userData.firstName, userData.lastName);
    const customId = await generateUniqueId(userData.userType === 'Student' ? 'S' : 'T', collection);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
      ...userData,
      username,
      customId,
      createdAt: new Date().toISOString()
    });
    
    return userCredential;
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User profile not found. Please contact support.');
      }

      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        ...userDoc.data()
      };

      // Verify required fields
      if (!userData.userType || !userData.email) {
        await signOut(auth);
        throw new Error('Invalid user profile. Please contact support.');
      }

      setUser(userData);
      setCookieData(userData);
      return { user: userData };
    } catch (error) {
      clearCookieData();
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      clearCookieData();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const isAdmin = () => {
    return user && user.userType === 'Admin';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = { ...user, ...userDoc.data() };
        setUser(userData);
        setCookieData(userData);
      } else {
        setUser(null);
        clearCookieData();
      }
      setLoading(false);
    });

    // Check for existing cookie on initialization
    const cookieUser = getUserFromCookies();
    if (cookieUser && !user) {
      try {
        const userDoc = getDoc(doc(db, "users", cookieUser.uid));
        if (userDoc.exists()) {
          setUser(cookieUser);
        } else {
          clearCookieData();
        }
      } catch (error) {
        clearCookieData();
      }
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      getUserFromCookies();
    }
  }, [user, getUserFromCookies]);

  const value = {
    user,
    signup,
    login,
    logout,
    generateUniqueUsername,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};