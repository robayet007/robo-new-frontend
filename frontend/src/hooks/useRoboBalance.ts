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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H1',
          location: 'useRoboBalance.ts:earlyReturn',
          message: 'fetchBalance called without authenticated user',
          data: { hasUser: !!user },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      return;
    }

    setIsLoading(true);
    try {
      const response = await balanceApi.getUserBalance(user.uid);

      if (response.success && response.data?.balance !== undefined) {
        setBackendBalance(response.data.balance);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'H1',
            location: 'useRoboBalance.ts:success',
            message: 'Fetched user balance successfully',
            data: { hasUser: !!user, balance: response.data.balance },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      } else {
        // If user balance not found, set to 0
        setBackendBalance(0);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'H2',
            location: 'useRoboBalance.ts:notFound',
            message: 'User balance not found, defaulting to 0',
            data: { hasUser: !!user },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBackendBalance(0);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H2',
          location: 'useRoboBalance.ts:error',
          message: 'Error while fetching user balance, defaulting to 0',
          data: { hasUser: !!user },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const getCurrentBalance = () => {
    return backendBalance !== null ? backendBalance : 0;
  };

  const balance = getCurrentBalance();

  const hasEnoughBalance = (amount: number) => {
    return balance >= amount;
  };

  const deductMoney = async (amount: number, _description?: string) => {
    const current = getCurrentBalance();

    if (amount <= 0) {
      return { success: false, error: 'Invalid amount', newBalance: current };
    }

    if (current < amount) {
      return { success: false, error: 'Insufficient balance', newBalance: current };
    }

    const newBalance = current - amount;
    setBackendBalance(newBalance);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H3',
        location: 'useRoboBalance.ts:deductMoney',
        message: 'Deducted money from Robo balance (client-side)',
        data: { amount, previousBalance: current, newBalance },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return { success: true, newBalance };
  };

  return {
    // Original API
    backendBalance: balance,
    isLoading,
    refreshBalance: fetchBalance,
    getCurrentBalance,

    // Extended API for existing callers
    balance,
    hasEnoughBalance,
    deductMoney,
    refresh: fetchBalance,
    loading: isLoading,
  };
}