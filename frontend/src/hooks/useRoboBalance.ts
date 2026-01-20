// hooks/useRoboBalance.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { balanceApi } from '../services/api';
import useAuth from './useAuth';
import { io, Socket } from "socket.io-client";

export default function useRoboBalance() {
  const { user } = useAuth();
  const [backendBalance, setBackendBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // ✅ 添加缺失的 socketRef 定义
  const socketRef = useRef<Socket | null>(null);

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
      // console.error('Failed to fetch balance:', error);
      setBackendBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
    
    // ✅ Real-time balance polling - refresh every 3 seconds
    // This ensures balance updates across all tabs/devices
    if (user?.uid) {
      // 先清理之前的连接
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Connect to Socket.IO server - use environment variable with fallback to production
      const socketUrl = import.meta.env.VITE_SOCKET_URL ;
      
      if (!socketUrl) {
        console.warn('⚠️ VITE_SOCKET_URL or VITE_API_URL environment variable is not set, using fallback');
      }
      
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        // Add API key as query parameter or auth for Socket.IO
        auth: {
          apiKey: import.meta.env.VITE_API_KEY
        }
      });

      socket.on('connect', () => {
        // console.log('✅ Socket.IO connected:', socket.id);
        // Join user-specific room
        socket.emit('join-user-room', user.uid);
      });

      socket.on('disconnect', () => {
        // console.log('❌ Socket.IO disconnected');
      });

      // Listen for balance updates
      socket.on('balance-updated', (data: {
        userId: string;
        balance: number;
        previousBalance: number;
        amount: number;
        transactionId: string;
        timestamp: string;
      }) => {
        // console.log('📡 Real-time balance update received:', data);
        if (data.userId === user.uid) {
          // Update balance immediately
          setBackendBalance(data.balance);
          setIsLoading(false);
        }
      });

      socketRef.current = socket;

      // Fallback: Still poll every 10 seconds as backup (reduced frequency)
      pollingIntervalRef.current = setInterval(() => {
        fetchBalance();
      }, 10000); // Poll every 10 seconds as backup
    }

    // Cleanup on unmount or user change
    return () => {
      // 使用可选链操作符安全地清理
      socketRef.current?.disconnect();
      socketRef.current = null;
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchBalance, user?.uid]); // Only depend on fetchBalance and user.uid, not isLoading

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

    return { success: true, newBalance };
  };

  // Optimistic balance update - update UI immediately before server confirms
  // Socket.IO event will correct any discrepancies
  const updateBalanceOptimistically = useCallback((amount: number) => {
    const current = getCurrentBalance();
    if (current !== null) {
      const newBalance = current - amount;
      setBackendBalance(newBalance);
    }
  }, []);

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
    
    // Optimistic update for instant UI feedback
    updateBalanceOptimistically,
  };
}