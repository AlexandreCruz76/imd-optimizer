"use client";

import "./globals.css";
import { TerminalNav } from "./components/TerminalNav";
import { WalletProvider } from "./components/WalletProvider";
import { WalletButton } from "./components/WalletButton";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col">
        <WalletProvider>
          {/* Header bar */}
          <header className="border-b border-[#00ff4130] bg-[#0a0a0a] px-4 py-2 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <span className="text-[#00ff41] glow-strong font-bold text-sm tracking-widest">
                ◆ HOOK POOL OPTIMIZER
              </span>
              <span className="text-[#00ff4150] text-xs">v0.1.0</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 text-xs text-[#00ff4160]">
                <span className="live-data">● LIVE</span>
                <span>NET: MAINNET</span>
                <span>POOL: CappedBurnHook</span>
              </div>
              <WalletButton />
            </div>
          </header>

          {/* Navigation */}
          <TerminalNav />

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#00ff4130] px-4 py-2 text-xs text-[#00ff4140] flex justify-between">
            <span>IMD PROTOCOL // $BUILDER VAULT</span>
            <span className="cursor">█</span>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
