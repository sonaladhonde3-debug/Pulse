import { create } from 'zustand';
import { api } from '@/lib/api';

interface Notification {
  id: number;
  actor: any;
  recipient: number;
  notification_type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  message: string;
  is_read: boolean;
  is_sent: boolean;
  created_at: string;
  read_at?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  getUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => Promise<void>;
  setWSConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  wsConnected: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.notifications.list();
      set({ notifications: response.data.results || response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      set({ unreadCount: response.data.unread_count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      await api.notifications.markAsRead(id.toString());
      
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      await api.notifications.markAllAsRead({ mark_all: true });
      
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  clearNotifications: async () => {
    try {
      await api.notifications.deleteAll();
      set({ notifications: [], unreadCount: 0 });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setWSConnected: (connected: boolean) => {
    set({ wsConnected: connected });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
