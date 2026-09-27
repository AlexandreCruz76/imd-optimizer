"use client";

import Link from "next/link";
import { useState } from "react";
import "./globals.css";
import { TerminalNav } from "./components/TerminalNav";
import { SectionBackground, BACKGROUNDS } from "./components/BackgroundElements";
import { WalletProvider } from "./components/WalletProvider";
import { WalletButton } from "./components/WalletButton";
import TierFunnel from "./components/TierFunnel";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DOCS' | string>('DASHBOARD');

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-[var(--color-bg-deep)]">
        <WalletProvider>
          {/* Floating Header */}
          <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1400px] px-4 animate-slide-down">
            <div className="glass-panel-elevated px-5 py-3 flex items-center justify-between gap-4">
              {/* Brand */}
              <Link href="/" className="flex items-center gap-3 shrink-0" style={{ textDecoration: "none" }}>
                <div className="relative">
                  <img 
                    src="/images/avatar.png" 
                    alt="Agentic Frog" 
                    className="w-10 h-10 rounded-full border-2 border-[var(--color-emerald-bright)] object-cover"
                    style={{ objectPosition: "center 25%" }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[var(--color-emerald-bright)] border-2 border-[var(--color-bg-deep)] animate-pulse" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-[var(--color-emerald-bright)] font-bold text-sm tracking-widest">
                    OPTIMIZER
                  </span>
                  <div className="text-[var(--color-text-muted)] text-[10px] leading-none">The Agentic V4 Meta-Hook</div>
                </div>
              </Link>

              {/* Center - Network Status */}
              <div className="hidden md:flex items-center gap-3">
                <div className="network-badge connected">
                  <span className="pulse-dot" aria-hidden="true"></span>
                  <span className="text-[var(--color-emerald-bright)]">SEPOLIA</span>
                </div>
              </div>

              {/* Right - Wallet */}
              <WalletButton />
            </div>
          </header>

          {/* Navigation Bar */}
          <nav className="fixed top-[80px] left-1/2 -translate-x-1/2 z-40 w-full max-w-[1400px] px-4 animate-slide-down stagger-1" style={{ animationDelay: "100ms" }}>
            <TerminalNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>

          {/* Main Content */}
          <main className="flex-1 pt-[160px] pb-12 px-4 md:px-6">
            <div className="max-w-[1400px] mx-auto">
              {activeTab === 'DOCS' && (
                <div className="min-h-screen py-24 px-4 md:px-6 bg-[var(--color-bg-deep)]">
                  <SectionBackground variant={BACKGROUNDS.hero} />
                  <main className="container-main py-12 md:py-20 space-y-8">
                    <div className="text-center max-w-3xl mx-auto">
                      <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
                        IMD Optimizer — Documentação Oficial & Whitepaper
                      </h1>
                      <p className="text-[var(--color-text-secondary)] text-lg mb-12 max-w-2xl mx-auto">
                        Guia completo da integração Meta-Hook V4, contratos inteligentes
                        e economia do token $IMD.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-[var(--color-border-glass)] mb-8">
                      <div className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest glow">
                        Visão Geral & Arquitetura
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        Integração Meta-Hook V4 com arquitetura de contrato Singleton. O protocolo utiliza uma estrutura de 3 camadas: Identity-FI (pré-swap), Elasticity (pós-swap) e MEV Internalization (captura e redistribuição de arbitragem).
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-[var(--color-border-glass)] mb-8">
                      <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest glow">Value Capture Funnel</h2>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        Funil de captura de valor com 4 Tiers definidos por taxas e multiplicadores de rendimento:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-[var(--color-text-secondary)]">
                          <thead>
                            <tr className="border-b border-[var(--color-border-glass)]">
                              <th className="text-left font-medium">Tier</th>
                              <th className="text-left font-medium">Taxa</th>
                              <th className="text-left font-medium">Multiplicador</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-[var(--color-border-glass)]">
                              <td>Tier 1</td>
                              <td>0%</td>
                              <td>4x</td>
                            </tr>
                            <tr className="border-b border-[var(--color-border-glass)]">
                              <td>Tier 2</td>
                              <td>5%</td>
                              <td>3x</td>
                            </tr>
                            <tr className="border-b border-[var(--color-border-glass)]">
                              <td>Tier 3</td>
                              <td>10%</td>
                              <td>2x</td>
                            </tr>
                            <tr>
                              <td>Tier 4</td>
                              <td>20%</td>
                              <td>1x</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-[var(--color-border-glass)] mb-8">
                      <div className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest glow">
                        Tokenomics & Queima
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        Mecânica do token $IMD: redistribuição de MEV capturado, modelo de queima determinística baseado no volume de swap, e alocação de 200 NFTs Genesis com isenção de taxas permanentes.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-[var(--color-border-glass)]">
                      <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest glow">Contratos (Sepolia)</h2>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        Endereços e ABIs dos contratos implantados na rede Sepolia para integração e auditoria.
                      </p>
                      <table className="w-full text-sm text-[var(--color-text-secondary)]">
                        <thead>
                          <tr className="border-b border-[var(--color-border-glass)]">
                            <th className="text-left font-medium">Contrato</th>
                            <th className="text-left font-medium">Endereço</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[var(--color-border-glass)]">
                            <td>Meta-Hook Principal</td>
                            <td>0x... (implantação Sepolia)</td>
                          </tr>
                          <tr className="border-b border-[var(--color-border-glass)]">
                            <td>Token $IMD</td>
                            <td>0x... (implantação Sepolia)</td>
                          </tr>
                          <tr>
                            <td>Factory V4</td>
                            <td>0x... (implantação Sepolia)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <TierFunnel />

                    <div className="mt-12 text-center">
                      <a
                        href="https://github.com/optimizer-protocol"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl py-2.5 px-6 bg-[var(--color-emerald)] text-[var(--color-text-inverse)] font-semibold hover:bg-[var(--color-emerald-bright)] transition-all"
                      >
                        Acessar no GitHub →
                      </a>
                    </div>
                  </main>
                </div>
              )}
              {activeTab !== 'DOCS' && children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[var(--color-border-glass)] px-4 py-6 mt-auto animate-fade-in stagger-2" style={{ animationDelay: "200ms" }}>
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs">
                <img src="/images/avatar.png" alt="Agentic Frog" className="w-5 h-5 rounded-full" />
                <span>OPTIMIZER PROTOCOL &mdash; The Agentic V4 Meta-Hook</span>
              </div>
              <div className="flex gap-6 text-xs">
                <a href="https://github.com/optimizer-protocol" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-emerald-bright)] transition-colors">GitHub</a>
                <a href="https://twitter.com/OptimizerProtocol" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-emerald-bright)] transition-colors">Twitter</a>
                <span className="text-[var(--color-emerald-bright)] animate-blink">█</span>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}