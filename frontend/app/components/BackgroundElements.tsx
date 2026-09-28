"use client";

import { useState, useEffect } from "react";

export const BACKGROUNDS = {
  hero: "bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]",
};

export const SectionBackground = ({
  variant,
}: {
  variant: keyof typeof BACKGROUNDS;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-[400px] ${BACKGROUNDS[variant]} rounded-2xl overflow-hidden`}
    >
      {visible && (
        <div className="absolute inset-0 opacity-20 blur-xl" />
      )}
    </div>
  );
};