"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ============================================================================
// Protocol Monitor — componentes visuais (SVG puro, zero dependências)
// Identidade neon/hacker IMD: emerald #00F58C, cyan #00F5FF, fundo #070A0F
// ============================================================================

const EMERALD = "#00F58C";
const CYAN = "#00F5FF";
const AMBER = "#FFB000";
const ROSE = "#FB7185";
const VIOLET = "#A78BFA";

export const SERIES_COLORS = [EMERALD, CYAN, AMBER, VIOLET, ROSE];

/** Padrão DeFi (Etherscan/DeFiLlama): nunca notação científica —
 * abre casas decimais até aparecer dígito significativo (máx 18 = wei). */
export function fmtEthVal(n: number): string {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  let digits = 4;
  if (abs < 1) digits = 6;
  if (abs < 1e-4) digits = 8;
  if (abs < 1e-6) digits = 10;
  if (abs < 1e-9) digits = 14;
  if (abs < 1e-15) digits = 18;
  return n.toLocaleString("en-US", { maximumFractionDigits: Math.min(18, digits) });
}

// ---------------------------------------------------------------------------
// CountUp — número que interpola suavemente quando o valor muda
// ---------------------------------------------------------------------------
export function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) {
      setDisplay(target);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (target - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

// ---------------------------------------------------------------------------
// PulseDot — indicador LIVE pulsante
// ---------------------------------------------------------------------------
export function PulseDot({ color = EMERALD }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: color, animation: "ping 1.4s cubic-bezier(0,0,.2,1) infinite" }}
      />
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:.75}80%,100%{transform:scale(2.6);opacity:0}}`}</style>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sparkline — mini-série para os KPI tiles
// ---------------------------------------------------------------------------
export function Sparkline({
  values,
  color = EMERALD,
  width = 120,
  height = 32,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeOpacity="0.25"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 2) + 1;
    const y = height - 3 - ((v - min) / span) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color}>
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// StackedAreaChart — TVL por pool ao longo dos blocos (estilo DeFi/PowerBI)
// ---------------------------------------------------------------------------
export interface StackSeries {
  name: string;
  color: string;
  values: number[]; // ETH
}

export function StackedAreaChart({
  blocks,
  series,
  height = 260,
}: {
  blocks: number[];
  series: StackSeries[];
  height?: number;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(720);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw) setW(Math.max(320, cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = series.filter((s) => !hidden.has(s.name));
  const { layers, maxY, padX } = useMemo(() => {
    const n = blocks.length;
    if (n < 2 || visible.length === 0) return { layers: [], maxY: 1, padX: 44 };
    const padX = 48;
    const padY = 14;
    const innerW = w - padX - 8;
    const innerH = height - padY * 2;
    const totals = blocks.map((_, i) =>
      visible.reduce((a, s) => a + (s.values[i] ?? 0), 0)
    );
    const maxY = Math.max(...totals, 1e-9);
    // acumula de baixo para cima
    const base = new Array(n).fill(0);
    const built = visible.map((s) => {
      const top = s.values.map((v, i) => base[i] + (v ?? 0));
      const pts: string[] = [];
      const area: string[] = [];
      for (let i = 0; i < n; i++) {
        const x = padX + (i / (n - 1)) * innerW;
        const yT = padY + innerH - (top[i] / maxY) * innerH;
        pts.push(`${x.toFixed(1)},${yT.toFixed(1)}`);
        area.push(`${x.toFixed(1)},${yT.toFixed(1)}`);
      }
      for (let i = n - 1; i >= 0; i--) {
        const x = padX + (i / (n - 1)) * innerW;
        const yB = padY + innerH - (base[i] / maxY) * innerH;
        area.push(`${x.toFixed(1)},${yB.toFixed(1)}`);
      }
      for (let i = 0; i < n; i++) base[i] = top[i];
      return { name: s.name, color: s.color, pts, area: area.join(" "), top };
    });
    return { layers: built, maxY, padX };
  }, [blocks, visible, w, height]);

  const padY = 14;
  const innerH = height - padY * 2;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const innerW = w - padX - 8;
    const p = Math.max(0, Math.min(1, (x - padX) / innerW));
    setHover(Math.round(p * (blocks.length - 1)));
  };

  if (blocks.length < 2) {
    return (
      <div ref={wrapRef} className="flex items-center justify-center h-[260px] text-xs text-slate-600 font-mono">
        Coletando séries históricas…
      </div>
    );
  }

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => f);

  return (
    <div ref={wrapRef} className="relative select-none">
      <svg
        width={w}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="block"
      >
        <defs>
          {layers.map((l) => (
            <linearGradient key={l.name} id={`grad-${l.name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={l.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={l.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        {/* grid horizontal */}
        {gridLines.map((f) => {
          const y = padY + innerH - f * innerH;
          return (
            <g key={f}>
              <line x1={padX} y1={y} x2={w - 8} y2={y} stroke="#FFFFFF" strokeOpacity="0.05" />
              <text x={padX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#6B7A88" fontFamily="monospace">
                {fmtEthVal(maxY * f)}
              </text>
            </g>
          );
        })}
        {/* áreas empilhadas */}
        {layers.map((l) => (
          <polygon
            key={l.name}
            points={l.area}
            fill={`url(#grad-${l.name})`}
            stroke={l.color}
            strokeWidth="1.25"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 4px ${l.color}44)` }}
          >
            <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
          </polygon>
        ))}
        {/* crosshair */}
        {hover !== null && (
          <g>
            <line
              x1={padX + (hover / (blocks.length - 1)) * (w - padX - 8)}
              y1={padY}
              x2={padX + (hover / (blocks.length - 1)) * (w - padX - 8)}
              y2={padY + innerH}
              stroke={CYAN}
              strokeOpacity="0.5"
              strokeDasharray="3 3"
            />
            {layers.map((l) => (
              <circle
                key={l.name}
                cx={padX + (hover / (blocks.length - 1)) * (w - padX - 8)}
                cy={padY + innerH - (l.top[hover] / maxY) * innerH}
                r="3"
                fill="#070A0F"
                stroke={l.color}
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}
        {/* eixo X — blocos */}
        <text x={padX} y={height - 2} fontSize="9" fill="#6B7A88" fontFamily="monospace">
          bloco {blocks[0].toLocaleString("en-US")}
        </text>
        <text x={w - 8} y={height - 2} fontSize="9" fill="#6B7A88" fontFamily="monospace" textAnchor="end">
          {blocks[blocks.length - 1].toLocaleString("en-US")}
        </text>
      </svg>

      {/* tooltip */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#0B111A]/95 px-3 py-2 font-mono text-[10px] shadow-xl backdrop-blur"
          style={{
            left: Math.min(Math.max(padX + (hover / (blocks.length - 1)) * (w - padX - 8) + 12, 8), w - 160),
            top: 8,
          }}
        >
          <div className="text-slate-500 mb-1">
            bloco {blocks[hover].toLocaleString("en-US")}
          </div>
          {layers.map((l) => (
            <div key={l.name} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
              <span className="text-slate-400">{l.name}</span>
              <span className="ml-auto text-white">{fmtEthVal(l.top[hover] - (layers[layers.indexOf(l) - 1]?.top[hover] ?? 0))}</span>
            </div>
          ))}
          <div className="mt-1 border-t border-white/10 pt-1 text-[#00F58C]">
            total {fmtEthVal(layers[layers.length - 1]?.top[hover] ?? 0)} ETH
          </div>
        </div>
      )}

      {/* legend toggles */}
      <div className="mt-2 flex flex-wrap gap-2">
        {series.map((s) => {
          const off = hidden.has(s.name);
          return (
            <button
              key={s.name}
              onClick={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(s.name)) next.delete(s.name);
                  else next.add(s.name);
                  return next;
                })
              }
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
                off
                  ? "border-white/5 text-slate-600"
                  : "border-white/10 text-slate-300 hover:border-white/25"
              }`}
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: off ? "#334155" : s.color, boxShadow: off ? "none" : `0 0 6px ${s.color}88` }}
              />
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DonutChart — distribuição de liquidez por pool
// ---------------------------------------------------------------------------
export function DonutChart({
  items,
  size = 180,
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  // offsets cumulativos pré-computados (imutável — sem reassign no map)
  const starts: number[] = [];
  {
    let acc = 0;
    for (const it of items) {
      starts.push(acc);
      acc += (it.value / total) * c;
    }
  }

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke="#FFFFFF" strokeOpacity="0.04" strokeWidth="16" />
          {items.map((it, i) => {
            const frac = it.value / total;
            const len = frac * c;
            return (
              <circle
                key={it.label}
                r={r}
                fill="none"
                stroke={it.color}
                strokeWidth={active === i ? 20 : 16}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-starts[i]}
                strokeLinecap="butt"
                opacity={active === null || active === i ? 1 : 0.3}
                style={{
                  transition: "stroke-width .15s, opacity .15s",
                  filter: `drop-shadow(0 0 5px ${it.color}55)`,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="16" fontFamily="monospace" fill="#E8E8E8">
          {active !== null ? `${((items[active].value / total) * 100).toFixed(1)}%` : "TVL"}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#6B7A88">
          {active !== null ? items[active].label : `${fmtEthVal(total)} ETH`}
        </text>
      </svg>
      <ul className="space-y-1.5 font-mono text-[11px]">
        {items.map((it, i) => (
          <li
            key={it.label}
            className={`flex items-center gap-2 cursor-default transition-opacity ${active === null || active === i ? "opacity-100" : "opacity-40"}`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="h-2 w-2 rounded-sm" style={{ background: it.color, boxShadow: `0 0 5px ${it.color}88` }} />
            <span className="text-slate-400 w-16">{it.label}</span>
            <span className="text-white">{fmtEthVal(it.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BarList — barras horizontais animadas (usuários, swaps…)
// ---------------------------------------------------------------------------
export function BarList({
  items,
  unit = "",
  color = EMERALD,
  max: maxProp,
}: {
  items: { label: string; value: number; sub?: string }[];
  unit?: string;
  color?: string;
  max?: number;
}) {
  const max = maxProp ?? Math.max(...items.map((i) => i.value), 1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label} className="group">
          <div className="flex items-baseline justify-between font-mono text-[11px] mb-1">
            <span className="text-slate-400 group-hover:text-white transition-colors">{it.label}</span>
            <span className="text-white">
              {it.value.toLocaleString("en-US")}
              {unit && <span className="text-slate-500 ml-1">{unit}</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: mounted ? `${Math.max(2, (it.value / max) * 100)}%` : "0%",
                background: `linear-gradient(90deg, ${color}, ${CYAN})`,
                boxShadow: `0 0 8px ${color}66`,
              }}
            />
          </div>
          {it.sub && <div className="mt-0.5 font-mono text-[9px] text-slate-600">{it.sub}</div>}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// SwapBars — barras verticais dos swaps individuais (volume out por swap)
// ---------------------------------------------------------------------------
export function SwapBars({
  swaps,
  height = 120,
}: {
  swaps: { block: number; userOut: string; user: string }[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(600);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw) setW(Math.max(280, cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (swaps.length === 0) {
    return (
      <div ref={wrapRef} className="flex items-center justify-center font-mono text-xs text-slate-600" style={{ height }}>
        Sem swaps registrados ainda.
      </div>
    );
  }

  const vals = swaps.map((s) => Number(s.userOut) / 1e18);
  const max = Math.max(...vals, 1e-9);
  const gap = 4;
  const barW = Math.max(6, Math.min(28, (w - (swaps.length - 1) * gap) / swaps.length));

  return (
    <div ref={wrapRef} className="relative" style={{ height: height + 22 }}>
      <svg width={w} height={height}>
        {vals.map((v, i) => {
          const h = Math.max(2, (v / max) * (height - 8));
          const x = i * (barW + gap);
          const y = height - h;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="2"
                fill={hover === i ? CYAN : EMERALD}
                opacity={hover === null || hover === i ? 0.9 : 0.35}
                style={{
                  transition: "fill .1s, opacity .15s",
                  filter: `drop-shadow(0 0 ${hover === i ? 6 : 3}px ${hover === i ? CYAN : EMERALD}66)`,
                }}
              >
                <animate attributeName="height" from="0" to={h} dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" keyTimes="0;1" />
                <animate attributeName="y" from={height} to={y} dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" keyTimes="0;1" />
              </rect>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#0B111A]/95 px-2.5 py-1.5 font-mono text-[10px] shadow-xl"
          style={{
            left: Math.min(Math.max(hover * (barW + gap) - 40, 0), w - 150),
            top: 0,
          }}
        >
          <div className="text-white">{fmtEthVal(vals[hover])} ETH</div>
          <div className="text-slate-500">bloco {swaps[hover].block.toLocaleString("en-US")}</div>
          <div className="text-slate-500">{swaps[hover].user.slice(0, 8)}…</div>
        </div>
      )}
      <div className="flex justify-between font-mono text-[9px] text-slate-600 mt-1">
        <span>swap #1</span>
        <span className="text-slate-500">volume de saída por swap (ETH) — hover p/ detalhes</span>
        <span>#{vals.length}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GaugeArc — arco semicircular animado (ex: slippage honrado %)
// ---------------------------------------------------------------------------
export function GaugeArc({
  value,
  max = 100,
  label,
  unit = "%",
  color = EMERALD,
  size = 140,
}: {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}) {
  const frac = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 14;
  const c = Math.PI * r; // meia circunferência
  const animated = useCountUp(frac * 100);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 18}>
        <path
          d={`M ${14} ${size / 2 + 4} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2 + 4}`}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.06"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M ${14} ${size / 2 + 4} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2 + 4}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(animated / 100) * c} ${c}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke .1s linear" }}
        />
        <text x="50%" y={size / 2 - 4} textAnchor="middle" fontSize="18" fontFamily="monospace" fill="#E8E8E8">
          {animated.toFixed(1)}
          <tspan fontSize="10" fill="#6B7A88">{unit}</tspan>
        </text>
      </svg>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompareAreaChart — 2 séries sobrepostas (ex: TVL hook vs native em USD)
// com crosshair + tooltip. SVG puro, zero dependências.
// ---------------------------------------------------------------------------
export interface CompareSeries {
  name: string;
  color: string;
  values: number[];
}

export function CompareAreaChart({
  labels,
  series,
  height = 240,
  unit = "",
}: {
  labels: string[];
  series: CompareSeries[];
  height?: number;
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = 800;
  const padX = 48;
  const padY = 18;
  const padBottom = 22;
  const n = labels.length;
  const flat = series.flatMap((s) => s.values);
  const maxY = Math.max(...flat, 1e-9);
  const minY = Math.min(...flat, 0);
  const spanY = maxY - minY || 1;

  const xAt = (i: number) => (n <= 1 ? padX : padX + (i / (n - 1)) * (W - padX * 2));
  const yAt = (v: number) => padY + (1 - (v - minY) / spanY) * (height - padY - padBottom);

  const fmtV = (v: number) => {
    if (!isFinite(v)) return "—";
    if (Math.abs(v) >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (Math.abs(v) >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return v.toLocaleString("en-US", { maximumFractionDigits: 4 });
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          const r = wrapRef.current?.getBoundingClientRect();
          if (!r || n < 2) return;
          const relX = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((relX - padX) / (W - padX * 2)) * (n - 1));
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`cmp-fill-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const v = minY + spanY * f;
          const y = yAt(v);
          return (
            <g key={f}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#FFFFFF" strokeOpacity="0.05" />
              <text x={padX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#6B7A88" fontFamily="monospace">
                {fmtV(v)}
              </text>
            </g>
          );
        })}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
          const area = `${padX},${height - padBottom} ${pts.join(" ")} ${xAt(n - 1).toFixed(1)},${height - padBottom}`;
          return (
            <g key={si}>
              <polygon points={area} fill={`url(#cmp-fill-${si})`} />
              <polyline
                points={pts.join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth="1.6"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {hover !== null && (
                <circle cx={xAt(hover)} cy={yAt(s.values[hover] ?? 0)} r="3" fill={s.color} stroke="#070A0F" strokeWidth="1" />
              )}
            </g>
          );
        })}
        {hover !== null && (
          <line x1={xAt(hover)} y1={padY} x2={xAt(hover)} y2={height - padBottom} stroke="#FFFFFF" strokeOpacity="0.18" strokeDasharray="3 3" />
        )}
        {n >= 2 && (
          <>
            <text x={padX} y={height - 6} fontSize="9" fill="#6B7A88" fontFamily="monospace">{labels[0]}</text>
            <text x={W - padX} y={height - 6} textAnchor="end" fontSize="9" fill="#6B7A88" fontFamily="monospace">{labels[n - 1]}</text>
          </>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-[#0B111A]/95 px-2.5 py-1.5 font-mono text-[10px] shadow-lg"
          style={{ left: `${Math.min(85, Math.max(4, (hover / Math.max(1, n - 1)) * 100))}%` }}
        >
          <div className="text-slate-500">{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              <span className="text-slate-400">{s.name}</span>
              <span className="ml-auto text-white">{fmtV(s.values[hover] ?? 0)}{unit}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 flex gap-4 font-mono text-[10px]">
        {series.map((s, si) => (
          <span key={si} className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
