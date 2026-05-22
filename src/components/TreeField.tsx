import { AppConfig } from "@/config/appConfig";
import { useEffect, useRef, useState } from "react";

type Props = { score: number; cfg: AppConfig };

// Richer, layered palettes (highlight / mid / shadow) for more realistic foliage
const TREE_PALETTES = [
  { hi: "#b9dba0", mid: "#7eb87a", lo: "#3f7a48", trunk: "#5b3a23", trunkHi: "#7a5638" },
  { hi: "#aed59a", mid: "#76b074", lo: "#3a7142", trunk: "#553520", trunkHi: "#724d30" },
  { hi: "#c4e2a8", mid: "#85bf7e", lo: "#447f4c", trunk: "#5e3d26", trunkHi: "#7d5837" },
  { hi: "#a6cf91", mid: "#6ea96b", lo: "#346a3d", trunk: "#4f3220", trunkHi: "#6b4a2e" },
];

function Tree({
  stage,
  x,
  palette,
  variant = 0,
}: {
  stage: number;
  x: number;
  palette: (typeof TREE_PALETTES)[number];
  variant?: number;
}) {
  // stage 0..1 (seedling -> full grown)
  const s = Math.max(0.05, Math.min(1, stage));
  const trunkH = 10 + s * 48;
  const trunkBaseW = 2 + s * 5;
  const trunkTopW = 1.5 + s * 2.8;
  const crownR = 8 + s * 32;
  const crownCy = -trunkH - crownR * 0.55;
  const tilt = variant % 2 === 0 ? -1 : 1;

  // Tapered trunk polygon
  const trunk = `M ${-trunkBaseW},0 L ${trunkBaseW},0 L ${trunkTopW},${-trunkH} L ${-trunkTopW},${-trunkH} Z`;

  return (
    <g transform={`translate(${x}, 0)`} style={{ transition: "all 800ms ease" }}>
      {/* ground shadow */}
      <ellipse cx={0} cy={2} rx={crownR * 0.9} ry={crownR * 0.18} fill="#2c4a2e" opacity={0.18} />

      {/* trunk with subtle highlight */}
      <path d={trunk} fill={palette.trunk} />
      <path
        d={`M ${-trunkBaseW * 0.4},0 L ${-trunkTopW * 0.3},${-trunkH}`}
        stroke={palette.trunkHi}
        strokeWidth={0.8}
        opacity={0.7}
      />

      {/* branches (only when grown enough) */}
      {s > 0.45 && (
        <g stroke={palette.trunk} strokeWidth={1.2} strokeLinecap="round" opacity={0.85}>
          <path d={`M 0,${-trunkH * 0.55} Q ${-crownR * 0.4},${-trunkH * 0.7} ${-crownR * 0.6},${-trunkH * 0.85}`} fill="none" />
          <path d={`M 0,${-trunkH * 0.7} Q ${crownR * 0.4},${-trunkH * 0.8} ${crownR * 0.55},${-trunkH * 0.95}`} fill="none" />
        </g>
      )}

      {/* foliage — layered organic clusters */}
      <g style={{ transition: "all 800ms ease" }} transform={`translate(${tilt * 0.5}, 0)`}>
        {/* shadow base */}
        <ellipse cx={crownR * 0.15} cy={crownCy + crownR * 0.45} rx={crownR * 1.05} ry={crownR * 0.78} fill={palette.lo} />
        {/* mid body */}
        <ellipse cx={-crownR * 0.35} cy={crownCy + 2} rx={crownR * 0.78} ry={crownR * 0.7} fill={palette.mid} />
        <ellipse cx={crownR * 0.4} cy={crownCy + 4} rx={crownR * 0.82} ry={crownR * 0.72} fill={palette.mid} />
        <ellipse cx={0} cy={crownCy - crownR * 0.25} rx={crownR * 0.85} ry={crownR * 0.75} fill={palette.mid} />
        {/* highlight clusters */}
        <ellipse cx={-crownR * 0.45} cy={crownCy - crownR * 0.15} rx={crownR * 0.42} ry={crownR * 0.38} fill={palette.hi} opacity={0.85} />
        <ellipse cx={crownR * 0.25} cy={crownCy - crownR * 0.35} rx={crownR * 0.35} ry={crownR * 0.32} fill={palette.hi} opacity={0.9} />
        {/* tiny seedling leaves for very young stage */}
        {s < 0.25 && (
          <>
            <ellipse cx={-2} cy={-trunkH - 2} rx={3} ry={2} fill={palette.hi} />
            <ellipse cx={2} cy={-trunkH - 4} rx={3} ry={2} fill={palette.mid} />
          </>
        )}
      </g>
    </g>
  );
}

function Forest() {
  // Layered, lush forest once max trees are exceeded.
  // Back row = smaller / hazier, front row = full trees.
  const back = Array.from({ length: 12 }, (_, i) => i);
  const front = Array.from({ length: 9 }, (_, i) => i);
  return (
    <g>
      {/* hazy back row */}
      <g opacity={0.55}>
        {back.map((i) => {
          const x = 25 + i * 70 + ((i * 17) % 23);
          const scale = 0.55 + ((i * 13) % 7) * 0.04;
          const palette = TREE_PALETTES[(i + 2) % TREE_PALETTES.length];
          return (
            <g key={`b-${i}`} transform={`translate(${x}, 8) scale(${scale})`}>
              <Tree stage={0.85} x={0} palette={palette} variant={i} />
            </g>
          );
        })}
      </g>
      {/* front row */}
      {front.map((i) => {
        const x = 50 + i * 95 + ((i * 11) % 19);
        const scale = 0.85 + ((i * 17) % 5) * 0.06;
        const palette = TREE_PALETTES[i % TREE_PALETTES.length];
        return (
          <g key={`f-${i}`} transform={`translate(${x}, 0) scale(${scale})`}>
            <Tree stage={1} x={0} palette={palette} variant={i + 1} />
          </g>
        );
      })}
    </g>
  );
}

