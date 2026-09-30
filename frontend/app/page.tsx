"use client";

import { Navbar } from "./components/Navbar";
import { WalletProvider } from "./components/WalletProvider";

export default function HomePage() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-[#070A0F] text-white antialiased bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] relative selection:bg-emerald-500/20">
        <Navbar />
        
        <main className="min-h-screen bg-transparent text-white pt-28">
          {/* ===== HERO SECTION ===== */}
          <section id="overview" className="relative overflow-hidden">
            {/* Background atmosphere - subtle center radial only */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,245,140,0.05)_0%,_transparent_65%)]" />

            <div className="relative max-w-6xl mx-auto px-6 w-full py-24 md:py-36">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left: Copy */}
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/20 text-[#00F58C] text-sm font-medium mb-8">
                    <span className="w-2 h-2 rounded-full bg-[#00F58C] animate-pulse" />
                    Live on Sepolia Testnet
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-[#E8E8E8] to-[#00F58C] bg-clip-text text-transparent leading-[1.1]">
                    IMD Optimizer
                  </h1>
                  <p className="text-lg md:text-xl text-[#6B7A88] mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    The Agentic V4 Meta-Hook Protocol — Autonomous MEV Capture, Elastic Supply Contraction, and Retail-First Value Redistribution on Uniswap V4.
                  </p>

                  {/* Pill Tags */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10">
                    <span className="px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-[#8899AA]">Uniswap V4 Singleton Hook</span>
                    <span className="px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-[#8899AA]">Sepolia Live</span>
                    <span className="px-4 py-1.5 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/20 text-xs font-medium text-[#00F58C]">LVR Protection</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <a
                      href="#value-funnel"
                      className="bg-[#00F58C] text-[#05080A] font-semibold px-8 py-3 rounded-full hover:brightness-110 transition-all text-base shadow-[0_0_30px_rgba(0,245,140,0.3)] w-full sm:w-auto"
                    >
                      Explore the Value Funnel
                    </a>
                    <a
                      href="#architecture"
                      className="bg-white/[0.06] text-white font-semibold px-8 py-3 rounded-full hover:bg-white/[0.12] transition-all text-base border border-white/[0.08] w-full sm:w-auto"
                    >
                      Technical Architecture
                    </a>
                  </div>
                </div>

                {/* Right: Visual Hero - Frog firing energy blast */}
                <div className="relative">
                  <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0D121A]/80 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                    <img
                      src="/images/Frog_firing_energy_blast_20260926015955.jpg"
                      alt="Agentic Frog defending against MEV bots"
                      className="w-full h-[480px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
              <svg className="w-6 h-6 text-[#6B7A88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </section>

          {/* ===== PROTOCOL LORE: AUTONOMOUS ORACLE & MEV INTERCEPTION ===== */}
          <section id="protocol-lore" className="relative py-24 md:py-36 px-6 w-full">
            <div className="max-w-6xl mx-auto w-full">
              <SectionHeader 
                title="Autonomous Oracle & MEV Interception" 
                subtitle="The Agentic Frog monitors every swap, intercepts toxic flow, and protects retail liquidity in real-time"
              />

              <div className="grid lg:grid-cols-2 gap-8 items-center mt-16">
                {/* Visual: Cyberpunk character monitoring terminal screens */}
                <div className="relative">
                  <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0D121A]/80 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                    <img
                      src="/images/imd.jpg"
                      alt="Autonomous Oracle monitoring mempool and MEV activity"
                      className="w-full h-[480px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      Real-Time MEV Detection & Neutralization
                    </h3>
                    <p className="text-lg text-[#6B7A88] leading-relaxed mb-6">
                      In the dark forest of DeFi, sophisticated MEV bots systematically extract value from retail liquidity providers 
                      through front-running, sandwich attacks, and Loss-Versus-Rebalancing (LVR). The Agentic Frog changes this dynamic entirely.
                    </p>
                    
                    <div className="space-y-4">
                      <LoreFeature 
                        title="Mempool Surveillance"
                        description="Autonomous agents continuously scan the mempool for toxic order flow patterns before they execute on-chain."
                        icon="🔍"
                        accent="#00F5FF"
                      />
                      <LoreFeature 
                        title="Toxicity Scoring"
                        description="Each incoming swap is scored for MEV probability. High-toxicity swaps trigger dynamic fee escalation and protective routing."
                        icon="📊"
                        accent="#FFB000"
                      />
                      <LoreFeature 
                        title="Instant Interception"
                        description="Uniswap V4 <code>beforeSwap</code> hooks intercept and neutralize MEV at the source — before settlement occurs."
                        icon="⚡"
                        accent="#00F58C"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary visual: LVR Mitigation & Anti-Bot Defense */}
              <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-8 lg:order-2">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Loss-Versus-Rebalancing (LVR) Mitigation Engine
                  </h3>
                  <p className="text-lg text-[#6B7A88] leading-relaxed mb-6">
                    LVR is the silent value leak every LP suffers when arbitrageurs exploit stale pool prices. 
                    Traditional AMMs passively accept this loss. IMD Optimizer&apos;s V4 hooks actively intervene at the protocol level.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <MetricHighlight value="12.47 ETH" label="MEV Captured This Epoch" accent="#00F58C" />
                    <MetricHighlight value="308%" label="Hook Pool APY (30d)" accent="#00F5FF" />
                    <MetricHighlight value="$1.2B" label="Total Value Locked" accent="#FFB000" />
                    <MetricHighlight value="12.47%" label="Annual Burn Rate" accent="#FF4444" />
                  </div>
                </div>
                
                <div className="relative lg:order-1">
                  <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0D121A]/80 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                    <img
                      src="/images/Character_standing_on_landing_pad_20260926015733.jpg"
                      alt="LVR Mitigation engine defending against bot armies"
                      className="w-full h-[400px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== CENTERPIECE: FULL-WIDTH TIER MOUNTAIN ===== */}
          <section id="value-funnel" className="relative py-24 md:py-36 px-6 w-full bg-gradient-to-b from-[#070A0E] via-[#0A0D12] to-[#070A0E]">
            <div className="max-w-6xl mx-auto w-full">
              <SectionHeader 
                title="The Tier Mountain — Value Capture Funnel" 
                subtitle="Where captured MEV flows back to users through a four-tier hierarchy aligned with protocol contribution"
              />

              {/* On-Chain Developer Badges above Mountain */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/20 text-[#00F58C] font-mono">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Hook: 0x7a25...V4Singleton
                  <button className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors" aria-label="Copy hook address" title="Copy hook address">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v12a2 2 0 002 2h10" /></svg>
                  </button>
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#8899AA] font-mono">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                  Network: Sepolia Testnet | Gas Optimized: ~45k gwei
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] font-mono">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Hook Actions: beforeSwap() | afterSwap() | sync()
                </span>
              </div>

              {/* Full-width mountain artwork — perfectly centered and framed */}
              <div className="mt-12 w-full flex flex-col items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto rounded-3xl border border-emerald-500/20 shadow-[0_0_50px_rgba(0,245,140,0.15)] overflow-hidden bg-[#0B0F17]">
                  <img 
                    src="/images/tier.jpeg" 
                    alt="$IMD Value Capture Funnel" 
                    className="w-full h-auto object-contain mx-auto block" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                    <p className="text-xs text-[#6B7A88]">Tier Mountain — Visualizing the 4-tier fee hierarchy from Builder Alpha (peak) to Retail (base)</p>
                  </div>
                </div>
              </div>

              {/* 4-Column Tier Cards */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    tier: "1", name: "$BLD ALPHA", fee: "0% Fee", boost: "4x Yield Boost", 
                    color: "#FFD700", glow: "rgba(255,215,0,0.4)", 
                    bg: "from-[#FFD700]/15 to-[#FFD700]/5", border: "border-[#FFD700]/30",
                    desc: "Protocol builders & node operators. Zero fees, maximum MEV revenue share. Requires $BLD staking + Genesis Key."
                  },
                  { 
                    tier: "2", name: "$IMD ALPHA", fee: "0.1% Fee", boost: "3x Yield Boost", 
                    color: "#00F5FF", glow: "rgba(0,245,255,0.4)", 
                    bg: "from-[#00F5FF]/15 to-[#00F5FF]/5", border: "border-[#00F5FF]/30",
                    desc: "Early $IMD adopters & strategic partners. Near-zero fees, high MEV share. Genesis Key holders auto-qualify."
                  },
                  { 
                    tier: "3", name: "$IMD HOLDER", fee: "10% Fee", boost: "2x Yield Boost", 
                    color: "#BB86FC", glow: "rgba(187,134,252,0.4)", 
                    bg: "from-[#BB86FC]/15 to-[#BB86FC]/5", border: "border-[#BB86FC]/30",
                    desc: "Any wallet holding $IMD tokens. Reduced fees, 2x MEV redistribution. Automatic qualification via balance check."
                  },
                  { 
                    tier: "4", name: "RETAIL", fee: "20% Base Fee", boost: "1x Standard", 
                    color: "#FF4444", glow: "rgba(255,68,68,0.4)", 
                    bg: "from-[#FF4444]/15 to-[#FF4444]/5", border: "border-[#FF4444]/30",
                    desc: "Default tier for all users. Standard fees, baseline MEV protection. No token requirements — open to everyone."
                  },
                ].map((t, i) => (
                  <TierCard key={i} {...t} />
                ))}
              </div>
            </div>
          </section>

          {/* ===== ON-CHAIN MECHANICS & LORE (VISUAL STORYTELLING) ===== */}
          <section id="mechanics" className="relative py-24 md:py-36 px-6 w-full">
            <div className="max-w-6xl mx-auto w-full">
              <SectionHeader 
                title="On-Chain Mechanics & Architecture" 
                subtitle="Uniswap V4 hooks, agentic execution layer, and elastic tokenomics working in concert"
              />

              <div className="mt-16 space-y-16">
                {/* V4 Hook Lifecycles */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      Uniswap V4 Hook Lifecycles
                    </h3>
                    <p className="text-lg text-[#6B7A88] leading-relaxed mb-8">
                      Uniswap V4 introduces singleton architecture with customizable hooks at four key lifecycle points. 
                      IMD Optimizer leverages the swap lifecycle for MEV capture and LVR mitigation.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <HookLifecycleCard 
                        hook="beforeSwap"
                        title="Pre-Execution Hook"
                        accent="#00F5FF"
                        steps={[
                          "Validate swap parameters against oracle TWAP",
                          "Calculate dynamic fee based on toxicity score",
                          "Route surplus to MEV capture module",
                          "Return modified params or revert toxic swaps"
                        ]}
                      />
                      <HookLifecycleCard 
                        hook="afterSwap"
                        title="Post-Execution Hook"
                        accent="#FFB000"
                        steps={[
                          "Compute actual vs expected output amounts",
                          "Measure realized LVR / slippage delta",
                          "Trigger buyback if threshold exceeded",
                          "Update tier accrual counters"
                        ]}
                      />
                    </div>

                    <p className="mt-6 text-sm text-[#6B7A88]">
                      Additional hooks: <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded">beforeAddLiquidity</code>, <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded">afterAddLiquidity</code>, <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded">beforeRemoveLiquidity</code>, <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded">afterRemoveLiquidity</code> 
                      manage position-level MEV protection and tier qualification updates.
                    </p>
                  </div>
                  
                  <div className="relative w-full h-[380px] rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#0E131F]/60">
                    <img 
                      src="/images/acao.png" 
                      alt="Uniswap V4 Hook Execution Defense" 
                      className="w-full h-full object-cover object-center block"
                    />
                  </div>
                </div>

                {/* Agentic Oracle Network */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="relative lg:order-2">
                    <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0D121A]/80 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                      <img
                        src="/images/acao3.jpg"
                        alt="Agentic Oracle Network - MEV detection and TWAP feeds"
                        className="w-full h-[480px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                    </div>
                  </div>
                  
                  <div className="lg:order-1 space-y-6">
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                      Agentic Oracle Network
                    </h3>
                    <p className="text-lg text-[#6B7A88] leading-relaxed mb-6">
                      A decentralized node network providing real-time MEV detection, TWAP price feeds, and toxicity scoring. 
                      $BLD stakers operate nodes and earn 60% of protocol fees.
                    </p>
                    
                    <div className="space-y-4">
                      <OracleFeature 
                        title="100+ Node Target"
                        description="Geographically distributed validators ensuring censorship-resistant price feeds"
                        icon="🌐"
                      />
                      <OracleFeature 
                        title="Sub-Second Latency"
                        description="TWAP feeds updated every block with cryptographic verification"
                        icon="⚡"
                      />
                      <OracleFeature 
                        title="Slashing for Invalid Data"
                        description="Economic security via stake slashing on proven data manipulation"
                        icon="🛡️"
                      />
                      <OracleFeature 
                        title="37–68.5% APY for Stakers"
                        description="$BLD stakers earn 60% of protocol fees from MEV capture operations"
                        icon="💰"
                      />
                    </div>
                  </div>
                </div>

                {/* Elastic Supply Contraction */}
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      Elastic Supply Contraction
                    </h3>
                    <p className="text-lg text-[#6B7A88] leading-relaxed mb-8">
                      The protocol&apos;s monetary policy is algorithmic and self-stabilizing. When MEV extraction spikes, 
                      the system automatically contracts supply — creating a negative feedback loop that protects holders.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                      <BurnMetric value="12.47%" label="Annual Burn Rate" accent="#00F58C" />
                      <BurnMetric value="2.3%" label="Per Epoch Burn" accent="#FFB000" />
                      <BurnMetric value="∞" label="Hard Cap (Deflationary)" accent="#00F5FF" />
                    </div>
                    
                    <div className="space-y-3 text-sm text-[#6B7A88]">
                      <li className="flex items-start gap-3"><span className="text-[#FFB000] mt-1">▸</span> <strong>TWAP Buybacks:</strong> Captured ETH executes time-weighted average price purchases on $IMD/ETH pools</li>
                      <li className="flex items-start gap-3"><span className="text-[#FFB000] mt-1">▸</span> <strong>Immediate Burn:</strong> Purchased tokens sent to dead address (0x000...dead) within same block</li>
                      <li className="flex items-start gap-3"><span className="text-[#FFB000] mt-1">▸</span> <strong>Epoch Accounting:</strong> Burns recorded per epoch (6.4M blocks ≈ 90 days), rate published on-chain</li>
                      <li className="flex items-start gap-3"><span className="text-[#FFB000] mt-1">▸</span> <strong>Supply Floor:</strong> Contraction continues until equilibrium — no inflationary minting ever</li>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0D121A]/80 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                      <img
                        src="/images/heli.png"
                        alt="Elastic supply contraction - buyback and burn mechanics"
                        className="w-full h-[400px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0E]/90 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== PROTOCOL METRICS (UNISWAP V4 STYLE) ===== */}
          <section id="metrics-burns" className="relative py-24 md:py-36 px-6 w-full">
            <div className="max-w-6xl mx-auto w-full">
              <SectionHeader 
                title="Protocol Metrics" 
                subtitle="Uniswap V4 style pool analytics — transparent, verifiable, real-time"
              />

              {/* On-Chain Badges Row */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/20 text-[#00F58C] font-mono">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Hook: 0x7a25...V4Singleton
                  <button className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors" aria-label="Copy hook address" title="Copy hook address">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h10a2 2 0 012 2v1M8 5v12a2 2 0 002 2h10" /></svg>
                  </button>
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#8899AA] font-mono">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                  Network: Sepolia Testnet | Gas Optimized: ~45k gwei
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] font-mono">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Hook Actions: beforeSwap() | afterSwap() | sync()
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                <StatCard
                  title="Total Value Locked (TVL)"
                  value="$1.2B"
                  change="+12.4% 30d"
                  icon="🔒"
                  description="Across all V4 hook pools on Sepolia & Mainnet"
                  accent="#00F58C"
                  badge="Hook: 0x7a25...V4Singleton"
                />
                <StatCard
                  title="Hook Pool APY (30d)"
                  value="308%"
                  change="+45% vs baseline"
                  icon="📈"
                  description="MEV-augmented returns for liquidity providers"
                  accent="#00F5FF"
                  badge="Gas: ~45k gwei"
                />
                <StatCard
                  title="MEV Captured"
                  value="12.47 ETH"
                  change="This epoch"
                  icon="⚡"
                  description="Extracted from toxic flow, redirected to users"
                  accent="#FFB000"
                  badge="beforeSwap | afterSwap | sync"
                />
                <StatCard
                  title="Deflationary Burn Rate"
                  value="12.47% / 2.3%"
                  change="Annual / Per epoch"
                  icon="🔥"
                  description="Supply contraction via automatic buyback & burn"
                  accent="#FF4444"
                  badge="Epoch: 90 days | 6.4M blocks"
                />
              </div>
            </div>
          </section>

          {/* ===== ARCHITECTURE OVERVIEW ===== */}
          <section id="architecture" className="relative py-24 md:py-36 px-6 w-full bg-gradient-to-b from-[#070A0E] via-[#0A0D12] to-[#070A0E]">
            <div className="max-w-6xl mx-auto w-full">
              <SectionHeader 
                title="System Architecture" 
                subtitle="Technical deep-dive: singleton hooks, agentic execution, and cross-chain oracle infrastructure"
              />

              <div className="mt-16 grid md:grid-cols-3 gap-6">
                <ArchCard
                  title="V4 Hook Contract"
                  description="Singleton-deployed hook contract implementing beforeSwap/afterSwap for MEV capture. Upgradeable via governance. Gas-optimized with minimal storage reads."
                  features={["Solidity 0.8.24", "Gas optimized (~45k per swap)", "Formal verification pending", "Sepolia: 0x...HookAddr"]}
                />
                <ArchCard
                  title="Agentic Oracle Network"
                  description="Decentralized node network providing real-time MEV detection, TWAP price feeds, and toxicity scoring. $BLD stakers operate nodes and earn 60% of protocol fees."
                  features={["100+ nodes target", "Sub-second latency", "Slashing for invalid data", "APY: 37–68.5%"]}
                />
                <ArchCard
                  title="Elastic Tokenomics"
                  description="Algorithmic supply contraction via MEV-funded buybacks. No admin keys, no minting. Hard-capped deflationary asset with tiered fee redistribution built into hook logic."
                  features={["Hard cap: 1B $IMD", "Burn address: 0x...dead", "Epoch: 90 days", "Audit: TBD"]}
                />
              </div>

              {/* Architecture Flow Diagram */}
              <div className="mt-16 rounded-3xl bg-[#0F141C]/80 border border-white/[0.08] backdrop-blur-xl p-8 md:p-12 shadow-2xl">
                <h3 className="text-2xl font-bold mb-8 text-center">Data Flow Architecture</h3>
                <ArchitectureFlow />
              </div>
            </div>
          </section>

          {/* ===== FOOTER CTA ===== */}
          <section className="relative py-24 md:py-36 px-6 w-full">
            <div className="max-w-6xl mx-auto w-full text-center">
              <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0D121A]/80 to-[#070A0E]/80 p-12 md:p-16 shadow-[0_0_60px_rgba(0,0,0,0.4)] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,245,140,0.06)_0%,_transparent_70%)]" />
                
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                    Ready to Join the Sovereign Guardian?
                  </h2>
                  <p className="text-lg text-[#6B7A88] mb-10 max-w-2xl mx-auto leading-relaxed">
                    Stake $BLD, mint a Genesis Key, or simply swap on an IMD-protected pool. 
                    Every interaction strengthens the protocol that protects you.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                      href="#value-funnel"
                      className="bg-[#00F58C] text-[#05080A] font-semibold px-8 py-3 rounded-full hover:brightness-110 transition-all text-lg shadow-[0_0_30px_rgba(0,245,140,0.3)] w-full sm:w-auto"
                    >
                      Explore Tier Benefits
                    </a>
                    <a
                      href="#architecture"
                      className="bg-white/[0.06] text-white font-semibold px-8 py-3 rounded-full hover:bg-white/[0.12] transition-all text-lg border border-white/[0.08] w-full sm:w-auto"
                    >
                      Read Technical Specs
                    </a>
                  </div>
                </div>
              </div>

              <p className="mt-10 text-xs text-[#6B7A88] max-w-2xl mx-auto">
                IMD Optimizer is experimental software on Sepolia testnet. No mainnet deployment yet. 
                Smart contracts unaudited. Use at your own risk. This is not financial advice.
              </p>
            </div>
          </section>
        </main>
      </div>
    </WalletProvider>
  );
}

