import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RecordItem, DisplayCurrency, ExchangeRates } from '../lib/types';
import { convertAmount } from '../lib/currency';
import { CATEGORY_COLORS } from '../lib/constants';

interface Props {
  items: RecordItem[];
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AssetPieChart({ items, displayCurrency, rates }: Props) {
  // Group by category
  const grouped: Record<string, number> = {};
  for (const item of items) {
    const amount = convertAmount(item.amount, item.currency, displayCurrency, rates);
    grouped[item.category] = (grouped[item.category] ?? 0) + amount;
  }

  const data = Object.entries(grouped)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name] ?? COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const num = typeof value === 'number' ? value : 0;
            return `${displayCurrency} ${num.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
