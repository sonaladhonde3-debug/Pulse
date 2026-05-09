import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '@/store/notifications';
import { useAuthStore } from '@/store/auth';
import Cookie from 'js-cookie';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const { addNotification, setWSConnected } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;

    try {
      const token = Cookie.get('access_token');
      if (!token) return;

      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/notifications/';
      const wsUrl = `${WS_URL}?token=${token}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWSConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connection_established') {
            console.log('WebSocket connection established');
          } else if (data.type === 'notification') {
            // Add notification to store
            addNotification(data.data);
          } else if (data.type === 'pong') {
            console.log('WebSocket pong received');
          } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setWSConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWSConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setWSConnected(false);
    }
  }, [isAuthenticated, user, addNotification, setWSConnected]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setWSConnected(false);
  }, [setWSConnected]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const markAsRead = useCallback((notificationId: number) => {
    send({
      type: 'mark_as_read',
      notification_id: notificationId,
    });
  }, [send]);

  const getUnreadCount = useCallback(() => {
    send({
      type: 'get_unread_count',
    });
  }, [send]);

  const ping = useCallback(() => {
    send({
      type: 'ping',
    });
  }, [send]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    send,
    markAsRead,
    getUnreadCount,
    ping,
    connect,
    disconnect,
  };
};
