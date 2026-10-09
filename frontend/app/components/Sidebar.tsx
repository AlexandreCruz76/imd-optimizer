"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { FEATURES, isFeatureLocked, LOCK_REASON, ACTIVE_NETWORK } from "../../lib/deployments";

export function Sidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <aside
      className={`hidden md:flex fixed left-0 top-[72px] bottom-0 z-40 flex-col border-r border-white/[0.06] bg-[#0B0F17]/85 backdrop-blur-xl transition-[transform,width] duration-300 ease-out ${
        open ? "w-60 translate-x-0" : "w-60 -translate-x-full"
      }`}
    >
      <div className="flex flex-col gap-1 px-4 py-6 h-full">
        <span className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-[#6B7A88]">
          Navigation
        </span>
        {FEATURES.map((item) => {
          const locked = isFeatureLocked(item);
          const active = !locked && pathname === item.href;
          const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors border ${
            locked
              ? "text-slate-600 border-transparent cursor-not-allowed"
              : active
              ? "bg-[#00F58C]/10 text-[#00F58C] border-[#00F58C]/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border-transparent"
          }`;

          const content = (
            <>
              <span className="w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {locked ? (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  title={LOCK_REASON}
                >
                  🔒 Mainnet
                </span>
              ) : (
                item.badge && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#00F58C]/15 text-[#00F58C] border border-[#00F58C]/30">
                    {item.badge}
                  </span>
                )
              )}
            </>
          );

          return locked ? (
            <span key={item.key} className={cls} title={LOCK_REASON} aria-disabled="true">
              {content}
            </span>
          ) : (
            <Link key={item.key} href={item.href} className={cls}>
              {content}
            </Link>
          );
        })}
        <div className="mt-auto px-3 text-[10px] text-slate-600 font-mono leading-relaxed">
          {ACTIVE_NETWORK === "sepolia" ? "Sepolia Testnet" : "Ethereum Mainnet"}
          <br />
          Unaudited
        </div>
      </div>
    </aside>
  );
}
