import {
  AuthPayload,
  NotificationEvent,
  NotificationPreferences,
  UserSummary,
} from "@shared/api";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, getStoredToken, storeToken } from "./api";

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  unreadCount: number;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  signup: (payload: {
    username: string;
    displayName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function eventTitle(type: NotificationEvent["type"], message?: string) {
  if (type === "new_notification") return message || "New activity";
  return "Notification update";
}

function applyAuthPayload(payload: AuthPayload, setUser: (value: UserSummary | null) => void, setToken: (value: string | null) => void) {
  storeToken(payload.token);
  setToken(payload.token);
  setUser(payload.user);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [meResponse, countResponse] = await Promise.all([
          api.auth.me(token),
          api.notifications.unreadCount(token),
        ]);
        setUser(meResponse.user);
        setUnreadCount(countResponse.unreadCount);
      } catch (_error) {
        storeToken(null);
        setToken(null);
        setUser(null);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;

    let closed = false;
    const stream = new EventSource(`/api/v1/stream/notifications?token=${token}`);
    stream.onmessage = (event) => {
      if (closed) return;

      try {
        const payload = JSON.parse(event.data) as NotificationEvent;
        if (payload.type === "unread_count" && typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }

        if (payload.type === "new_notification" && payload.notification) {
          setUnreadCount((current) => current + 1);
          toast(eventTitle(payload.type, payload.notification.message), {
            description: `From @${payload.notification.sender.username}`,
          });
        }
      } catch (_error) {
        // Ignore malformed event payloads.
      }
    };

    stream.onerror = () => {
      stream.close();
    };

    return () => {
      closed = true;
      stream.close();
    };
  }, [token, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      unreadCount,
      loading,
      async login(payload) {
        const auth = await api.auth.login(payload);
        applyAuthPayload(auth, setUser, setToken);
        const count = await api.notifications.unreadCount(auth.token);
        setUnreadCount(count.unreadCount);
      },
      async signup(payload) {
        const auth = await api.auth.signup(payload);
        applyAuthPayload(auth, setUser, setToken);
        setUnreadCount(0);
      },
      async logout() {
        if (token) {
          try {
            await api.auth.logout(token);
          } catch (_error) {
            // Keep logout resilient even if the server session is gone.
          }
        }

        storeToken(null);
        setToken(null);
        setUser(null);
        setUnreadCount(0);
      },
      async refreshMe() {
        if (!token) return;
        const [meResponse, countResponse] = await Promise.all([
          api.auth.me(token),
          api.notifications.unreadCount(token),
        ]);
        setUser(meResponse.user);
        setUnreadCount(countResponse.unreadCount);
      },
      setUnreadCount,
    }),
    [loading, token, unreadCount, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export async function loadNotificationPreferences(token: string) {
  const response = await api.notifications.preferences(token);
  return response.preferences as NotificationPreferences;
}
