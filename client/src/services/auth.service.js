
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Logout failed: ' + error.message);
  }
};