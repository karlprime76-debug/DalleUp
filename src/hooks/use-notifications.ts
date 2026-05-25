"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: string | null;
  createdAt: string;
};

export type NotificationData = {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  page: number;
  limit: number;
};

export function useNotifications(pollIntervalMs = 30000) {
  const [data, setData] = useState<NotificationData>({ items: [], unreadCount: 0, totalCount: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (opts?: { unreadOnly?: boolean; page?: number }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts?.unreadOnly) params.set("unreadOnly", "true");
      if (opts?.page) params.set("page", String(opts.page));
      const res = await fetch(`/api/notifications?${params.toString()}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json) setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (ids?: string[]) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) fetchNotifications();
    } catch {
      /* ignore */
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollIntervalMs]);

  return { data, loading, fetchNotifications, markAsRead };
}
