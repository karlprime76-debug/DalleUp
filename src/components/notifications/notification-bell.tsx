"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { data, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const unread = data.unreadCount;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) markAsRead();
        }}
        className="relative rounded-full p-2 transition hover:bg-neutral-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-dalle-charcoal" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-neutral-100 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black text-dalle-charcoal">Notifications</p>
            {unread > 0 ? (
              <button onClick={() => markAsRead()} className="text-xs font-bold text-dalle-orange">
                Tout marquer comme lu
              </button>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">Aucune notification</p>
            ) : (
              data.items.map((n) => (
                <div
                  key={n.id}
                  className={`mb-2 rounded-xl p-3 text-sm ${n.read ? "bg-neutral-50" : "bg-orange-50"}`}
                >
                  <p className="font-bold text-dalle-charcoal">{n.title}</p>
                  <p className="mt-1 text-neutral-600">{n.message}</p>
                  <p className="mt-1 text-xs text-neutral-400">{new Date(n.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
