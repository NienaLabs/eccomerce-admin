"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { clientApi, type NotificationResponse } from '@/lib/api';
import { usePushNotificationsSetup } from '@/hooks/usePushNotificationsSetup';

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

const POLL_MS = 30000;

// Auth flows through the same-origin proxy (httpOnly cookie), so no token is
// needed here. Real-time delivery uses polling — a persistent WebSocket can't
// run on the Lambda backend, so this is the reliable path.
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { permissionStatus, requestPermission } = usePushNotificationsSetup();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    try {
      const res = await clientApi('/notifications/');
      if (!res.ok) return;
      const data: NotificationResponse[] = await res.json();
      const unique = Array.from(new Map(data.map((item) => [item.id, item])).values());
      setNotifications(unique);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The first load is scheduled on the timer rather than called straight from
    // the effect body, so every state update lands in a callback from an
    // external system (the poll) instead of cascading a synchronous re-render.
    const initial = setTimeout(loadNotifications, 0);
    const poll = setInterval(loadNotifications, POLL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(poll);
    };
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await clientApi(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (error) {
      console.error('Failed to mark read', error);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await Promise.all(unreadIds.map((id) => clientApi(`/notifications/${id}/read`, { method: 'PATCH' })));
    } catch (error) {
      console.error('Failed to mark all read', error);
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const prev = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    try {
      await clientApi(`/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete notification', error);
      setNotifications(prev);
    }
  };

  const clearAll = async () => {
    const prev = notifications;
    setNotifications([]);
    try {
      await clientApi('/notifications/clear-all', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to clear notifications', error);
      setNotifications(prev);
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
      requestPushPermission: requestPermission,
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
