"use client";

import { useState } from "react";
import { Navbar } from "../components/Navbar";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "problem-solution", label: "1 · Problem vs Solution" },
  { id: "machine", label: "2 · The Machine" },
  { id: "identity-fi", label: "3 · Identity-Fi Tiers" },
  { id: "buildercoin", label: "4 · Buildercoin dNFT" },
  { id: "ecosystem", label: "5 · Distributions & Governance" },
  { id: "extraction", label: "Ready for the Extraction?" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#070A0F] font-mono">
      <Navbar />

      {/* Docs sidebar (open/close) */}
      <aside
        className={`fixed left-0 top-[72px] bottom-0 w-64 z-40 flex flex-col border-r border-white/[0.08] bg-[#0B0F17]/95 backdrop-blur-xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B7A88]">
            Documentation
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="text-[#6B7A88] hover:text-[#00F58C] transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
              }}
              className="block px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-[#00F58C] hover:bg-[#00F58C]/10 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/[0.06] text-[10px] text-slate-600 leading-relaxed">
          Sepolia Testnet
          <br />
          Unaudited
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed left-0 right-0 top-[72px] bottom-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Open sidebar button (visible when closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-[84px] left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-[#0B0F17]/95 backdrop-blur-xl text-[#6B7A88] hover:text-[#00F58C] transition-colors text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          CONTENTS
        </button>
      )}

      <main
        className={`pt-24 pb-16 px-4 md:px-8 transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <header id="overview" className="scroll-mt-28">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#6B7A88] mb-3">
              IMD Optimizer · Documentation
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              🌐 IMD OPTIMIZER: THE META-HOOK LAYER
            </h1>
            <p className="mt-4 text-[#00F58C] text-base md:text-lg italic">
              &quot;We don&apos;t simulate protection. We execute extraction.&quot;
            </p>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Welcome to the new era of DeFi on Uniswap V4. The IMD Optimizer is not just a
              liquidity pool; it is an Agentic (autonomous) ecosystem designed to protect real
              users, destroy MEV extraction bots, and redirect enemy capital to our investors
              through Real Yield (in ETH).
            </p>
          </header>

          {/* 1 — Problem vs Solution */}
          <section id="problem-solution" className="scroll-mt-28 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase border-l-2 border-[#00F58C] pl-3">
              1. The Problem vs. The Solution
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-rose-500/20 bg-rose-500/[0.04]">
                <div className="text-xs uppercase tracking-widest text-rose-400 mb-2">
                  The Problem — The Native Pool
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Standard Uniswap pools are open fields. Liquidity Providers (LPs) and traders
                  lose millions daily to Sandwich Bots and Front-Running attacks. The market has
                  accepted this invisible theft as the cost of doing business. We haven&apos;t.
                </p>
              </Card>
              <Card className="border-[#00F58C]/20 bg-[#00F58C]/[0.04]">
                <div className="text-xs uppercase tracking-widest text-[#00F58C] mb-2">
                  The Solution — The Optimizer Fortress
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  We built a Meta-Hook directly attached to our pool. We transformed the swap
                  environment into a minefield where real users trade safely, while predators are
                  blocked, trapped, and have their capital confiscated straight into our Vault.
                </p>
              </Card>
            </div>
          </section>

          {/* 2 — The Machine */}
          <section id="machine" className="scroll-mt-28 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase border-l-2 border-[#00F58C] pl-3">
              2. The Machine: How It Works?
            </h2>
            <p className="text-sm text-slate-400">
              The protocol operates through three core infrastructures connected atomically:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm font-bold text-white mb-2">🛡️ The Shield</div>
                <div className="text-[10px] uppercase tracking-widest text-[#6B7A88] mb-2">
                  OptimizerHookV2 · Passive Defense
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our passive defense. When you execute a swap, the Hook intercepts malicious
                  transactions (MEV) in real-time. It blocks the attack, confiscates the
                  bot&apos;s ETH, and sends it directly to our Vault.
                </p>
              </Card>
              <Card>
                <div className="text-sm font-bold text-white mb-2">🗡️ The Spear</div>
                <div className="text-[10px] uppercase tracking-widest text-[#6B7A88] mb-2">
                  OptimizerRouter · Intra-Pair Arbitrage
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our offensive weapon (Intra-Pair Arbitrage). Leveraging the natural price
                  divergence between the Native Pool (manipulated) and the Protected Pool
                  (stable), our VIP users can perform arbitrage. You buy cheap on one side, sell
                  high on the other in the exact same second, and pocket the profit — paying only
                  a small Success Fee to the protocol.
                </p>
              </Card>
              <Card>
                <div className="text-sm font-bold text-white mb-2">🏦 The Vault</div>
                <div className="text-[10px] uppercase tracking-widest text-[#6B7A88] mb-2">
                  OptimizerVaultV2 · Real Yield
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The financial heart. All ETH confiscated from bots and collected in fees ends up
                  here, ready to be distributed as Real Yield to those with skin in the game.
                </p>
              </Card>
            </div>
          </section>

          {/* 3 — Identity-Fi */}
          <section id="identity-fi" className="scroll-mt-28 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase border-l-2 border-[#00F58C] pl-3">
              3. Identity-Fi: User Benefits
            </h2>
            <p className="text-sm text-slate-400">
              Uniswap treats everyone equally. We treat you according to your rank. Our protocol
              scans your wallet and enforces the ecosystem&apos;s hierarchy.
            </p>
            <Card className="border-amber-400/30 bg-amber-400/[0.05]">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
                ⚠️ Golden Rule — Engine and Fuel
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                The profitability benefits and Yield multipliers described in the Tiers below are
                only applied if the user holds the $BLD token Staked in our Vault.{" "}
                <span className="text-white font-bold">No Stake, no Yield.</span>
              </p>
            </Card>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-white/[0.04] text-[#6B7A88] uppercase tracking-widest text-[10px]">
                    <th className="text-left px-4 py-3">Tier</th>
                    <th className="text-left px-4 py-3">Who</th>
                    <th className="text-right px-4 py-3">Swap Fee</th>
                    <th className="text-right px-4 py-3">Arbitrage Success Fee</th>
                    <th className="text-right px-4 py-3">Yield Vault</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 text-white">👑 Tier 1 (Alpha)</td>
                    <td className="px-4 py-3">Buildercoin NFT Holders</td>
                    <td className="px-4 py-3 text-right text-[#00F58C]">0.00%</td>
                    <td className="px-4 py-3 text-right">5% of net profit</td>
                    <td className="px-4 py-3 text-right">4x (with $BLD Staked)</td>
                  </tr>
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 text-white">🤝 Tier 2 (Partner)</td>
                    <td className="px-4 py-3">Identity md NFT Holders</td>
                    <td className="px-4 py-3 text-right">0.10%</td>
                    <td className="px-4 py-3 text-right">10%</td>
                    <td className="px-4 py-3 text-right">3x (with $BLD Staked)</td>
                  </tr>
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 text-white">💎 Tier 3 (Holders)</td>
                    <td className="px-4 py-3">$IMD or $BLD Holders</td>
                    <td className="px-4 py-3 text-right">0.30%</td>
                    <td className="px-4 py-3 text-right">20% – 25%</td>
                    <td className="px-4 py-3 text-right">1x (with $BLD Staked)</td>
                  </tr>
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 text-white">🚶 Tier 4 (Retail)</td>
                    <td className="px-4 py-3">Visitors / default wallets</td>
                    <td className="px-4 py-3 text-right">0.50%</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className="text-xs text-slate-500 space-y-1 pl-1">
              <li>
                👑 Tier 1 — The Shield works for you for free; Yield Vault: Maximum Multiplier
                (4x), active exclusively with $BLD Staked.
              </li>
              <li>
                🚶 Tier 4 — Pays a premium for the Shield&apos;s protection; zero access to Vault
                yields or arbitrage capabilities.
              </li>
            </ul>
          </section>

          {/* 4 — Buildercoin */}
          <section id="buildercoin" className="scroll-mt-28 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase border-l-2 border-[#00F58C] pl-3">
              4. Buildercoin: The Living Identity (Dynamic ID NFT)
            </h2>
            <p className="text-sm text-slate-400">
              The Buildercoin is your living identity within the protocol. With a strict Max
              Supply of 501 NFTs, it is not a static image; it is the master key that unlocks
              Tier 1.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <div className="text-xs font-bold uppercase tracking-widest text-[#00F58C] mb-2">
                  The Engine and Fuel Paradox
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your NFT acts merely as the Engine (Granting the 4x multiplier in the Vault).
                  For the engine to generate money, you need Fuel (Staking the $BLD token). If
                  you hold the NFT but your staked balance is zero, your yield will be zero
                  (4x * 0 = 0). Mercenary capital does not survive here.
                </p>
              </Card>
              <Card className="md:col-span-2">
                <div className="text-xs font-bold uppercase tracking-widest text-[#00F58C] mb-2">
                  On-Chain Evolution — Cards and Metadata
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your NFT is forged as a Recruit (Bronze Card), but it evolves in real-time.
                  Initially, the smart contract levels up your Card based on your financial
                  interactions (executed arbitrage volume and prolonged staking time — Diamond
                  Hands). Your Card visually evolves from Bronze to Silver, Gold, and Neon,
                  dynamically updating your status on the secondary market.
                </p>
              </Card>
            </div>
            <Card>
              <div className="text-xs font-bold uppercase tracking-widest text-[#00F58C] mb-2">
                Evolution Roadmap
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tracking metrics and multipliers activated by direct combat against bots (MEV
                Kills) will be introduced in a future update, once the NFTs gain strategic
                utility in a potential Optimizer Swarm or native integration with the SUPEPE
                network.
              </p>
            </Card>
          </section>

          {/* 5 — Ecosystem Distributions & Governance */}
          <section id="ecosystem" className="scroll-mt-28 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase border-l-2 border-[#00F58C] pl-3">
              5. Ecosystem Distributions and Governance
            </h2>
            <p className="text-sm text-slate-400">
              We believe in Radical Honesty. Every cent that enters the protocol has a
              mathematical destination focused on sustainability and the absolute scarcity of the
              $IMD token.
            </p>
            <Card>
              <div className="text-xs font-bold uppercase tracking-widest text-white mb-2">
                The Genesis Mint — NFT Pre-Sale
              </div>
              <p className="text-xs text-slate-400 mb-3">
                The 501 Buildercoins cost 0.05 ETH each. The revenue doesn&apos;t line our
                pockets; it builds an unbreakable infrastructure:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-2 rounded-full bg-[#00F58C]" style={{ width: "40%" }} />
                  <span className="text-slate-400">40% — Core Team (Development &amp; Architecture)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: "40%" }} />
                  <span className="text-slate-400">
                    40% — Infrastructure &amp; Security (V4 Audits and Servers/Oracles)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: "20%" }} />
                  <span className="text-slate-400">
                    20% — Growth &amp; Marketing (Community expansion and bounties)
                  </span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="text-xs font-bold uppercase tracking-widest text-white mb-2">
                The Deflationary Machine — Global Buy &amp; Burn
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                From all the value extracted from the network (confiscated bot ETH, retail swap
                fees, and arbitrage success fees), exactly <span className="text-white">5%</span>{" "}
                is atomically routed to buy $IMD on the open market and burn it (sent to the dead
                address). The Shield defends, and the protocol deflates.
              </p>
            </Card>
            <Card>
              <div className="text-xs font-bold uppercase tracking-widest text-white mb-2">
                Diamond Hands Governance — Withdrawal Rules
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Claiming your ETH yields from the Vault is always free. If you want to Unstake
                your $BLD by waiting for the standard security window (7 days), there are also
                zero fees. However, if you demand an Instant Unstake, a heavy penalty is applied
                and distributed atomically:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-3">
                  <div className="text-rose-400 font-bold mb-1">🔥 50% Buy &amp; Burn</div>
                  <p className="text-slate-400">
                    Buys and burns $IMD straight into the black hole.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <div className="text-white font-bold mb-1">👥 25% Team</div>
                  <p className="text-slate-400">
                    Ensures continuous operational sustainability.
                  </p>
                </div>
                <div className="rounded-xl border border-[#00F58C]/20 bg-[#00F58C]/[0.05] p-3">
                  <div className="text-[#00F58C] font-bold mb-1">🏦 25% Vault</div>
                  <p className="text-slate-400">
                    Distributed back to the stakers who had the resilience to stay.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic mt-3">
                (Paper hands finance Diamond hands).
              </p>
            </Card>
          </section>

          {/* Closing */}
          <section id="extraction" className="scroll-mt-28">
            <Card className="border-[#00F58C]/30 bg-[#00F58C]/[0.05] text-center py-10">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase">
                Ready for the Extraction?
              </h2>
              <p className="mt-4 text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                The pool is live. The Shield is up. Connect your wallet, equip your Agent, and
                let the Optimizer work.
              </p>
              <a
                href="/swap"
                className="inline-block mt-6 bg-[#00F58C] text-[#05080A] font-semibold px-6 py-3 rounded-full hover:brightness-110 transition-all text-sm"
              >
                LAUNCH SWAP
              </a>
            </Card>
          </section>

          <div className="pt-6 border-t border-white/[0.06] text-[10px] text-slate-600 uppercase tracking-widest text-center">
            IMD Optimizer · Sepolia Testnet · Unaudited · Documentation v1
          </div>
        </div>
      </main>
    </div>
  );
}
