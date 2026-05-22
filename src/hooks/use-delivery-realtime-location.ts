"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type DriverLocation = {
  latitude: number;
  longitude: number;
  updatedAt: string;
};

type RealtimeStatus = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED" | "CONNECTING" | "DISABLED";

export function useDeliveryRealtimeLocation(deliveryId: string | undefined) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("CONNECTING");
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const startFallbackPolling = useCallback((id: string) => {
    if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);

    async function poll() {
      try {
        const res = await fetch(`/api/deliveries/${id}/location`);
        const json = await res.json().catch(() => null);
        if (json?.location) {
          setDriverLocation(json.location);
        }
      } catch {
        // silent
      }
    }

    poll();
    fallbackTimerRef.current = setInterval(poll, 10000);
  }, []);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!deliveryId) {
      setStatus("DISABLED");
      return;
    }

    let cancelled = false;
    let client: ReturnType<typeof createClient>;

    try {
      client = createClient();
      supabaseRef.current = client;
    } catch {
      // Supabase not configured — switch to polling immediately
      setStatus("DISABLED");
      startFallbackPolling(deliveryId);
      return;
    }

    const channel = client
      .channel(`delivery-location-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Delivery",
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          if (cancelled) return;
          const newRecord = payload.new as Record<string, unknown>;
          const lat = Number(newRecord.currentLatitude);
          const lng = Number(newRecord.currentLongitude);
          const lastAt = String(newRecord.lastLocationAt ?? new Date().toISOString());
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            setDriverLocation({ latitude: lat, longitude: lng, updatedAt: lastAt });
          }
        }
      )
      .subscribe((state) => {
        if (cancelled) return;
        if (state === "SUBSCRIBED") {
          setStatus("SUBSCRIBED");
          stopFallbackPolling();
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setStatus(state);
          startFallbackPolling(deliveryId);
        } else {
          setStatus("CONNECTING");
        }
      });

    channelRef.current = channel;

    // Start fallback polling immediately until Realtime connects
    startFallbackPolling(deliveryId);

    return () => {
      cancelled = true;
      stopFallbackPolling();
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [deliveryId, startFallbackPolling, stopFallbackPolling]);

  return { driverLocation, status };
}
