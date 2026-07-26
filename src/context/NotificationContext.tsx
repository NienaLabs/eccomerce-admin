"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { fetchNotifications, markNotificationRead, deleteNotification as apiDeleteNotification, clearAllNotifications as apiClearAll, NotificationResponse, API_BASE_URL } from '@/lib/api';

interface NotificationContextProps {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  pushPermissionStatus: string;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

import { usePushNotificationsSetup } from '@/hooks/usePushNotificationsSetup';

export const NotificationProvider: React.FC<{ children: React.ReactNode; token: string; userId: string }> = ({ children, token, userId }) => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { permissionStatus, requestPermission } = usePushNotificationsSetup(token);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchNotifications(token);
      const uniqueData = Array.from(new Map(data.map((item) => [item.id, item])).values());
      setNotifications(uniqueData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Remove http(s) and replace with ws(s). The backend authenticates the
    // socket via ?token=, so a missing token is rejected before connect.
    const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/ws/user/${userId}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[NotificationContext] Connected to WebSocket');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification' || data.type === 'new_order' || data.type === 'order_status_changed') {
          // It's a new notification, either format it or reload
          // We'll just append it to state to avoid an extra network request
          const newNotif: NotificationResponse = {
            id: data.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            user_id: data.user_id || '',
            title: data.title || 'New Notification',
            body: data.body || '',
            type: data.notification_type || data.type,
            action_url: data.action_url || '',
            is_read: false,
            created_at: data.created_at || new Date().toISOString(),
          };
          setNotifications((prev) => {
            // Prevent duplicate keys
            if (prev.some(n => n.id === newNotif.id)) {
              return prev;
            }
            return [newNotif, ...prev];
          });
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`[NotificationContext] WS Closed: ${event.code}. Reconnecting...`);
      wsRef.current = null;
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('[NotificationContext] WS Error:', error);
      ws.close();
    };

    wsRef.current = ws;
  }, [userId, token]);

  useEffect(() => {
    if (token) {
      loadNotifications();
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, loadNotifications, connectWebSocket]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationRead(token, id);
    } catch (error) {
      console.error('Failed to mark read', error);
      // Revert if failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    // We don't have a mark all as read API yet, so we mark them individually
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );

    try {
      await Promise.all(unreadIds.map(id => markNotificationRead(token, id)));
    } catch (error) {
      console.error('Failed to mark all read', error);
      // Reload on failure to sync state
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const prev = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    try {
      await apiDeleteNotification(token, id);
    } catch (error) {
      console.error('Failed to delete notification', error);
      setNotifications(prev); // revert
    }
  };

  const clearAll = async () => {
    const prev = notifications;
    setNotifications([]);
    try {
      await apiClearAll(token);
    } catch (error) {
      console.error('Failed to clear notifications', error);
      setNotifications(prev); // revert
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      pushPermissionStatus: permissionStatus,
      requestPushPermission: requestPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
