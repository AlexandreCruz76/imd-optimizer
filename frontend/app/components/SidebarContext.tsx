"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SidebarCtx = {
  open: boolean;
  toggle: () => void;
};

const Ctx = createContext<SidebarCtx>({ open: true, toggle: () => {} });

export function useSidebar() {
  return useContext(Ctx);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("imd-sidebar");
    if (saved !== null) setOpen(saved === "1");
  }, []);

  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem("imd-sidebar", v ? "0" : "1");
      return !v;
    });
  };

  return <Ctx.Provider value={{ open, toggle }}>{children}</Ctx.Provider>;
}
