"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

export type MapLocation = {
  lat: number;
  lng: number;
  label: string;
};

type OrderTrackingMapProps = {
  restaurantLocation?: MapLocation;
  customerLocation?: MapLocation;
  driverLocation?: MapLocation;
  height?: string;
};

export function OrderTrackingMap({
  restaurantLocation,
  customerLocation,
  driverLocation,
  height = "320px",
}: OrderTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      // Import CSS dynamically
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current).setView([6.37, 2.39], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      // Restaurant marker
      if (restaurantLocation) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#f97316;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:grid;place-items:center;color:white;font-weight:bold;font-size:12px;">R</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([restaurantLocation.lat, restaurantLocation.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>${restaurantLocation.label}</b><br/>Restaurant`);
        markersRef.current.push(marker);
        bounds.extend([restaurantLocation.lat, restaurantLocation.lng]);
      }

      // Customer marker
      if (customerLocation) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:grid;place-items:center;color:white;font-weight:bold;font-size:12px;">C</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([customerLocation.lat, customerLocation.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>${customerLocation.label}</b><br/>Adresse de livraison`);
        markersRef.current.push(marker);
        bounds.extend([customerLocation.lat, customerLocation.lng]);
      }

      // Driver marker
      if (driverLocation) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:grid;place-items:center;color:white;font-weight:bold;font-size:12px;">L</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([driverLocation.lat, driverLocation.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>${driverLocation.label}</b><br/>Livreur`);
        markersRef.current.push(marker);
        bounds.extend([driverLocation.lat, driverLocation.lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [restaurantLocation, customerLocation, driverLocation]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: "1rem", overflow: "hidden" }}
      className="border border-black/5 shadow-sm"
    />
  );
}
