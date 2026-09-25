"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "DASHBOARD", shortcut: "F1" },
  { href: "/swap", label: "SWAP", shortcut: "F2" },
  { href: "/burns", label: "BURNS", shortcut: "F3" },
  { href: "/arbitrage", label: "ARBITRAGE", shortcut: "F4" },
  { href: "/oracle", label: "ORACLE", shortcut: "F5" },
  { href: "/nft-mint", label: "GENESIS KEY", shortcut: "F6" },
  { href: "/staking", label: "STAKING", shortcut: "F7" },
  { href: "/docs", label: "DOCS", shortcut: "F8" },
];

export function TerminalNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#00ff4130] bg-[#0d0d0d] px-4 py-2 flex items-center gap-1 overflow-x-auto">
      <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
        <img src="/pepe/profile.jpeg" alt="Agentic Frog" className="w-6 h-6 rounded-full border border-[#00ff41]" />
        <span className="text-[#00ff41] glow-strong font-bold text-xs tracking-widest hidden md:inline">
          OPTIMIZER
        </span>
      </Link>
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
