import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

/**
 * WebSocketProvider
 * Manages a single authenticated WS connection per session.
 * Provides `subscribe(type, callback)` for any component to listen to server events.
 * Reconnects automatically on disconnect (unless explicitly closed).
 */
export const WebSocketProvider = ({ children, token }) => {
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map()); // Map<type, Set<callback>>
  const reconnectTimerRef = useRef(null);
  const isIntentionalClose = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback((type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(callback);

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(type)?.delete(callback);
    };
  }, []);

  const dispatch = useCallback((type, data) => {
    const callbacks = listenersRef.current.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try { cb(data); } catch (err) { console.error('[WS] Listener error:', err); }
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent auto-reconnect loop
      wsRef.current.close();
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      clearTimeout(reconnectTimerRef.current);
    };

    ws.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data);
        if (type) dispatch(type, data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (e) => {
      setIsConnected(false);
      // 4001 = intentional unauthorized close, don't reconnect
      if (e.code === 4001 || isIntentionalClose.current) return;
      // Reconnect after 3 seconds
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      // onclose fires after onerror, which handles reconnect
    };
  }, [token, dispatch]);

  useEffect(() => {
    isIntentionalClose.current = false;
    if (token) {
      connect();
    }

    return () => {
      isIntentionalClose.current = true;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      setIsConnected(false);
    };
  }, [token, connect]);

  return (
    <WebSocketContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
