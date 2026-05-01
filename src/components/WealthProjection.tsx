import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RecordItem, DisplayCurrency, ExchangeRates } from '../lib/types';
import { convertAmount } from '../lib/currency';
import { formatLabel } from '../lib/labels';
import styles from './WealthProjection.module.css';

type ViewMode = 'total' | 'category' | 'place' | 'place_type';

interface Props {
  items: RecordItem[];
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
}

const GROUP_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#6366f1',
];

// ─── Projection builders ──────────────────────────────────────────────────────

interface TotalPoint {
  year: number;
  wealth: number;
}

function buildTotalProjection(
  items: RecordItem[],
  displayCurrency: DisplayCurrency,
  rates: ExchangeRates,
): TotalPoint[] {
  const currentYear = new Date().getFullYear();
  const points: TotalPoint[] = [];
  for (let t = 0; t <= 30; t++) {
    let total = 0;
    for (const item of items) {
      const base = convertAmount(item.amount, item.currency, displayCurrency, rates);
      const yieldRate = (item.expected_annual_yield ?? 0) / 100;
      total += base * Math.pow(1 + yieldRate, t);
    }
    points.push({ year: currentYear + t, wealth: Math.round(total) });
  }
  return points;
}

type GroupedPoint = Record<string, number> & { year: number };

function buildGroupedProjection(
  items: RecordItem[],
  groupBy: 'category' | 'place' | 'place_type',
  displayCurrency: DisplayCurrency,
  rates: ExchangeRates,
): { data: GroupedPoint[]; keys: string[] } {
  const currentYear = new Date().getFullYear();
  const allKeys = Array.from(new Set(items.map(item => item[groupBy] as string))).sort();

  const data: GroupedPoint[] = [];
  for (let t = 0; t <= 30; t++) {
    const point: GroupedPoint = { year: currentYear + t };
    for (const key of allKeys) {
      const groupItems = items.filter(item => (item[groupBy] as string) === key);
      let total = 0;
      for (const item of groupItems) {
        const base = convertAmount(item.amount, item.currency, displayCurrency, rates);
        const yieldRate = (item.expected_annual_yield ?? 0) / 100;
        total += base * Math.pow(1 + yieldRate, t);
      }
      point[key] = Math.round(total);
    }
    data.push(point);
  }

  return { data, keys: allKeys };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatWealth(value: number, currency: string): string {
  if (value >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${currency} ${(value / 1_000).toFixed(1)}K`;
  return `${currency} ${value.toLocaleString('en')}`;
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

interface TotalTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
  displayCurrency: DisplayCurrency;
}

function TotalTooltip({ active, payload, label, displayCurrency }: TotalTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipYear}>Year {label}</div>
      <div className={styles.tooltipWealth}>
        {displayCurrency} {payload[0].value.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

interface GroupedTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  displayCurrency: DisplayCurrency;
}

function GroupedTooltip({ active, payload, label, displayCurrency }: GroupedTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipYear}>Year {label}</div>
      {payload.map(entry => (
        <div key={entry.name} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span className={styles.tooltipLabel}>{formatLabel(entry.name)}</span>
          <span className={styles.tooltipValue}>
            {displayCurrency} {entry.value.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { id: ViewMode; label: string }[] = [
  { id: 'total', label: 'Total' },
  { id: 'category', label: 'By Category' },
  { id: 'place', label: 'By Place' },
  { id: 'place_type', label: 'By Place Type' },
];

export default function WealthProjection({ items, displayCurrency, rates }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  if (viewMode === 'total') {
    const data = buildTotalProjection(items, displayCurrency, rates);
    const maxWealth = Math.max(...data.map(d => d.wealth));

    return (
      <div className={styles.wrapper}>
        <Header viewMode={viewMode} onChangeMode={setViewMode} />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickLine={false} />
            <YAxis
              tickFormatter={v => formatWealth(v, displayCurrency)}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              width={80}
              domain={[0, Math.ceil(maxWealth * 1.1)]}
            />
            <Tooltip content={<TotalTooltip displayCurrency={displayCurrency} />} />
            <Line
              type="monotone"
              dataKey="wealth"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const { data, keys } = buildGroupedProjection(items, viewMode, displayCurrency, rates);
  const maxWealth = Math.max(...data.flatMap(d => keys.map(k => (d[k] as number) ?? 0)));

  return (
    <div className={styles.wrapper}>
      <Header viewMode={viewMode} onChangeMode={setViewMode} />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickLine={false} />
          <YAxis
            tickFormatter={v => formatWealth(v, displayCurrency)}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={80}
            domain={[0, Math.ceil(maxWealth * 1.1)]}
          />
          <Tooltip content={<GroupedTooltip displayCurrency={displayCurrency} />} />
          <Legend formatter={value => formatLabel(value)} wrapperStyle={{ fontSize: 12 }} />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={GROUP_COLORS[i % GROUP_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Shared header ────────────────────────────────────────────────────────────

function Header({
  viewMode,
  onChangeMode,
}: {
  viewMode: ViewMode;
  onChangeMode: (m: ViewMode) => void;
}) {
  return (
    <>
      <h2 className={styles.title}>Projected Wealth — 30 Years</h2>
      <p className={styles.subtitle}>
        Based on current holdings with each asset compounding at its expected annual yield.
      </p>
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab}${viewMode === tab.id ? ` ${styles.tabActive}` : ''}`}
            onClick={() => onChangeMode(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
