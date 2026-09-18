"use client";

import "./globals.css";
import { TerminalNav } from "./components/TerminalNav";
import { WalletProvider } from "./components/WalletProvider";
import { WalletButton } from "./components/WalletButton";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-[#0a0a0a]">
        <WalletProvider>
          {/* Banner Header */}
          <header className="relative border-b border-[#00ff4130] bg-[#0a0a0a]">
            {/* Banner Image */}
            <div className="w-full h-32 md:h-44 overflow-hidden">
              <img 
                src="/pepe/banner.jfif" 
                alt="Agentic Frog Banner" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3">
                <img 
                  src="/pepe/profile.jpeg" 
                  alt="Agentic Frog" 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#00ff41] glow" 
                />
                <div>
                  <span className="text-[#00ff41] glow-strong font-bold text-sm md:text-base tracking-widest">
                    OPTIMIZER
                  </span>
                  <div className="text-[#00ff4150] text-[10px] md:text-xs">The Agentic V4 Meta-Hook</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 text-xs text-[#00ff4160]">
                  <span className="live-data">● LIVE</span>
                  <span>SEPOLIA</span>
                </div>
                <WalletButton />
              </div>
            </div>
          </header>

          <TerminalNav />

          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>

          <footer className="border-t border-[#00ff4130] px-4 py-3 text-xs text-[#00ff4140]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <img src="/pepe/profile.jpeg" alt="Agentic Frog" className="w-4 h-4 rounded-full" />
                <span>OPTIMIZER PROTOCOL — The Agentic V4 Meta-Hook</span>
              </div>
              <div className="flex gap-4">
                <a href="https://github.com/optimizer-protocol" target="_blank" className="hover:text-[#00ff41]">GitHub</a>
                <a href="https://twitter.com/OptimizerProtocol" target="_blank" className="hover:text-[#00ff41]">Twitter</a>
                <span className="cursor">█</span>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
