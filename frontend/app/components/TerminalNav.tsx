"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "DASHBOARD", shortcut: "F1" },
  { href: "/analyze", label: "ANALYZE", shortcut: "F2" },
  { href: "/monitor", label: "MONITOR", shortcut: "F3" },
  { href: "/arbitrage", label: "ARBITRAGE", shortcut: "F4" },
  { href: "/lp", label: "LP SIM", shortcut: "F5" },
  { href: "/burns", label: "BURNS", shortcut: "F6" },
  { href: "/subscribe", label: "SUBSCRIBE", shortcut: "F7" },
  { href: "/vault", label: "VAULT", shortcut: "F8" },
  { href: "/adoption", label: "ADOPT", shortcut: "F9" },
  { href: "/docs", label: "DOCS", shortcut: "F10" },
  { href: "/admin", label: "ADMIN", shortcut: "F11" },
  { href: "/wallet-test", label: "WALLET", shortcut: "F12" },
];

export function TerminalNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#00ff4130] bg-[#0d0d0d] px-4 py-1 flex items-center gap-1 overflow-x-auto">
      <span className="text-[#00ff4140] text-xs mr-2 shrink-0">~/optimizer$</span>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1 text-xs tracking-wider transition-all shrink-0 ${
              isActive
                ? "bg-[#00ff41] text-[#0a0a0a] font-bold"
                : "text-[#00ff4170] hover:text-[#00ff41] hover:bg-[#00ff4110]"
            }`}
          >
            [{link.shortcut}] {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
