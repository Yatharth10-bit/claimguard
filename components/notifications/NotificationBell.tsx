"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const body = await res.json();
      setNotifications(body.notifications || []);
      setUnread(body.unread || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = async (ids?: string[]) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : { mark_all_read: true }),
    });
    await load();
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) void load();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded-xl p-2 text-muted transition hover:bg-stone hover:text-ink"
        aria-label="Notifications"
        onClick={handleOpen}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-high px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-black/[.06] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button type="button" className="text-xs font-semibold text-lavender" onClick={() => void markRead()}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "/dashboard"}
                  className={`block border-b border-slate-50 px-4 py-3 text-sm transition hover:bg-stone ${!n.read_at ? "bg-emerald-50/40" : ""}`}
                  onClick={() => {
                    if (!n.read_at) void markRead([n.id]);
                    setOpen(false);
                  }}
                >
                  <p className="font-semibold">{n.title}</p>
                  {n.body && <p className="mt-1 text-xs text-muted">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-muted">{new Date(n.created_at).toLocaleString()}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}