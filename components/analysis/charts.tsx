"use client";

import { useI18n } from "@/lib/i18n";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TissueComposition, CellType, SurvivalPoint } from "@/lib/mock-data";

const TISSUE_COLORS: Record<keyof TissueComposition, string> = {
  tumor: "var(--danger)",
  stroma: "var(--teal)",
  necrosis: "var(--necrosis)",
  normal: "var(--success)",
};

const TISSUE_LABELS: Record<keyof TissueComposition, string> = {
  tumor: "Tumor",
  stroma: "Stroma",
  necrosis: "Necrosis",
  normal: "Normal",
};

export function TissueDonut({ data }: { data: TissueComposition }) {
  const { t } = useI18n();
  const entries = (Object.keys(data) as (keyof TissueComposition)[]).map((k) => ({
    key: k,
    name: t(TISSUE_LABELS[k]),
    value: data[k],
    color: TISSUE_COLORS[k],
  }));
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              stroke="none"
            >
              {entries.map((e) => (
                <Cell key={e.key} fill={e.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular">{data.tumor}%</span>
          <span className="text-[10px] text-muted">{t("tumor")}</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {entries.map((e) => (
          <div key={e.key} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />
            <span className="flex-1 text-muted">{e.name}</span>
            <span className="font-medium tabular">{e.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CellBars({ data }: { data: CellType[] }) {
  const { t, locale } = useI18n();
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map((c) => (
        <div key={t(c.name)} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted">{t(c.name)}</span>
            <span className="font-medium tabular">{c.count.toLocaleString(locale)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(c.count / max) * 100}%`, background: c.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SurvivalCurve({ data }: { data: SurvivalPoint[]; median: number }) {
  const { t } = useI18n();
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="surv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            unit={t("m")}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.5, 1]}
            tickFormatter={(v) => `${v * 100}%`}
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
            formatter={(v) => [`${Math.round(Number(v) * 100)}%`, t("Survival")]}
            labelFormatter={(l) => `${t("Month")} ${l}`}
          />
          <Area
            type="monotone"
            dataKey="survival"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#surv)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