export function TreeField({ score, cfg }: Props) {
  const { scorePerTree, maxTrees, startingTree } = cfg.trees;
  const totalTreeProgress = Math.max(0, startingTree + score / scorePerTree);
  const fullTrees = Math.min(maxTrees, Math.floor(totalTreeProgress));
  const partial = Math.min(1, Math.max(0, totalTreeProgress - fullTrees));
  const overflow = totalTreeProgress > maxTrees;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(900);
  const height = 240;
  const groundY = height - 38;
  const baseSceneWidth = 900;
  const sceneScale = Math.min(1, width / baseSceneWidth);
  const sceneOffsetX = (width - baseSceneWidth * sceneScale) / 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateWidth = (next: number) => {
      setWidth(Math.max(320, Math.round(next)));
    };

    updateWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateWidth(entry.contentRect.width);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // place up to maxTrees + 1 (the growing one)
  const slots = Math.min(maxTrees, fullTrees + (partial > 0 && fullTrees < maxTrees ? 1 : 0));
  const positions = Array.from({ length: Math.max(1, slots) }, (_, i) => {
    const spacing = (baseSceneWidth - 80) / Math.max(1, maxTrees - 1);
    return 40 + i * spacing;
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md border"
      style={{
        borderColor: "var(--border)",
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-[240px] w-full">
        <defs>
          {/* sky */}
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#cfe9f5" />
            <stop offset="55%" stopColor="#eaf6ee" />
            <stop offset="100%" stopColor="#f6fbf3" />
          </linearGradient>
          {/* far hill */}
          <linearGradient id="hillFar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#bcd6b3" />
            <stop offset="100%" stopColor="#9cc096" />
          </linearGradient>
          {/* mid hill */}
          <linearGradient id="hillMid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a3c995" />
            <stop offset="100%" stopColor="#7eb076" />
          </linearGradient>
          {/* grass */}
          <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#86b97a" />
            <stop offset="100%" stopColor="#5d9456" />
          </linearGradient>
          {/* sun glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3cf" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#fde6a1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fde6a1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sky */}
        <rect x={0} y={0} width={width} height={groundY} fill="url(#sky)" />

        {/* clouds */}
        <g fill="#ffffff" opacity={0.7}>
          <ellipse cx={width * 0.18} cy={48} rx={34} ry={8} />
          <ellipse cx={width * 0.22} cy={44} rx={22} ry={7} />
          <ellipse cx={width * 0.62} cy={32} rx={28} ry={7} />
          <ellipse cx={width * 0.66} cy={36} rx={18} ry={5} />
        </g>

        {/* sun + glow */}
        <circle cx={width - 90} cy={60} r={70} fill="url(#sunGlow)" />
        <circle cx={width - 90} cy={60} r={20} fill="#fde7a6" />
        <circle cx={width - 90} cy={60} r={14} fill="#fbd674" />

        {/* far hills */}
        <path
          d={`M 0,${groundY - 18} Q ${width * 0.2},${groundY - 60} ${width * 0.45},${groundY - 28} T ${width},${groundY - 22} L ${width},${groundY} L 0,${groundY} Z`}
          fill="url(#hillFar)"
          opacity={0.85}
        />
        {/* mid hills */}
        <path
          d={`M 0,${groundY - 6} Q ${width * 0.3},${groundY - 38} ${width * 0.6},${groundY - 14} T ${width},${groundY - 8} L ${width},${groundY} L 0,${groundY} Z`}
          fill="url(#hillMid)"
        />
        {/* distant tree silhouettes on the hills */}
        <g fill="#6fa069" opacity={0.55}>
          {Array.from({ length: 14 }, (_, i) => {
            const x = 20 + i * (width - 40) / 13;
            const y = groundY - 14 - ((i * 7) % 6);
            const r = 4 + ((i * 5) % 4);
            return <circle key={i} cx={x} cy={y} r={r} />;
          })}
        </g>

        {/* grass foreground */}
        <rect x={0} y={groundY} width={width} height={height - groundY} fill="url(#grass)" />
        {/* grass tufts */}
        <g stroke="#3f7a48" strokeWidth={1} strokeLinecap="round" opacity={0.55}>
          {Array.from({ length: Math.floor(width / 22) }, (_, i) => {
            const x = 8 + i * 22 + ((i * 11) % 9);
            const y = groundY + 4 + ((i * 7) % 6);
            const h = 4 + ((i * 3) % 4);
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x - 2} y2={y - h} />
                <line x1={x} y1={y} x2={x + 2} y2={y - h - 1} />
                <line x1={x} y1={y} x2={x} y2={y - h - 2} />
              </g>
            );
          })}
        </g>

        <g transform={`translate(${sceneOffsetX}, ${groundY})`}>
          <g transform={`scale(${sceneScale})`}>
            {overflow ? (
              <Forest />
            ) : (
              positions.map((x, i) => {
                const stage = i < fullTrees ? 1 : partial;
                const palette = TREE_PALETTES[i % TREE_PALETTES.length];
                return <Tree key={i} stage={stage} x={x} palette={palette} variant={i} />;
              })
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
