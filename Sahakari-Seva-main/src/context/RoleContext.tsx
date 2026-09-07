// mobile/src/context/RoleContext.tsx
// Exposes the active session role (customer / worker / admin) AND the
// role-aware notification feed to any component — powers the badge and
// pop-up notification bar. The feed is owned here (not per-screen) so the
// unread badge is correct immediately on login and read-state stays in sync
// across every screen.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserRole, Notification } from '../types';
import { ApiClient } from '../services/apiClient';

// userId used by the mock/backend to scope each role's feed.
const ROLE_USER_ID: Record<string, string> = {
  customer: 'p0000000-0000-0000-0000-000000000002',
  worker: 'w0000000-0000-0000-0000-000000000001',
  admin: 'admin-demo',
};

interface RoleContextValue {
  role: UserRole | null;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  notifications: [],
  unreadCount: 0,
  loading: false,
  markRead: async () => {},
  markAllRead: async () => {},
  refresh: async () => {},
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ role: UserRole | null; children: React.ReactNode }> = ({
  role,
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  // Guard against overlapping refreshes after role switches.
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const userId = role ? ROLE_USER_ID[role] : undefined;
      const list = await ApiClient.getNotifications(userId);
      setNotifications(list);
    } catch {
      // Handled by ApiClient fallback
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [role]);

  // Fetch the feed whenever the role changes (and on first mount).
  useEffect(() => {
    refresh();
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    await ApiClient.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    await Promise.all(unread.map(n => ApiClient.markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <RoleContext.Provider
      value={{ role, notifications, unreadCount, loading, markRead, markAllRead, refresh }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export default RoleProvider;