"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDriverLocationTracking(orderId: string) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    try {
      const res = await fetch(`/api/deliveries/${orderId}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
      if (res.ok) {
        setLastSent(new Date().toLocaleTimeString("fr-FR"));
        setError("");
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? "Erreur envoi position.");
      }
    } catch {
      setError("Réseau indisponible.");
    }
  }, [orderId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActive(false);
  }, []);

  const startTracking = useCallback(() => {
    setError("");
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocation(pos);
        setActive(true);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Permission de localisation refusée. Activez-la dans les paramètres du navigateur."
            : "Impossible d’obtenir la position."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => sendLocation(pos),
      () => {
        // silent
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos),
        () => {
          // silent
        }
      );
    }, 8000);
  }, [sendLocation]);

  return { active, error, lastSent, startTracking, stopTracking };
}
