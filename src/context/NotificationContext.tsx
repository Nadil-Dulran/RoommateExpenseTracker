import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification } from '../types/notification';
import { sseService } from '../services/sseService';
import { notificationService } from '../services/notificationService';

type NotificationContextValue = {
  notifications: Notification[];
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  connectionError: string | null;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const READ_RETENTION_DAYS = 2;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [authFingerprint, setAuthFingerprint] = useState('none:none');

  useEffect(() => {
    let isMounted = true;

    const readAuthFingerprint = async () => {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('userId'),
      ]);

      const nextFingerprint = `${token ?? 'none'}:${userId ?? 'none'}`;

      if (isMounted) {
        setAuthFingerprint(prev => (prev === nextFingerprint ? prev : nextFingerprint));
      }
    };

    readAuthFingerprint();
    const interval = setInterval(readAuthFingerprint, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const [token] = authFingerprint.split(':');

    if (!token || token === 'none') {
      sseService.disconnect();
      setNotifications([]);
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    let cancelled = false;

    const connect = async () => {
      try {
        // Best-effort cleanup of stale read notifications.
        notificationService.purgeReadOlderThan(READ_RETENTION_DAYS).catch(() => {});

        try {
          const initialUnread = await notificationService.getNotifications(true);
          if (!cancelled) {
            setNotifications(initialUnread);
          }
        } catch (error: any) {
          if (!cancelled) {
            setConnectionError(error?.message ?? 'Failed to load unread notifications');
          }
        }

        await sseService.connect((incoming) => {
          let normalized = notificationService.normalizeNotification(incoming);

          if (normalized.read) {
            return;
          }

          setNotifications(prev => [
            normalized,
            ...prev.filter(item => item.id !== normalized.id),
          ]);
        }, {
          onOpen: () => {
            if (!cancelled) {
              setIsConnected(true);
              setConnectionError(null);
            }
          },
          onError: (error) => {
            if (!cancelled) {
              setIsConnected(false);
              setConnectionError(typeof error?.message === 'string' ? error.message : 'SSE connection failed');
            }
          },
        });
      } catch (error: any) {
        if (!cancelled) {
          setIsConnected(false);
          setConnectionError(error?.message ?? 'Unable to initialize notifications');
        }
      }
    };

    setNotifications([]);
    connect();

    return () => {
      cancelled = true;
      sseService.disconnect();
    };
  }, [authFingerprint]);

  const markAsRead = (id: string) => {
    const previous = notifications;
    setNotifications(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
          : item
      )
    );

    notificationService.markAsRead(id).catch(() => {
      setNotifications(previous);
    });

    notificationService.purgeReadOlderThan(READ_RETENTION_DAYS).catch(() => {});
  };

  const markAllAsRead = () => {
    const previous = notifications;
    setNotifications(prev =>
      prev.map(item =>
        item.read
          ? item
          : { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
      )
    );

    notificationService.markAllAsRead().catch(() => {
      setNotifications(previous);
    });

    notificationService.purgeReadOlderThan(READ_RETENTION_DAYS).catch(() => {});
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connectionError,
  }), [notifications, isConnected, connectionError]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
};
