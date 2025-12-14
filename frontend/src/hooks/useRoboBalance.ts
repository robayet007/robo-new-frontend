import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import useAuth from './useAuth';

export interface BalanceTransaction {
  id: string;
  type: 'add' | 'deduct';
  amount: number;
  description: string;
  timestamp: number;
}

interface UserBalanceData {
  balance: number;
  transactions: BalanceTransaction[];
  updatedAt: number;
}

function useRoboBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(false); // Start with false - non-blocking

  useEffect(() => {
    if (user?.uid) {
      loadBalance();
      
      // Real-time listener for balance (with fallback for blocked requests)
      const balanceRef = doc(db, 'userBalances', user.uid);
      let unsubscribe: (() => void) | null = null;
      let fallbackInterval: ReturnType<typeof setInterval> | null = null;
      
      try {
        unsubscribe = onSnapshot(
          balanceRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserBalanceData;
              setBalance(data.balance || 0);
              setTransactions(data.transactions || []);
            } else {
              setBalance(0);
              setTransactions([]);
            }
            setLoading(false);
            
            // Clear fallback if real-time listener works
            if (fallbackInterval) {
              clearInterval(fallbackInterval);
              fallbackInterval = null;
            }
          },
          (error: any) => {
            console.error('Error loading balance:', error);
            console.warn('⚠️ Real-time listener failed, using periodic fetch');
            setLoading(false);
            
            // Fallback to periodic polling if real-time fails
            if (!fallbackInterval) {
              fallbackInterval = setInterval(() => {
                loadBalance();
              }, 10000); // Refresh every 10 seconds
            }
          }
        );
      } catch (error) {
        console.error('Failed to set up real-time listener:', error);
        setLoading(false);
        
        // Set up periodic polling as fallback
        fallbackInterval = setInterval(() => {
          loadBalance();
        }, 10000);
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
        }
      };
    } else {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
    }
  }, [user?.uid]);

  const loadBalance = async () => {
    if (!user?.uid) return;

    // Only show loading on explicit refresh, not on initial load
    const shouldShowLoading = balance === 0 && transactions.length === 0;
    if (shouldShowLoading) {
      setLoading(true);
    }

    try {
      const balanceRef = doc(db, 'userBalances', user.uid);
      const docSnap = await getDoc(balanceRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserBalanceData;
        setBalance(data.balance || 0);
        setTransactions(data.transactions || []);
      } else {
        // Initialize balance document if it doesn't exist (in background)
        const initialData: UserBalanceData = {
          balance: 0,
          transactions: [],
          updatedAt: Date.now(),
        };
        setDoc(balanceRef, initialData).catch(err => console.error('Error initializing balance:', err));
        setBalance(0);
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Error loading balance:', error);
      // Handle offline/blocked errors gracefully
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('blocked')) {
        console.warn('⚠️ Firebase connection blocked or offline. Using cached data or default values.');
        // Keep current balance if available, otherwise use 0
        // Don't update state to avoid clearing existing data
      }
    } finally {
      setLoading(false);
    }
  };

  const saveBalance = async (newBalance: number, newTransactions: BalanceTransaction[]) => {
    if (!user?.uid) return;
    
    try {
      const balanceRef = doc(db, 'userBalances', user.uid);
      const balanceData: UserBalanceData = {
        balance: newBalance,
        transactions: newTransactions,
        updatedAt: Date.now(),
      };
      
      await setDoc(balanceRef, balanceData, { merge: true });
      setBalance(newBalance);
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error saving balance:', error);
      throw error;
    }
  };

  const addMoney = async (amount: number, description: string = 'Added money to Robo Balance') => {
    if (!user?.uid || amount <= 0) return { success: false, error: 'Invalid amount' };

    try {
      const newBalance = balance + amount;
      const transaction: BalanceTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'add',
        amount,
        description,
        timestamp: Date.now(),
      };

      const newTransactions = [transaction, ...transactions];
      await saveBalance(newBalance, newTransactions);

      return { success: true, newBalance, transaction };
    } catch (error) {
      console.error('Error adding money:', error);
      return { success: false, error: 'Failed to add money' };
    }
  };

  const deductMoney = async (amount: number, description: string = 'Payment for purchase') => {
    if (!user?.uid || amount <= 0) return { success: false, error: 'Invalid amount' };
    if (balance < amount) return { success: false, error: 'Insufficient balance' };

    try {
      const newBalance = balance - amount;
      const transaction: BalanceTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'deduct',
        amount,
        description,
        timestamp: Date.now(),
      };

      const newTransactions = [transaction, ...transactions];
      await saveBalance(newBalance, newTransactions);

      return { success: true, newBalance, transaction };
    } catch (error) {
      console.error('Error deducting money:', error);
      return { success: false, error: 'Failed to deduct money' };
    }
  };

  const hasEnoughBalance = (amount: number): boolean => {
    return balance >= amount;
  };

  return {
    balance,
    transactions,
    loading,
    addMoney,
    deductMoney,
    hasEnoughBalance,
    refresh: loadBalance,
  };
}

export default useRoboBalance;
