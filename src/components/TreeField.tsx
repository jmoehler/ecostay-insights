import { AppConfig } from "@/config/appConfig";
import { useEffect, useRef, useState } from "react";

type Props = { score: number; cfg: AppConfig };

const TREE_PALETTES = [
  { main: "#87c57d", left: "#6fb168", right: "#5b9d57" },
  { main: "#7bbb73", left: "#63a966", right: "#4f9354" },
  { main: "#6fb069", left: "#589f5d", right: "#468a4c" },
  { main: "#64a663", left: "#4f9557", right: "#3e7f48" },
];

function Tree({
  stage,
  x,
  palette,
}: {
  stage: number;
  x: number;
  palette: (typeof TREE_PALETTES)[number];
}) {
  // stage 0..1 (seedling -> full)
  const s = Math.max(0.05, Math.min(1, stage));
  const trunkH = 8 + s * 42;
  const crownR = 6 + s * 28;
  const crownCy = -trunkH - crownR * 0.6;
  return (
    <g transform={`translate(${x}, 0)`} style={{ transition: "all 800ms ease" }}>
      <rect
        x={-2}
        y={-trunkH}
        width={4}
        height={trunkH}
        rx={1.5}
        fill="#7a5638"
      />
      <circle
        cx={0}
        cy={crownCy}
        r={crownR}
        fill={palette.main}
        style={{ transition: "all 800ms ease" }}
      />
      <circle
        cx={-crownR * 0.5}
        cy={crownCy + 4}
        r={crownR * 0.7}
        fill={palette.left}
        opacity={0.85}
      />
      <circle
        cx={crownR * 0.5}
        cy={crownCy + 4}
        r={crownR * 0.7}
        fill={palette.right}
        opacity={0.85}
      />
    </g>
  );
}

function Forest() {
  // Static "forest" SVG once max trees are exceeded
  const trees = Array.from({ length: 18 }, (_, i) => i);
  return (
    <g>
      {trees.map((i) => {
        const x = 30 + i * 45 + (i % 2) * 12;
        const scale = 0.7 + ((i * 13) % 7) * 0.05;
        const palette = TREE_PALETTES[i % TREE_PALETTES.length];
        return (
          <g key={i} transform={`translate(${x}, 0) scale(${scale})`}>
            <rect x={-3} y={-45} width={6} height={45} fill="#724d30" />
            <circle cx={0} cy={-58} r={22} fill={palette.main} />
            <circle cx={-10} cy={-50} r={16} fill={palette.left} opacity={0.85} />
            <circle cx={10} cy={-50} r={16} fill={palette.right} opacity={0.85} />
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
  const height = 220;
  const groundY = height - 24;
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
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
        backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f8fbf7 70%, #eef5ee 100%)",
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full">
        <defs>
          <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9ed29d" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#6ea66c" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <circle cx={width - 80} cy={50} r={26} fill="#f4c96c" opacity={0.2} />
        <circle cx={width - 80} cy={50} r={14} fill="#f4c96c" opacity={0.45} />

        <rect x={0} y={groundY} width={width} height={height - groundY} fill="url(#ground)" />
        <line
          x1={0}
          y1={groundY}
          x2={width}
          y2={groundY}
          stroke="#5e9556"
          strokeOpacity={0.45}
          strokeWidth={1}
        />

        <g transform={`translate(${sceneOffsetX}, ${groundY})`}>
          <g transform={`scale(${sceneScale})`}>
            {overflow ? (
              <Forest />
            ) : (
              positions.map((x, i) => {
                const stage = i < fullTrees ? 1 : partial;
                const palette = TREE_PALETTES[i % TREE_PALETTES.length];
                return <Tree key={i} stage={stage} x={x} palette={palette} />;
              })
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
