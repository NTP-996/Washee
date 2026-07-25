import { useEffect, useRef } from 'react';
import { tokenStore } from './auth';

export interface BookingLiveMessage {
  id: string;
  senderRole: 'customer' | 'driver';
  body: string;
  createdAt: string;
}

export interface BookingLiveEvent {
  type: 'status' | 'chat';
  status?: string;
  declineReason?: string;
  startedAt?: string;
  finishedAt?: string;
  message?: BookingLiveMessage;
}

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function liveURL(path: string, token: string): string {
  const url = new URL(path, BASE || window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('token', token);
  return url.toString();
}

// Subscribes to one booking's live status/chat events over a WebSocket,
// reconnecting with backoff. While disconnected, it calls onFallbackPoll every
// 15s (if given) so the caller can keep its data fresh via the normal REST
// fetch it already has — mirroring the resilience of the admin dashboard's
// existing 8s poll, just as a fallback instead of the primary path now.
export function useBookingLive(
  bookingId: string | null,
  role: 'customer' | 'driver',
  onEvent: (ev: BookingLiveEvent) => void,
  onFallbackPoll?: () => void,
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onFallbackPollRef = useRef(onFallbackPoll);
  onFallbackPollRef.current = onFallbackPoll;

  useEffect(() => {
    if (!bookingId) return undefined;
    const token = role === 'driver' ? tokenStore.driverAccess : tokenStore.access;
    if (!token) return undefined;

    const path =
      role === 'driver'
        ? `/api/driver/bookings/${bookingId}/live`
        : `/api/bookings/${bookingId}/live`;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    let attempt = 0;

    function stopPoll(): void {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    function startPoll(): void {
      if (pollTimer || !onFallbackPollRef.current) return;
      pollTimer = setInterval(() => onFallbackPollRef.current?.(), 15000);
    }

    function connect(): void {
      if (closed) return;
      socket = new WebSocket(liveURL(path, token as string));
      socket.onopen = () => {
        attempt = 0;
        stopPoll();
      };
      socket.onmessage = (e) => {
        try {
          onEventRef.current(JSON.parse(e.data as string) as BookingLiveEvent);
        } catch {
          /* ignore a malformed frame */
        }
      };
      socket.onclose = () => {
        if (closed) return;
        startPoll();
        attempt += 1;
        reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 15000));
      };
    }
    connect();

    return () => {
      closed = true;
      socket?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopPoll();
    };
  }, [bookingId, role]);
}