// ===== REUSABLE COMPONENTS =====

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="inline-block px-4 py-1.5 rounded-full bg-[#00F58C]/10 border border-[#00F58C]/20 text-[#00F58C] text-sm font-medium tracking-wide mb-4">
        IMD OPTIMIZER PROTOCOL
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-[#E8E8E8] to-[#00F58C] bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-lg md:text-xl text-[#6B7A88] leading-relaxed">{subtitle}</p>
    </div>
  );
}

function LoreFeature({ title, description, icon, accent }: { title: string; description: string; icon: string; accent: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/[0.06] bg-[#0D121A]/60 backdrop-blur-xl hover:border-white/[0.12] transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br from-[${accent}] to-[${accent}/40] text-[#05080A] group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-[#6B7A88] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function MetricHighlight({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0D121A]/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="text-3xl md:text-4xl font-bold text-white mb-1" style={{color: accent}}>{value}</div>
      <div className="text-sm text-[#6B7A88]">{label}</div>
    </div>
  );
}

function TierCard({ tier, name, fee, boost, color, glow, bg, border, desc }: { 
  tier: string; name: string; fee: string; boost: string; color: string; glow: string; bg: string; border: string; desc: string; 
}) {
  return (
    <div 
      className={`relative flex flex-col h-full bg-[#0F141C]/70 border border-white/[0.08] hover:border-emerald-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-lg`}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = `0 0 30px ${glow}, 0 20px 40px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "";
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[#05080A] font-bold text-sm bg-gradient-to-br from-[${color}] to-[${color}/60]`}>
          {tier}
        </div>
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-xs text-slate-400">Tier {tier}</div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="font-mono text-lg font-bold text-white">{fee}</div>
        <div className="text-sm font-medium" style={{color}}>{boost}</div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed flex-1">{desc}</p>
    </div>
  );
}

