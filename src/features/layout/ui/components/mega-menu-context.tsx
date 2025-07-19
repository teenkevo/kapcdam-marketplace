"use client";

import * as React from "react";

interface MegaMenuContextType {
  openMenus: Set<string>;
  registerMenu: (id: string) => void;
  unregisterMenu: (id: string) => void;
  setMenuOpen: (id: string, isOpen: boolean) => void;
}

const MegaMenuContext = React.createContext<MegaMenuContextType | undefined>(
  undefined
);

export function MegaMenuProvider({ children }: { children: React.ReactNode }) {
  const [openMenus, setOpenMenus] = React.useState<Set<string>>(new Set());

  const registerMenu = React.useCallback((id: string) => {
    // Menu registration is handled automatically when setMenuOpen is called
  }, []);

  const unregisterMenu = React.useCallback((id: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const setMenuOpen = React.useCallback((id: string, isOpen: boolean) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Manage body scroll based on whether any menu is open
  React.useEffect(() => {
    if (openMenus.size > 0) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [openMenus.size]);

  const value = React.useMemo(
    () => ({
      openMenus,
      registerMenu,
      unregisterMenu,
      setMenuOpen,
    }),
    [openMenus, registerMenu, unregisterMenu, setMenuOpen]
  );

  return (
    <MegaMenuContext.Provider value={value}>
      {children}
    </MegaMenuContext.Provider>
  );
}

export function useMegaMenuContext() {
  const context = React.useContext(MegaMenuContext);
  if (context === undefined) {
    throw new Error(
      "useMegaMenuContext must be used within a MegaMenuProvider"
    );
  }
  return context;
}
