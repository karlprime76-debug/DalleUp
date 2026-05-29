"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";

const TOAST_DURATION = 2800;
const EXIT_DURATION = 300;

function clearTimerRef(ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

export function CartFeedback() {
  const { message, clearMessage } = useCart();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const hide = useCallback((delay = 0) => {
    clearTimerRef(timerRef);
    if (delay > 0) {
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setExiting(false);
        clearMessage();
        timerRef.current = null;
      }, delay);
    } else {
      setVisible(false);
      setExiting(false);
      clearMessage();
    }
  }, [clearMessage]);

  const startExit = useCallback((delay = EXIT_DURATION) => {
    clearTimerRef(timerRef);
    setExiting(true);
    timerRef.current = setTimeout(() => {
      hide(0);
      timerRef.current = null;
    }, delay);
  }, [hide]);

  // Afficher / cacher automatiquement selon le message
  useEffect(() => {
    clearTimerRef(timerRef);
    if (!message) {
      setVisible(false);
      setExiting(false);
      return;
    }
    setExiting(false);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      startExit(EXIT_DURATION);
    }, TOAST_DURATION);

    return () => clearTimerRef(timerRef);
  }, [message, startExit]);

  // Masquer au changement de page
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (visible) {
        startExit(150);
      }
    }
  }, [pathname, visible, startExit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimerRef(timerRef);
  }, []);

  if (!visible && !exiting) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      <div
        className={[
          "pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-3xl bg-dalle-charcoal px-5 py-3 text-sm font-black text-white shadow-2xl transition-all duration-300 ease-out md:max-w-[480px]",
          exiting ? "translate-y-[-10px] opacity-0" : "translate-y-0 opacity-100",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="shrink-0 text-dalle-lime" size={20} />
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={() => startExit(150)}
          className="shrink-0 rounded-full p-1 text-white/70 hover:text-white"
          aria-label="Fermer la notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
