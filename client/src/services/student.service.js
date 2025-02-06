
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getStudents = async () => {
  try {
    const studentsRef = collection(db, 'users');
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs
      .filter(doc => doc.data().userType === 'Student')
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  } catch (error) {
    throw new Error('Failed to fetch students: ' + error.message);
  }
};