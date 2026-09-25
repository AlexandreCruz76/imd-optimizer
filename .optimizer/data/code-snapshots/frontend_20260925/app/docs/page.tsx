"use client";

export default function Docs() {
  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center gap-4 mb-4">
        <img src="/pepe/profile.jpeg" alt="Agentic Frog" className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#00ff41]" />
        <div>
          <h1 className="text-base md:text-lg glow-strong tracking-wider">
            ┌─ DOCUMENTATION ────────────────────────────────────────────────────┐
          </h1>
          <div className="text-[10px] md:text-xs text-[#00ff4160]">Version 1.0.0 — Alexandre Cruz da Cunha (@Codeming_web3)</div>
        </div>
      </div>

      {/* 1. The Manifesto */}
      <div className="terminal-panel p-4 border-glow border-[#00ff41]">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ 1. THE MANIFESTO: THE CUSTOMIZATION PARADOX
        </div>
        <div className="space-y-3 text-xs text-[#00ff4180]">
          <p>
            Uniswap V4 revolutionized DeFi with Hooks — contracts enabling infinite pool customization.
            However, this innovation created the <span className="text-[#00ff41]">Customization Paradox</span>: retail
            liquidity remains idle in legacy pools while elastic high-efficiency pools suffer from liquidity fragmentation.
          </p>
          <p>
            The result is massive value leakage as <span className="text-[#00ff41]">Loss-Versus-Rebalancing (LVR)</span>.
            When a Hook executes monetary policy, it generates a price shock. Today, MEV bots extract this inefficiency.
          </p>
          <p className="text-[#00ff41]">
            Optimizer is the institutional response to this bleeding. We are a Meta-Hook and Deterministic Routing
            layer built on V4 Singleton Architecture. We protect capital by intercepting predatory bots, internalizing
            profits, and ensuring users retain value from their own transactions.
          </p>
        </div>
      </div>

      {/* 2. The Identity */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ 2. THE IDENTITY: THE AGENTIC FROG
        </div>
        <div className="space-y-4 text-xs text-[#00ff4180]">
          <div className="flex items-start gap-3">
            <img src="/pepe/profile.jpeg" alt="Frog" className="w-10 h-10 rounded-full shrink-0 border border-[#00ff41]" />
            <div>
              <div className="text-[#00ff41] font-bold">The Agentic Frog (The Pilot)</div>
              <div>Tired of being diluted in inefficient pools, retail is represented by the Agentic Frog.
              He wears an autonomous execution armor (The Optimizer) to fight MEV bots. When his eyes glow
              neon green, a robot has been intercepted.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ff41] shrink-0 flex items-center justify-center text-[#0a0a0a] font-bold">$B</div>
            <div>
              <div className="text-[#00ff41] font-bold">Buildercoin (The Energy)</div>
              <div>The algorithmic green fuel that powers the infrastructure. It rewards decentralized nodes
              that maintain the ecosystem APIs and amplifies protocol yields.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full border border-[#00ff41] shrink-0 flex items-center justify-center text-[#00ff41] text-xs">ID</div>
            <div>
              <div className="text-[#00ff41] font-bold">Identity MD (The Passport)</div>
              <div>Engraved on the Frog's armor, the Identity MD passport certifies native Web3 citizenship,
              conferring authority, privileges, and fee exemptions.</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Progressive Open-Source */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ 3. PROGRESSIVE OPEN-SOURCE SECURITY
        </div>
        <div className="space-y-3 text-xs text-[#00ff4180]">
          <div className="text-[#00ff41] font-bold">Immediate Opening (Day 1):</div>
          <div>Contract Interfaces (IOptimizerHook, IStandardCore), NFT contracts, and IMD Explorer Frontend.</div>

          <div className="text-[#00ff41] font-bold mt-2">Strategic Shielding:</div>
          <div>The algorithmic core — exact Flash Accounting routines and MEV interception math — remains protected.
          Opening this logic prematurely would allow bot farms to reverse-engineer defenses before TVL consolidation.</div>

          <div className="text-[#00ff41] font-bold mt-2">Definitive Licensing (BSL 1.1):</div>
          <div>After Tier-1 Audit completion and market traction, the main repository opens under Business Source License 1.1.
          Public audit possible, but forks legally blocked.</div>
        </div>
      </div>

      {/* 4. Architecture */}
      <div className="terminal-panel p-4 border-glow border-[#ffb000]">
        <div className="text-xs text-[#ffb000] mb-3 tracking-widest">
          ▸ 4. ARCHITECTURE: THE 3 SURGICAL LAYERS
        </div>
        <div className="space-y-4 text-xs text-[#00ff4180]">
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-[#00ff41] font-bold">Layer 1: Identity-Fi (beforeSwap)</div>
            <div className="mt-1">Before transaction processing, contract verifies wallet. VIP pass holders (Identity MD or Genesis) receive institutional discounts. Common retail pays premium routing fee. Surplus goes to yield vault.</div>
          </div>
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-[#00ff41] font-bold">Layer 2: Elasticity Machine (afterSwap)</div>
            <div className="mt-1">"Elasticity is not about blindly burning tokens; it's about coordinating supply contraction with the exact moment of pool stress. Our motor acts as the deterministic trigger that forces scarcity when price needs support."</div>
            <div className="text-[#00ff4160] mt-1">— Alexandre Cruz da Cunha</div>
          </div>
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-[#00ff41] font-bold">Layer 3: MEV Internalization (The Algorithmic Shield)</div>
            <div className="mt-1">"The biggest mistake current protocols make is allowing the price shock caused by their elastic policies to be arbitrated by external actors. Optimizer intercepts the block. We detect inefficiency, execute arbitrage in the same split second, and inject that spread directly into our users' liquidity vault."</div>
            <div className="text-[#00ff4160] mt-1">— Alexandre Cruz da Cunha</div>
          </div>
        </div>
      </div>

      {/* 5. Tokenomics */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ 5. REAL VALUE ECONOMY & BUILDERCOIN
        </div>
        <div className="space-y-3 text-xs text-[#00ff4180]">
          <p>Optimizer doesn't print inflationary tokens. We distribute <span className="text-[#00ff41]">Real Yield</span> captured from
          atomic arbitrage and VIP fee asymmetry.</p>

          <div className="text-[#00ff41] font-bold mt-2">Conservative Daily Projection ($10M Volume):</div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="border border-[#00ff4130] p-2">
              <div className="text-[#00ff41]">Fee Revenue (0.1%-0.5%)</div>
              <div>~$29,000/day</div>
            </div>
            <div className="border border-[#00ff4130] p-2">
              <div className="text-[#00ff41]">Internalized MEV (~0.2%)</div>
              <div>~$20,000/day</div>
            </div>
          </div>

          <div className="text-[#00ff41] font-bold mt-2">Distribution (75% LPs / 25% Treasury):</div>
          <div>LPs receive ~$36,750 daily injected into ERC-4626 vault.</div>

          <div className="text-[#00ff41] font-bold mt-2">The Black Hole Sink (Buildercoin):</div>
          <div>LPs who acquire and stake Buildercoins alongside deposits activate yield multiplier.
          Smart Money forced to drain Buildercoin liquidity to maximize profits.</div>
        </div>
      </div>

      {/* 6. The Standard Integration */}
      <div className="terminal-panel p-4 border-glow border-[#ffb000]">
        <div className="text-xs text-[#ffb000] mb-3 tracking-widest">
          ▸ 6. THE STANDARD: ATOMIC CONTRACTION EXECUTION
        </div>
        <div className="space-y-3 text-xs text-[#00ff4180]">
          <p>The Standard ($STANDARD) uses its Uniswap V4 pool (ETH/$STANDARD) as oracle and monetary regulator.
          Severe drops require token burning (contraction). Optimizer acts as atomic shield:</p>
          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2">
              <span className="text-[#00ff41]">1.</span>
              <div><span className="text-[#00ff41]">Off-Chain Shielding:</span> dApp routes via Flashbots RPC, nullifying sandwich attacks.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#00ff41]">2.</span>
              <div><span className="text-[#00ff41]">Sale & Capture:</span> Contract executes user token liquidation. Same millisecond, Optimizer calculates distortion and buys depreciated currency.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#00ff41]">3.</span>
              <div><span className="text-[#00ff41]">Mathematical Burn:</span> Optimizer calls IStandardCore.burn() natively, destroying excess tokens to restore parity.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#00ff41]">4.</span>
              <div><span className="text-[#00ff41]">LP Profit:</span> Remaining ETH profit from arbitrage goes directly to Optimizer liquidity providers.</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Genesis NFT */}
      <div className="terminal-panel p-4 border-glow border-[#ff00d4]">
        <div className="text-xs text-[#ff00d4] mb-3 tracking-widest">
          ▸ 7. GENESIS NFT: THE LAUNCH RAMP
        </div>
        <div className="space-y-3 text-xs text-[#00ff4180]">
          <p>To fund core development and Tier-1 audits, Pre-Seed allocation governed by Optimizer Genesis NFTs
          (Strict Supply: 200 keys).</p>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="border border-[#00ff4130] p-2">
              <div className="text-[#00ff41]">Core Team (Free Mint)</div>
              <div>10% (20 NFTs)</div>
            </div>
            <div className="border border-[#00ff4130] p-2">
              <div className="text-[#00ff41]">Buildercoin Snapshot</div>
              <div>20% (40 NFTs) — Merkle Tree</div>
            </div>
            <div className="border border-[#00ff4130] p-2">
              <div className="text-[#00ff41]">Ecosystem ($IMD / Standard)</div>
              <div>50% (100 NFTs) — Competitive</div>
            </div>
            <div className="border border-[#00ff4130] p-2">
              <div className="text-[#00ff41]">Retail (FCFS)</div>
              <div>20% (40 NFTs) — Public Premium</div>
            </div>
          </div>

          <div className="mt-2 text-[#00ff41]">
            Vital Privilege: Genesis NFT waives 100% routing fees and applies aggressive MEV allocation multipliers.
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ QUICK LINKS
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <a href="/swap" className="text-[#00ff41] hover:underline">SWAP →</a>
          <a href="/nft-mint" className="text-[#00ff41] hover:underline">MINT GENESIS →</a>
          <a href="/staking" className="text-[#00ff41] hover:underline">STAKE $BUILD →</a>
          <a href="https://github.com/optimizer-protocol" target="_blank" className="text-[#00ff41] hover:underline">GITHUB →</a>
        </div>
      </div>

      <div className="text-xs text-[#00ff4140] tracking-wider">
        └────────────────────────────────────────────────────────────────────────┘
      </div>
    </div>
  );
}
