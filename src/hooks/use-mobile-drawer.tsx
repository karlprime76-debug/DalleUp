"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const MobileDrawerContext = createContext<{
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export function MobileDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileDrawerContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileDrawerContext.Provider>
  );
}

export function useMobileDrawer() {
  return useContext(MobileDrawerContext);
}
