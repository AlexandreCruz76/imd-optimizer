"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./components/WalletProvider";

export default function Dashboard() {
  const { connected, address, chainId } = useWallet();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/pool-state");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Hero Section */}
      <div className="terminal-panel p-6 border-glow border-[#00ff41]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <img src="/pepe/profile.jpeg" alt="Agentic Frog" className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#00ff41] glow pepe-hover" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-xl md:text-2xl glow-strong tracking-wider mb-2">
              THE AGENTIC FROG
            </h1>
            <p className="text-xs md:text-sm text-[#00ff4160] max-w-2xl">
              Meta-Hook que internaliza MEV e protege o capital do varejo contra robôs predadores.
              Construído sobre Uniswap V4 Singleton Architecture.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-1">TVL</div>
          <div className="text-lg md:text-xl text-[#00ff41] glow">{stats?.hookLiqETH || "0"} ETH</div>
        </div>
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-1">APY</div>
          <div className="text-lg md:text-xl text-[#00ff41] glow">308%</div>
        </div>
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-1">MEV CAPTURED</div>
          <div className="text-lg md:text-xl text-[#00ff41] glow">Internal</div>
        </div>
        <div className="terminal-panel p-4 border-glow">
          <div className="text-xs text-[#00ff4160] mb-1">NFT SUPPLY</div>
          <div className="text-lg md:text-xl text-[#00ff41] glow">200 Genesis</div>
        </div>
      </div>

      {/* 3 Layers */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ THE 3-LAYER META-HOOK
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-[#00ff41] font-bold mb-1">LAYER 1: IDENTITY-FI</div>
            <div className="text-[#00ff4160]">beforeSwap — Lê NFT, aplica taxa dinâmica. Genesis=0%, MD=0.1%, Retail=0.5%</div>
          </div>
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-[#00ff41] font-bold mb-1">LAYER 2: ELASTICITY</div>
            <div className="text-[#00ff4160]">afterSwap — Coordena contração com The Standard. Burn determinístico.</div>
          </div>
          <div className="p-3 bg-[#00ff4105] border border-[#00ff4120]">
            <div className="text-[#00ff41] font-bold mb-1">LAYER 3: MEV INTERNALIZATION</div>
            <div className="text-[#00ff4160]">afterSwap — Intercepta robôs, captura arbitragem, devolve ao LP.</div>
          </div>
        </div>
      </div>

      {/* Lore */}
      <div className="terminal-panel p-4 border-glow">
        <div className="text-xs text-[#00ff4160] mb-3 tracking-widest">
          ▸ THE LORE
        </div>
        <div className="space-y-4 text-xs text-[#00ff4160]">
          <div className="flex items-start gap-3">
            <img src="/pepe/profile.jpeg" alt="Frog" className="w-10 h-10 rounded-full shrink-0 border border-[#00ff41]" />
            <div>
              <div className="text-[#00ff41]">The Agentic Frog (O Piloto)</div>
              <div>Cansado de ser diluído em pools ineficientes, o varejo é representado pelo Sapo Agêntico. Ele veste uma armadura de execução autônoma para lutar contra os robôs de MEV.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ff41] shrink-0 flex items-center justify-center text-[#0a0a0a] font-bold">$B</div>
            <div>
              <div className="text-[#00ff41]">Buildercoin (A Energia)</div>
              <div>O combustível algorítmico verde que alimenta a infraestrutura. Recompensa os nós que mantêm as APIs do ecossistema.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full border border-[#00ff41] shrink-0 flex items-center justify-center text-[#00ff41] text-xs">ID</div>
            <div>
              <div className="text-[#00ff41]">Identity MD (O Passaporte)</div>
              <div>Gravado no peito da armadura, atesta cidadania nativa Web3, conferindo isenções de taxas.</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/oracle" className="terminal-panel p-4 border-glow border-[#00ff41] hover:bg-[#00ff4105] transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ff41] flex items-center justify-center text-[#0a0a0a] font-bold group-hover:scale-110 transition-transform">O</div>
            <div>
              <div className="text-base md:text-lg text-[#00ff41] glow mb-1">ORACLE</div>
              <div className="text-xs text-[#00ff4160]">MEV Intelligence. Live blockchain scan.</div>
            </div>
          </div>
        </a>
        <a href="/nft-mint" className="terminal-panel p-4 border-glow border-[#00ff41] hover:bg-[#00ff4105] transition-all group">
          <div className="flex items-center gap-3">
            <img src="/pepe/profile.jpeg" alt="Genesis" className="w-10 h-10 rounded-full border border-[#00ff41] group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-base md:text-lg text-[#00ff41] glow mb-1">MINT GENESIS KEY</div>
              <div className="text-xs text-[#00ff4160]">200 keys. 0% fees forever. MEV revenue share.</div>
            </div>
          </div>
        </a>
        <a href="/staking" className="terminal-panel p-4 border-glow border-[#ffb000] hover:bg-[#ffb00005] transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffb000] flex items-center justify-center text-[#0a0a0a] font-bold group-hover:scale-110 transition-transform">$B</div>
            <div>
              <div className="text-base md:text-lg text-[#ffb000] mb-1">STAKE $BUILDER</div>
              <div className="text-xs text-[#00ff4160]">Earn 60% of protocol fees. 37-68.5% APY.</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
