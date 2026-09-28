"use client";

import { useState, useEffect } from "react";

/* Backgrounds definitions - used directly in classNames */
export const heroBackground = "bg-gradient-to-br from-[#0B0E14] via-[#1a1a2e] to-[#16213e]";

export type BackgroundKey = "hero";

export const SectionBackground = ({
  variant = "hero",
}: {
  variant?: BackgroundKey;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  /* Usa a key correta para lookup */
  const bg = variant === "hero" ? heroBackground : "bg-gradient-to-br from-[#0B0E14] via-[#1a1a2e] to-[#16213e]";

  return (
    <div
      className={`min-h-[400px] ${bg} rounded-2xl overflow-hidden`}
    >
      {visible && (
        <div className="absolute inset-0 opacity-20 blur-xl" />
      )}
    </div>
  );
};