import { AppConfig } from "@/config/appConfig";

type Props = { score: number; cfg: AppConfig };

function Tree({ stage, x }: { stage: number; x: number }) {
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
        fill="#6b4a2b"
      />
      <circle
        cx={0}
        cy={crownCy}
        r={crownR}
        fill="var(--eco-primary)"
        style={{ transition: "all 800ms ease" }}
      />
      <circle
        cx={-crownR * 0.5}
        cy={crownCy + 4}
        r={crownR * 0.7}
        fill="var(--eco-primary)"
        opacity={0.85}
      />
      <circle
        cx={crownR * 0.5}
        cy={crownCy + 4}
        r={crownR * 0.7}
        fill="var(--eco-primary)"
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
        return (
          <g key={i} transform={`translate(${x}, 0) scale(${scale})`}>
            <rect x={-3} y={-45} width={6} height={45} fill="#5a3a22" />
            <circle cx={0} cy={-58} r={22} fill="var(--eco-primary)" />
            <circle cx={-10} cy={-50} r={16} fill="var(--eco-primary)" opacity={0.85} />
            <circle cx={10} cy={-50} r={16} fill="var(--eco-primary)" opacity={0.85} />
          </g>
        );
      })}
    </g>
  );
}

export function TreeField({ score, cfg }: Props) {
  const { scorePerTree, maxTrees } = cfg.trees;
  const totalUnits = score / scorePerTree;
  const fullTrees = Math.min(maxTrees, Math.floor(totalUnits));
  const partial = Math.min(1, Math.max(0, totalUnits - fullTrees));
  const overflow = totalUnits > maxTrees;

  const width = 900;
  const height = 220;
  const groundY = height - 24;

  // place up to maxTrees + 1 (the growing one)
  const slots = Math.min(maxTrees, fullTrees + (partial > 0 && fullTrees < maxTrees ? 1 : 0));
  const positions = Array.from({ length: Math.max(1, slots) }, (_, i) => {
    const spacing = (width - 80) / Math.max(1, maxTrees - 1);
    return 40 + i * spacing;
  });

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "var(--eco-surface)",
        backgroundImage:
          "radial-gradient(ellipse at 50% 120%, color-mix(in oklab, var(--eco-primary) 18%, transparent), transparent 60%)",
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full">
        {/* sky shimmer */}
        <defs>
          <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--eco-primary)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--eco-primary)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {/* sun */}
        <circle cx={width - 80} cy={50} r={26} fill="var(--eco-warning)" opacity={0.25} />
        <circle cx={width - 80} cy={50} r={14} fill="var(--eco-warning)" opacity={0.55} />

        {/* ground */}
        <rect x={0} y={groundY} width={width} height={height - groundY} fill="url(#ground)" />
        <line
          x1={0}
          y1={groundY}
          x2={width}
          y2={groundY}
          stroke="var(--eco-primary)"
          strokeOpacity={0.5}
          strokeWidth={1}
        />

        <g transform={`translate(0, ${groundY})`}>
          {overflow ? (
            <Forest />
          ) : (
            positions.map((x, i) => {
              const stage = i < fullTrees ? 1 : partial;
              return <Tree key={i} stage={stage} x={x} />;
            })
          )}
        </g>
      </svg>
    </div>
  );
}