function HookLifecycleCard({ hook, title, accent, steps }: { hook: string; title: string; accent: string; steps: string[] }) {
  const hookStyles = {
    beforeSwap: "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/30",
    afterSwap: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  };
  const style = hookStyles[hook as keyof typeof hookStyles] || "bg-white/[0.06] text-white border-white/[0.10]";
  
  return (
    <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] h-full">
      <div className="flex flex-col gap-2 mb-4">
        <span className={`self-start px-2.5 py-1 text-xs font-mono font-bold rounded-md ${style} border`}>
          {hook}
        </span>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <ul className="space-y-3 text-sm text-[#6B7A88]">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-1" style={{color: accent}}>▸</span> {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OracleFeature({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-[#0D121A]/60 backdrop-blur-xl hover:border-white/[0.12] transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/[0.06] flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-[#6B7A88]">{description}</p>
      </div>
    </div>
  );
}

function BurnMetric({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] text-center">
      <div className="text-3xl font-bold mb-1" style={{color: accent}}>{value}</div>
      <div className="text-xs text-[#6B7A88]">{label}</div>
    </div>
  );
}

function StatCard({ title, value, change, icon, description, accent, badge }: { 
  title: string; value: string; change: string; icon: string; description: string; accent: string; badge?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0D121A]/80 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:border-[${accent}]/30 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="text-3xl">{icon}</div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-[${accent}]/10 border border-[${accent}]/20" style={{color: accent}}>
          {change}
        </span>
      </div>
      <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-[#6B7A88] mb-4">{title}</p>
      <p className="text-xs text-[#6B7A88]/70">{description}</p>
      {badge && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-[#6B7A88]">
            <svg className="w-3 h-3 text-[#00F58C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

function ArchCard({ title, description, features }: { 
  title: string; description: string; features: string[]; 
}) {
  return (
    <div className="rounded-3xl bg-[#0F141C]/80 border border-white/[0.08] backdrop-blur-xl p-8 shadow-2xl h-full">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-[#6B7A88] mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-[#6B7A88]">
            <span className="text-[#00F58C]">▸</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArchitectureFlow() {
  const steps = [
    { label: "USER / WALLET", desc: "Swap Intent" },
    { label: "UNISWAP V4 SINGLETON", desc: "PoolManager" },
    { label: "beforeSwap HOOK", desc: "Toxicity Scan • Dynamic Fees • Tier Check" },
    { label: "SWAP EXECUTION", desc: "Price Impact • Settlement" },
    { label: "afterSwap HOOK", desc: "LVR Measurement • Buyback Trigger • Tier Accrual" },
    { label: "AGENTIC EXECUTION LAYER", desc: "MEV Scanner • Oracle Nodes • Buyback & Burn Engine" },
    { label: "TIER REDISTRIBUTION", desc: "$BLD Alpha → $IMD Alpha → $IMD Holder → Retail" },
  ];

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-10 md:left-[180px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00F58C] via-[#00F5FF] to-[#FFB000] hidden md:block" />
      
      <div className="space-y-8 md:space-y-12">
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-start gap-6 md:pl-[200px]">
            <div className="relative flex-shrink-0 w-20 md:w-[160px] md:pr-6 md:text-right">
              <div className="relative z-10 w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-white/[0.15] bg-[#070A0E] flex items-center justify-center mx-auto md:mx-0 md:ml-auto">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-br from-[#00F58C] to-[#00F5FF]" />
              </div>
              <p className="mt-2 md:mt-0 font-mono text-xs md:text-sm font-semibold text-white text-center md:text-right">{step.label}</p>
            </div>
            <div className="flex-1 pt-1 md:pt-0">
              <p className="text-sm text-[#6B7A88]">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute left-10 md:left-[180px] top-[28px] md:top-[36px] w-[2px] h-[calc(100%-28px)] md:h-[calc(100%-36px)] bg-gradient-to-b from-[#00F58C] to-[#FFB000] hidden md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}