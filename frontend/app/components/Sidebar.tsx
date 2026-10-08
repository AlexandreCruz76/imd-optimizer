"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const shortcuts = [
  { href: "/swap", label: "Swap", icon: "⇄" },
  { href: "/pool", label: "Meta Hook Pool", icon: "◈" },
  { href: "/nft-mint", label: "Mint NFT", icon: "◆" },
  { href: "/arbitrage", label: "Arbitrage", icon: "⚡" },
  { href: "/staking", label: "Staking", icon: "▣" },
  { href: "/docs", label: "Docs", icon: "☰" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-[72px] bottom-0 w-60 z-40 flex-col gap-1 border-r border-white/[0.06] bg-[#0B0F17]/85 backdrop-blur-xl px-4 py-6">
      <span className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-[#6B7A88]">
        Shortcuts
      </span>
      {shortcuts.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors border ${
              active
                ? "bg-[#00F58C]/10 text-[#00F58C] border-[#00F58C]/20"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04] border-transparent"
            }`}
          >
            <span className="w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.href === "/nft-mint" && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#00F58C]/15 text-[#00F58C] border border-[#00F58C]/30">
                NFT
              </span>
            )}
          </Link>
        );
      })}
      <div className="mt-auto px-3 text-[10px] text-slate-600 font-mono leading-relaxed">
        Sepolia Testnet
        <br />
        Unaudited
      </div>
    </aside>
  );
}
