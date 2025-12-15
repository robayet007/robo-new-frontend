// hooks/useRoboBalance.ts
import { useState, useEffect, useCallback } from 'react';
import { balanceApi } from '../services/api';
import useAuth from './useAuth';

export default function useRoboBalance() {
  const { user } = useAuth();
  const [backendBalance, setBackendBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user?.uid) {
      setBackendBalance(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await balanceApi.getUserBalance(user.uid);
      
      if (response.success && response.data?.balance !== undefined) {
        setBackendBalance(response.data.balance);
      } else {
        // If user balance not found, set to 0
        setBackendBalance(0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBackendBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Add error handling for undefined backendBalance
  const getCurrentBalance = () => {
    return backendBalance !== null ? backendBalance : 0;
  };

  return {
    backendBalance: backendBalance !== null ? backendBalance : 0,
    isLoading,
    refreshBalance: fetchBalance,
    getCurrentBalance
  };
}