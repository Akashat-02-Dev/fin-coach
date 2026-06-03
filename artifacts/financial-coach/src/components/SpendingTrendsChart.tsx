import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import type { AnalysisSummary } from "@workspace/api-client-react";

interface Props {
  history: AnalysisSummary[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card shadow-md p-3 text-sm space-y-1.5 min-w-[180px]">
      <p className="font-semibold text-foreground pb-1 border-b border-border">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-mono font-medium text-foreground">
            {entry.dataKey === "savingsRate"
              ? fmtPct(entry.value)
              : entry.dataKey === "totalDebt"
              ? fmt(entry.value)
              : fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SpendingTrendsChart({ history }: Props) {
  const sorted = [...history]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((item) => ({
      date: format(new Date(item.createdAt), "MMM d"),
      fullDate: format(new Date(item.createdAt), "MMM d, yyyy"),
      monthlyIncome: item.monthlyIncome,
      totalExpenses: item.totalExpenses,
      savingsRate: item.savingsRate ?? 0,
      totalDebt: item.totalDebt ?? null,
      id: item.id,
    }));

  const hasDebt = sorted.some((d) => d.totalDebt !== null && d.totalDebt > 0);
  const isSingle = sorted.length === 1;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={sorted} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(200 45% 30%)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="hsl(200 45% 30%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(180 30% 60%)" stopOpacity={0.22} />
            <stop offset="95%" stopColor="hsl(180 30% 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />

        <XAxis
          dataKey={isSingle ? "fullDate" : "date"}
          tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />

        {/* Left Y-axis: money */}
        <YAxis
          yAxisId="money"
          orientation="left"
          tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={44}
        />

        {/* Right Y-axis: savings rate % */}
        <YAxis
          yAxisId="rate"
          orientation="right"
          tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          width={36}
          domain={["auto", "auto"]}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(214 32% 85%)", strokeWidth: 1 }} />

        <Legend
          iconType="square"
          iconSize={10}
          formatter={(value) => (
            <span style={{ color: "hsl(215 16% 47%)", fontSize: 12 }}>{value}</span>
          )}
        />

        {/* Zero reference line for savings rate */}
        <ReferenceLine yAxisId="rate" y={0} stroke="hsl(0 84% 60%)" strokeDasharray="4 3" strokeWidth={1} />

        <Area
          yAxisId="money"
          type="monotone"
          dataKey="monthlyIncome"
          name="Income"
          stroke="hsl(200 45% 30%)"
          strokeWidth={2}
          fill="url(#incomeGrad)"
          dot={{ fill: "hsl(200 45% 30%)", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />

        <Area
          yAxisId="money"
          type="monotone"
          dataKey="totalExpenses"
          name="Expenses"
          stroke="hsl(180 30% 50%)"
          strokeWidth={2}
          fill="url(#expensesGrad)"
          dot={{ fill: "hsl(180 30% 50%)", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />

        {hasDebt && (
          <Line
            yAxisId="money"
            type="monotone"
            dataKey="totalDebt"
            name="Total Debt"
            stroke="hsl(0 60% 60%)"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ fill: "hsl(0 60% 60%)", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        )}

        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="savingsRate"
          name="Savings Rate"
          stroke="hsl(142 60% 45%)"
          strokeWidth={2}
          dot={{ fill: "hsl(142 60% 45%)", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
