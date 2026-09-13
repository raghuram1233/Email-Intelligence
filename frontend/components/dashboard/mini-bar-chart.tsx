"use client";

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  data: BarDatum[];
  height?: number;
}

export function MiniBarChart({ data, height = 160 }: MiniBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted">No data yet</div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ height }} className="flex items-end gap-3 px-1">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg transition-all"
              style={{
                height: `${Math.max((d.value / max) * 100, 3)}%`,
                backgroundColor: d.color ?? "#6366F1",
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <div className="text-center text-[11px] text-muted">{d.label}</div>
          <div className="text-xs font-medium tabular-nums text-foreground">{d.value}</div>
        </div>
      ))}
    </div>
  );
}
