"use client";

import { useState } from "react";

export default function TierFunnel() {
  const [activeTier, setActiveTier] = useState(1);

  const tiers = [
    { id: 1, label: "Tier 1", fee: "0%", multiplier: "4x" },
    { id: 2, label: "Tier 2", fee: "5%", multiplier: "3x" },
    { id: 3, label: "Tier 3", fee: "10%", multiplier: "2x" },
    { id: 4, label: "Tier 4", fee: "20%", multiplier: "1x" },
  ];

  return (
    <div className="mt-12 space-y-8">
      <h2 className="text-sm text-[var(--color-emerald)] font-bold mb-4 tracking-widest glow">
        Tokenomics & Queima
      </h2>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Mecânica do token $IMD: redistribuição de MEV capturado, modelo de queima determinístico baseado no volume de swap, e alocação de 200 NFTs Genesis com isenção de taxas permanentes.
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
            {tiers.map((tier) => (
              <tr key={tier.id} className="border-b border-[var(--color-border-glass)]">
                <td>{tier.label}</td>
                <td>{tier.fee}</td>
                <td>{tier.multiplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}