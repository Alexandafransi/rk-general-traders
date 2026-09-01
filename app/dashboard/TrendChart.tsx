"use client";

export type TrendPoint = {
  month: string;
  sales: string;
  purchases: string;
  expenses: string;
  payroll: string;
  profit: string;
};

export const TREND_SERIES: { key: "sales" | "purchases" | "expenses"; labelKey: string; color: string }[] = [
  { key: "sales", labelKey: "dashboard.series.sales", color: "var(--success)" },
  { key: "purchases", labelKey: "dashboard.series.purchases", color: "var(--chart-1)" },
  { key: "expenses", labelKey: "dashboard.series.expenses", color: "var(--destructive)" },
];

function tzsShort(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function monthLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export default function TrendChart({ series }: { series: TrendPoint[] }) {
  const width = 720;
  const height = 220;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 8;
  const padRight = 8;
  const plotH = height - padTop - padBottom;

  const values = series.flatMap((s) => TREND_SERIES.map((cfg) => parseFloat(s[cfg.key])));
  const maxValue = Math.max(...values, 1);

  const groupW = (width - padLeft - padRight) / series.length;
  const barW = Math.min(14, groupW * 0.16);
  const gap = 4;
  const clusterW = TREND_SERIES.length * barW + (TREND_SERIES.length - 1) * gap;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Sales vs purchases vs expenses by month">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padLeft}
          x2={width - padRight}
          y1={padTop + plotH * (1 - f)}
          y2={padTop + plotH * (1 - f)}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {series.map((s) => {
        const cx = padLeft + groupW * series.indexOf(s) + groupW / 2;
        const x0 = cx - clusterW / 2;
        const heights = TREND_SERIES.map((cfg) => (parseFloat(s[cfg.key]) / maxValue) * plotH);
        const profit = parseFloat(s.profit);
        return (
          <g key={s.month}>
            {TREND_SERIES.map((cfg, j) => {
              const val = parseFloat(s[cfg.key]);
              const h = heights[j];
              return (
                <rect
                  key={cfg.key}
                  x={x0 + j * (barW + gap)}
                  y={padTop + plotH - h}
                  width={barW}
                  height={Math.max(h, val > 0 ? 2 : 0)}
                  rx={2}
                  fill={cfg.color}
                />
              );
            })}
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
              {monthLabel(s.month)}
            </text>
            <text
              x={cx}
              y={padTop + plotH - Math.max(...heights) - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight={700}
              fill={profit >= 0 ? "var(--success)" : "var(--destructive)"}
            >
              {profit >= 0 ? "+" : "-"}{tzsShort(Math.abs(profit))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
