"use client";

import { Button } from "@/components/ui/button";
import { useDriverLocationTracking } from "@/hooks/use-driver-location-tracking";
import { MapPin, MapPinOff, Navigation } from "lucide-react";

type DriverTrackingToggleProps = {
  orderId: string;
  onStatusChange?: (active: boolean) => void;
};

export function DriverTrackingToggle({ orderId, onStatusChange }: DriverTrackingToggleProps) {
  const { active, error, lastSent, startTracking, stopTracking } = useDriverLocationTracking(orderId);

  function handleStart() {
    startTracking();
    onStatusChange?.(true);
  }

  function handleStop() {
    stopTracking();
    onStatusChange?.(false);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        {active ? (
          <Button type="button" variant="dark" onClick={handleStop}>
            <MapPinOff size={18} />
            Arrêter le suivi
          </Button>
        ) : (
          <Button type="button" variant="dark" onClick={handleStart}>
            <MapPin size={18} />
            Activer le suivi
          </Button>
        )}
        {active && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-700">
            <Navigation size={14} className="animate-pulse" />
            Suivi actif
          </span>
        )}
      </div>
      {active && lastSent ? (
        <p className="text-xs text-neutral-500">Dernière position envoyée : {lastSent}</p>
      ) : null}
      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
      <p className="text-xs text-neutral-400">
        Votre position sera partagée uniquement pendant cette livraison.
      </p>
    </div>
  );
}
