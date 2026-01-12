import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/api';
import type { BackendUserNotification } from '../types';
import useAuth from '../hooks/useAuth';
import { io, Socket } from 'socket.io-client';

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<BackendUserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      navigate('/login');
      return;
    }

    loadNotifications();

    // Set up Socket.IO connection for real-time notifications
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://backend-dawn-wind-7381.fly.dev';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      // Join user-specific room
      socket.emit('join-user-room', user.uid);
    });

    // Listen for new notifications
    socket.on('new-notification', (data: { notification: BackendUserNotification }) => {
      // If userId is null, it means notification was sent to all users
      // If userId matches current user, it's for this specific user
      if (!data.notification.userId || data.notification.userId === user.uid) {
        // Reload notifications to get the actual record from database
        // (since "all users" creates individual records per user)
        loadNotifications();
      }
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.uid]);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const response = await notificationApi.getUserNotifications(user.uid);
      if (response.success && Array.isArray(response.data)) {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    try {
      setMarkingAll(true);
      const response = await notificationApi.markAllAsRead(user.uid);
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-400 rounded-full border-t-transparent animate-spin mb-4"></div>
        <p className="text-slate-600">Loading notifications...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-[60vh] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-600">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingAll ? 'Marking...' : 'Mark All as Read'}
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-2">No notifications</p>
            <p className="text-slate-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  notification.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-purple-50 border-purple-200 shadow-sm'
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification._id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      notification.isRead ? 'bg-slate-300' : 'bg-purple-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className={`text-base font-semibold ${
                          notification.isRead ? 'text-slate-700' : 'text-slate-900'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mb-2 ${
                        notification.isRead ? 'text-slate-600' : 'text-slate-700'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.isRead && notification.readAt && (
                        <span className="text-xs text-slate-400">
                          Read {formatDate(notification.readAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
