import { useState, useEffect, useMemo } from 'react';
import { RecordItem, DisplayCurrency, ExchangeRates } from '../lib/types';
import { convertAmount } from '../lib/currency';
import styles from './FinancialGoal.module.css';

interface Props {
  items: RecordItem[];
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
}

interface GoalState {
  targetAmount: string;
  targetYears: string;
}

const STORAGE_KEY = 'wm_financial_goal';

function loadGoal(): GoalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { targetAmount: '', targetYears: '10' };
}

function saveGoal(state: GoalState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface Analysis {
  w0: number;
  weightedYield: number; // as decimal, e.g. 0.05 = 5%
  yearsToGoal: number | null; // null = not reachable in 100y
  requiredYield: number | null; // to hit in targetYears
  extraMonthlySavings: number | null;
  doublingTime: number | null;
  onTrack: boolean;
  buffer: number | null; // years ahead if on track
}

function computeAnalysis(
  items: RecordItem[],
  displayCurrency: DisplayCurrency,
  rates: ExchangeRates,
  targetAmount: number,
  targetYears: number
): Analysis {
  let w0 = 0;
  let yieldWeightedSum = 0;
  for (const item of items) {
    const base = convertAmount(item.amount, item.currency, displayCurrency, rates);
    const y = (item.expected_annual_yield ?? 0) / 100;
    w0 += base;
    yieldWeightedSum += base * y;
  }

  const weightedYield = w0 > 0 ? yieldWeightedSum / w0 : 0;
  const doublingTime = weightedYield > 0 ? 72 / (weightedYield * 100) : null;

  // Years to goal using per-asset compounding
  let yearsToGoal: number | null = null;
  for (let t = 1; t <= 100; t++) {
    let total = 0;
    for (const item of items) {
      const base = convertAmount(item.amount, item.currency, displayCurrency, rates);
      const y = (item.expected_annual_yield ?? 0) / 100;
      total += base * Math.pow(1 + y, t);
    }
    if (total >= targetAmount) {
      yearsToGoal = t;
      break;
    }
  }

  // Required yield to hit target in exactly targetYears: r = (target/w0)^(1/n) - 1
  let requiredYield: number | null = null;
  if (w0 > 0 && targetYears > 0 && targetAmount > w0) {
    requiredYield = Math.pow(targetAmount / w0, 1 / targetYears) - 1;
  } else if (targetAmount <= w0) {
    requiredYield = 0; // already at goal
  }

  // Extra monthly savings: target = w0*(1+r)^n + PMT*12*((1+r)^n - 1)/r
  let extraMonthlySavings: number | null = null;
  const rYear = weightedYield;
  if (targetYears > 0 && w0 > 0) {
    const growth = Math.pow(1 + rYear, targetYears);
    const wealthAtEnd = w0 * growth;
    if (wealthAtEnd < targetAmount) {
      const shortfall = targetAmount - wealthAtEnd;
      if (rYear > 0) {
        const annuityFactor = (growth - 1) / rYear;
        // PMT*12*annuityFactor = shortfall  →  PMT = shortfall / (12 * annuityFactor)
        extraMonthlySavings = shortfall / (12 * annuityFactor);
      } else {
        extraMonthlySavings = shortfall / (targetYears * 12);
      }
    } else {
      extraMonthlySavings = 0;
    }
  }

  const onTrack = yearsToGoal !== null && yearsToGoal <= targetYears;
  const buffer = onTrack && yearsToGoal !== null ? targetYears - yearsToGoal : null;

  return { w0, weightedYield, yearsToGoal, requiredYield, extraMonthlySavings, doublingTime, onTrack, buffer };
}

export default function FinancialGoal({ items, displayCurrency, rates }: Props) {
  const [goal, setGoal] = useState<GoalState>(loadGoal);

  useEffect(() => {
    saveGoal(goal);
  }, [goal]);

  const targetAmount = parseFloat(goal.targetAmount.replace(/,/g, '')) || 0;
  const targetYears = parseInt(goal.targetYears, 10) || 0;
  const hasValidGoal = targetAmount > 0 && targetYears > 0;

  const analysis = useMemo<Analysis | null>(() => {
    if (!hasValidGoal || items.length === 0) return null;
    return computeAnalysis(items, displayCurrency, rates, targetAmount, targetYears);
  }, [items, displayCurrency, rates, targetAmount, targetYears, hasValidGoal]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Financial Goal</h2>
      <p className={styles.subtitle}>
        Set a target and see how long it will take based on your current portfolio.
      </p>

      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Target Amount ({displayCurrency})</label>
          <input
            type="number"
            className={styles.input}
            value={goal.targetAmount}
            min="0"
            step="10000"
            placeholder="e.g. 1000000"
            onChange={e => setGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Target Years</label>
          <input
            type="number"
            className={styles.input}
            value={goal.targetYears}
            min="1"
            max="99"
            step="1"
            placeholder="e.g. 10"
            onChange={e => setGoal(prev => ({ ...prev, targetYears: e.target.value }))}
          />
        </div>
      </div>

      {analysis && (
        <div className={styles.results}>
          {/* Key metrics */}
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Current Wealth</span>
              <span className={styles.metricValue}>{formatMoney(analysis.w0, displayCurrency)}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Portfolio Yield (weighted avg)</span>
              <span className={styles.metricValue}>{(analysis.weightedYield * 100).toFixed(2)}%</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Years to Reach Goal</span>
              <span className={`${styles.metricValue} ${analysis.onTrack ? styles.positive : styles.caution}`}>
                {analysis.yearsToGoal !== null
                  ? `${analysis.yearsToGoal} year${analysis.yearsToGoal !== 1 ? 's' : ''}`
                  : 'Not reachable in 100 years'}
              </span>
            </div>
            {analysis.requiredYield !== null && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Required Yield to hit goal in {targetYears}y</span>
                <span className={styles.metricValue}>{(analysis.requiredYield * 100).toFixed(2)}%</span>
              </div>
            )}
            {analysis.extraMonthlySavings !== null && analysis.extraMonthlySavings > 0 && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Extra Monthly Savings Needed</span>
                <span className={styles.metricValue}>{formatMoney(analysis.extraMonthlySavings, displayCurrency)}/mo</span>
              </div>
            )}
            {analysis.doublingTime !== null && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Portfolio Doubling Time (Rule of 72)</span>
                <span className={styles.metricValue}>{analysis.doublingTime.toFixed(1)} years</span>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className={styles.suggestions}>
            <h3 className={styles.suggestionsTitle}>Suggestions</h3>
            <ul className={styles.suggestionsList}>
              {analysis.onTrack && analysis.buffer !== null && (
                <li className={styles.suggestionGood}>
                  You're on track to reach your goal {analysis.buffer} year{analysis.buffer !== 1 ? 's' : ''} early
                  (by year {new Date().getFullYear() + (analysis.yearsToGoal ?? 0)}). Keep it up!
                </li>
              )}
              {!analysis.onTrack && analysis.yearsToGoal !== null && (
                <li className={styles.suggestionWarn}>
                  At current yields, you'll reach your goal in {analysis.yearsToGoal} years — {analysis.yearsToGoal - targetYears} year{Math.abs(analysis.yearsToGoal - targetYears) !== 1 ? 's' : ''} later than targeted.
                </li>
              )}
              {!analysis.onTrack && analysis.requiredYield !== null && analysis.requiredYield > analysis.weightedYield && (
                <li className={styles.suggestionWarn}>
                  Your current weighted yield ({(analysis.weightedYield * 100).toFixed(2)}%) is below the
                  required {(analysis.requiredYield * 100).toFixed(2)}% to hit the goal in {targetYears} years.
                  Consider shifting some allocation toward higher-yield investments (e.g., equities or funds).
                </li>
              )}
              {analysis.extraMonthlySavings !== null && analysis.extraMonthlySavings > 0 && (
                <li className={styles.suggestion}>
                  Alternatively, adding {formatMoney(analysis.extraMonthlySavings, displayCurrency)}/month
                  in savings (invested at the same weighted yield) would get you there on time.
                </li>
              )}
              {analysis.extraMonthlySavings === 0 && (
                <li className={styles.suggestionGood}>
                  No extra savings needed — your existing portfolio growth is sufficient.
                </li>
              )}
              {analysis.yearsToGoal === null && (
                <li className={styles.suggestionWarn}>
                  Your portfolio cannot reach the target in 100 years at current yields.
                  Consider significantly increasing your yield allocation or saving more.
                </li>
              )}
              {analysis.doublingTime !== null && (
                <li className={styles.suggestion}>
                  Your portfolio doubles every ~{analysis.doublingTime.toFixed(1)} years at the current weighted yield.
                </li>
              )}
              {analysis.weightedYield === 0 && (
                <li className={styles.suggestionWarn}>
                  Your portfolio weighted yield is 0%. Set expected annual yields on your assets to get meaningful projections.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {!hasValidGoal && (
        <div className={styles.placeholder}>
          Enter a target amount and number of years to see your goal analysis.
        </div>
      )}
    </div>
  );
}
