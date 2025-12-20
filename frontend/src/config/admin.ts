import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';   

// Admin email configuration
export const ADMIN_EMAIL = 'mdrobayet007@gmail.com';

// Check if user is admin (checks both email and Firestore role)
export const isAdmin = async (email: string | null | undefined): Promise<boolean> => {
  if (!email) return false;
  
  // Check default admin email
  if (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
    return true;
  }
  
  // Check role from Firestore
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.role === 'admin';
    }
  } catch (error) {
    console.error('Error checking admin role:', error);
  }
  
  return false;
};

// Synchronous check for default admin email only (for quick checks)
export const isDefaultAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};
