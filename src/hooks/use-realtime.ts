import { useEffect, useRef, useState } from "react";
import { WS_URL } from "@/lib/api";

interface RealtimeParams {
  role: "customer" | "driver";
  userId?: string | null;
  token?: string | null;
  onEvent: (event: string, data: Record<string, unknown>) => void;
}

/**
 * WebSocket connection to /ws/{role}/{userId}. Auto-reconnects every 2s and
 * keeps the socket warm with ping/pong. Events are delivered to `onEvent` —
 * keep it stable or accept re-renders (the ref means a fresh closure is used
 * without re-opening the socket).
 */
export function useRealtime({ role, userId, token, onEvent }: RealtimeParams): boolean {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;

    let ws: WebSocket | null = null;
    let disposed = false;
    let retryTimer = 0;
    let pingTimer = 0;

    const connect = () => {
      if (disposed) return;
      try {
        ws = new WebSocket(`${WS_URL}/ws/${role}/${userId}?token=${encodeURIComponent(token)}`);
      } catch {
        retryTimer = window.setTimeout(connect, 3000);
        return;
      }

      ws.onopen = () => setConnected(true);

      ws.onmessage = (message) => {
        if (message.data === "ping") return;
        try {
          const parsed = JSON.parse(message.data) as { event?: string; data?: Record<string, unknown> };
          // The server's pong is a keep-alive ack, not an app event — delivering
          // it would make every 25 s ping look like something to react to.
          if (!parsed?.event || parsed.event === "pong") return;
          handler.current(parsed.event, parsed.data ?? {});
        } catch {
          // non-JSON frame — ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!disposed) retryTimer = window.setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();

      pingTimer = window.setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
      }, 25_000);
    };

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      window.clearInterval(pingTimer);
      ws?.close();
    };
  }, [role, userId, token]);

  return connected;
}
