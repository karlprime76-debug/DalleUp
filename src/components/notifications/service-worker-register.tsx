"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          if (process.env.NODE_ENV !== "production") console.log("[SW] registered");
        })
        .catch((err) => {
          if (process.env.NODE_ENV !== "production") console.warn("[SW] registration failed", err);
        });
    }
  }, []);

  return null;
}
