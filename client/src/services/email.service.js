import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export const sendEmailWithCredentials = async (data) => {
  try {
    const sendTeacherCredentials = httpsCallable(functions, 'sendTeacherCredentials');
    const result = await sendTeacherCredentials(data);
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(error.message || 'Failed to send welcome email');
  }
};