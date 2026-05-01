import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RecordItem, DisplayCurrency, ExchangeRates } from '../lib/types';
import { convertAmount } from '../lib/currency';
import { formatLabel } from '../lib/labels';

type GroupBy = 'category' | 'place_type' | 'place' | 'currency' | 'risk_level';

interface Props {
  items: RecordItem[];
  groupBy: GroupBy;
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
  colorMap?: Record<string, string>;
  height?: number;
}

const DEFAULT_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#6366f1',
];

export default function BreakdownChart({
  items,
  groupBy,
  displayCurrency,
  rates,
  colorMap = {},
  height = 280,
}: Props) {
  const grouped: Record<string, number> = {};
  for (const item of items) {
    const key = item[groupBy] as string;
    const amount = convertAmount(item.amount, item.currency, displayCurrency, rates);
    grouped[key] = (grouped[key] ?? 0) + amount;
  }

  const data = Object.entries(grouped)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No data</div>;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={colorMap[entry.name] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const num = typeof value === 'number' ? value : 0;
            const pct = total > 0 ? ((num / total) * 100).toFixed(1) : '0';
            return [
              `${displayCurrency} ${num.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`,
              formatLabel(name as string),
            ];
          }}
        />
        <Legend
          formatter={(value) => formatLabel(value)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
