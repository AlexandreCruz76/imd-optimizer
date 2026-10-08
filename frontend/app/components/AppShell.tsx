"use client";

import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

function Shell({ children }: { children: ReactNode }) {
  const { open } = useSidebar();

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
      <Navbar />
      <Sidebar />
      <div
        className={`transition-[padding-left] duration-300 ease-out ${
          open ? "md:pl-60" : "md:pl-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}
