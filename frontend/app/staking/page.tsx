"use client";

import { useState } from "react";
import { useWallet } from "../components/WalletProvider";

/**
 * Página legada de staking — sem execução on-chain.
 * Regras exibidas = BuilderStakingVault DEC-020 (Diamond Hands).
 * O staking real entra em ação via aba VAULT / BuilderStakingVault no mainnet.
 */
export default function StakingPage() {
  const { connected } = useWallet();
  const [error, setError] = useState<string | null>(null);

  function handleDemoAction(action: string) {
    setError(
      `Demo: ${action} on-chain disponível após deploy do BuilderStakingVault (mainnet). Nenhuma transação é assinada nesta página.`
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tick">Builder Staking — Diamond Hands</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Yield ponderado por Identity Tier (DEC-020) — yield = stake ×
              multiplicador (4x / 3x / 1x / 0x)
            </p>
          </div>
        </div>

        {/* Honestidade: página demo */}
        <div className="mb-8 p-3 rounded-xl border border-[#FFB000]/40 bg-[#FFB000]/10 text-xs text-[#FFB000] font-mono">
          ⚠ PAGINA DEMO — nenhuma transação é assinada aqui. As regras abaixo
          são as do BuilderStakingVault (DEC-020); o stake real será executado
          via aba VAULT após o deploy.
        </div>

        {/* Diamond Hand Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 rounded-2xl border border-[#00F58C]/30">
            <div className="text-xs text-[#00F58C]/60 mb-1 tracking-wider">
              CLAIM YIELD
            </div>
            <div className="text-xl font-bold text-[#00F58C]">0% de taxa</div>
            <div className="text-sm text-[#6B7A88] mt-1">
              claimYield() sem cobrança — Diamond Hands ficam com 100%
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-[#00F58C]/30">
            <div className="text-xs text-[#00F58C]/60 mb-1 tracking-wider">
              UNSTAKE COM CARÊNCIA
            </div>
            <div className="text-xl font-bold text-[#00F58C]">7 dias · 0%</div>
            <div className="text-sm text-[#6B7A88] mt-1">
              beginUnbond() → completeUnbond() após 7 dias, sem penalty
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-[#FFB000]/30">
            <div className="text-xs text-[#FFB000]/60 mb-1 tracking-wider">
              UNSTAKE INSTANTÂNEO
            </div>
            <div className="text-xl font-bold text-[#FFB000]">2–5% penalty</div>
            <div className="text-sm text-[#6B7A88] mt-1">
              emergencyInstantWithdraw() → 50% Buy-and-Burn · 25% Treasury · 25%
              yield ponderado
            </div>
          </div>
        </div>

        {/* Action Buttons (demo — sem assinatura) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => handleDemoAction("stake")}
            disabled={!connected}
            className="py-3 text-xs tracking-wider font-bold bg-[#00F58C]/10 border border-[#00F58C]/40 text-[#00F58C] hover:bg-[#00F58C]/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
          >
            {connected ? "STAKE (demo)" : "CONNECT WALLET"}
          </button>
          <button
            onClick={() => handleDemoAction("unstake")}
            disabled={!connected}
            className="py-3 text-xs tracking-wider font-bold bg-[#FFB000]/10 border border-[#FFB000]/40 text-[#FFB000] hover:bg-[#FFB000]/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
          >
            UNSTAKE (demo)
          </button>
        </div>

        {/* Staking Rules */}
        <div className="mt-8 pt-8 border-t border-[#00F58C]/30">
          <h2 className="text-sm text-[#00F58C] font-bold mb-4 tracking-widest">
            REGRAS (DEC-020 · BUILDER STAKING VAULT)
          </h2>
          <div className="space-y-3 text-sm text-[#6B7A88]">
            <div>• Yield ponderado = stake × multiplicador do Tier (4x Alpha, 3x Partner, 1x Holder, 0x Retail)</div>
            <div>• Sem stake não há yield — multiplicador sozinho não conta (weight = stake × mult)</div>
            <div>• Cofre (OptimizerVaultV2) split: 60% Stakers · 20% Treasury · 15% Devs · 5% Buy-and-Burn</div>
            <div>• claimYield() sem taxa (0%) — só o principal pode ser sacado, yield é distribuído</div>
            <div>• Unstake com carência de 7 dias: 0% de penalty; instantâneo: 2–5% (50/25/25)</div>
            <div>• Sem APY fixo prometido — yield vem do cofre real, distribuído on-chain</div>
          </div>
        </div>

        {/* Error / info */}
        {error && (
          <div className="mt-6 terminal-panel p-3 border border-[#ffb000]">
            <div className="text-xs text-[#ffb000]">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
