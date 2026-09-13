"use client";

interface Point {
  x: string;
  y: number;
}

interface MiniLineChartProps {
  data: Point[];
  color?: string;
  gradientId: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function MiniLineChart({
  data,
  color = "#6366F1",
  gradientId,
  height = 160,
  formatValue,
}: MiniLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted">No data yet</div>
    );
  }

  const width = 100;
  const chartHeight = 40;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : width / 2;
    const y = chartHeight - (d.y / (maxY || 1)) * chartHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${chartHeight} L ${points[0].x.toFixed(
    2
  )} ${chartHeight} Z`;

  return (
    <div style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="none"
        className="h-[calc(100%-1.5rem)] w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{data[0].x}</span>
        <span className="font-medium text-foreground">
          max {formatValue ? formatValue(maxY) : maxY}
        </span>
        <span>{data[data.length - 1].x}</span>
      </div>
    </div>
  );
}
