import React from "react";

interface PoolIconProps {
  token0Symbol: string;
  token1Symbol: string;
  token0Logo?: string;
  token1Logo?: string;
  tierFee?: string;
  size?: "sm" | "md" | "lg";
}

export const PoolPairIcon: React.FC<PoolIconProps> = ({
  token0Symbol,
  token1Symbol,
  token0Logo,
  token1Logo,
  tierFee,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const badgeSize = {
    sm: "text-[9px] px-1.5 py-0.2",
    md: "text-[10px] px-2 py-0.5",
    lg: "text-xs px-2.5 py-1",
  };

  const ringSize = {
    sm: "ring-1",
    md: "ring-2",
    lg: "ring-3",
  };

  return (
    <div className="relative inline-flex items-center select-none ring-2 ring-[#0A0D12]">
      <div className="flex items-center -space-x-3">
        {/* Token 0 - Principal with subtle ring */}
        <div
          className={`${sizeClasses[size]} rounded-full bg-[#0D1318] ring-1 ring-[#0A0D12]/30 flex items-center justify-center overflow-hidden z-10`}
        >
          {token0Logo ? (
            <img src={token0Logo} alt={token0Symbol} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono font-bold text-[#6B7A88]">
              {token0Symbol.slice(0, 3)}
            </span>
          )}
        </div>

        {/* Token 1 - Secundário com anel maior */}
        <div
          className={`${sizeClasses[size]} rounded-full bg-[#070B0E] ring-1 ring-[#0A0D12]/30 flex items-center justify-center overflow-hidden ring-2 ring-[#0A0D12]`}
        >
          {token1Logo ? (
            <img src={token1Logo} alt={token1Symbol} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono font-bold text-[#6B7A88]">
              {token1Symbol.slice(0, 3)}
            </span>
          )}
        </div>
      </div>

      {/* Badge de Taxa / Hook Estilo Terminal Discreto */}
      {tierFee && (
        <span
          className={`ml-2 rounded-full text-[9px] px-2 py-0.5 bg-[#131C22] text-[#00F58C]/40 border border-[#00F58C]/20 shadow-[0_0_8px_rgba(0,245,140,0.15)] ${badgeSize[size]}`}
        >
          {tierFee}
        </span>
      )}
    </div>
  );
};