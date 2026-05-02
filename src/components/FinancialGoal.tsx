import { useState, useEffect, useMemo } from 'react';
import { RecordItem, DisplayCurrency, ExchangeRates } from '../lib/types';
import { convertAmount } from '../lib/currency';
import styles from './FinancialGoal.module.css';

interface Props {
  items: RecordItem[];
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
}

type GoalMode = 'target_wealth' | 'financial_freedom';

interface GoalState {
  mode: GoalMode;
  targetAmount: string;
  targetYears: string;
  yearlyExpense: string;
}

const STORAGE_KEY = 'wm_financial_goal';
const INFLATION_RATE = 0.025; // 2.5% conservative estimate

function loadGoal(): GoalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode ?? 'target_wealth',
        targetAmount: parsed.targetAmount ?? '',
        targetYears: parsed.targetYears ?? '10',
        yearlyExpense: parsed.yearlyExpense ?? '',
      };
    }
  } catch {
    // ignore
  }
  return { mode: 'target_wealth', targetAmount: '', targetYears: '10', yearlyExpense: '' };
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

// ─── Target-wealth analysis ───────────────────────────────────────────────────

interface Analysis {
  w0: number;
  weightedYield: number;
  yearsToGoal: number | null;
  requiredYield: number | null;
  extraMonthlySavings: number | null;
  doublingTime: number | null;
  onTrack: boolean;
  buffer: number | null;
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

  let requiredYield: number | null = null;
  if (w0 > 0 && targetYears > 0 && targetAmount > w0) {
    requiredYield = Math.pow(targetAmount / w0, 1 / targetYears) - 1;
  } else if (targetAmount <= w0) {
    requiredYield = 0;
  }

  let extraMonthlySavings: number | null = null;
  const rYear = weightedYield;
  if (targetYears > 0 && w0 > 0) {
    const growth = Math.pow(1 + rYear, targetYears);
    const wealthAtEnd = w0 * growth;
    if (wealthAtEnd < targetAmount) {
      const shortfall = targetAmount - wealthAtEnd;
      if (rYear > 0) {
        const annuityFactor = (growth - 1) / rYear;
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

// ─── Financial-freedom analysis ───────────────────────────────────────────────

interface FreedomAnalysis {
  w0: number;
  weightedYield: number;
  yearsUntilFreedom: number | null;
  freedomCalendarYear: number | null;
  wealthAtFreedom: number | null;
  passiveIncomeAtFreedom: number | null;
  expenseAtFreedom: number | null;
}

function computeFinancialFreedom(
  items: RecordItem[],
  displayCurrency: DisplayCurrency,
  rates: ExchangeRates,
  yearlyExpense: number
): FreedomAnalysis {
  let w0 = 0;
  let yieldWeightedSum = 0;
  for (const item of items) {
    const base = convertAmount(item.amount, item.currency, displayCurrency, rates);
    const y = (item.expected_annual_yield ?? 0) / 100;
    w0 += base;
    yieldWeightedSum += base * y;
  }

  const weightedYield = w0 > 0 ? yieldWeightedSum / w0 : 0;

  if (weightedYield <= 0) {
    return { w0, weightedYield, yearsUntilFreedom: null, freedomCalendarYear: null, wealthAtFreedom: null, passiveIncomeAtFreedom: null, expenseAtFreedom: null };
  }

  const currentYear = new Date().getFullYear();

  for (let t = 1; t <= 100; t++) {
    // Wealth grows via per-asset compounding
    let wealthT = 0;
    for (const item of items) {
      const base = convertAmount(item.amount, item.currency, displayCurrency, rates);
      const y = (item.expected_annual_yield ?? 0) / 100;
      wealthT += base * Math.pow(1 + y, t);
    }

    const passiveIncome = wealthT * weightedYield;
    const inflatedExpense = yearlyExpense * Math.pow(1 + INFLATION_RATE, t);

    if (passiveIncome >= inflatedExpense) {
      return {
        w0,
        weightedYield,
        yearsUntilFreedom: t,
        freedomCalendarYear: currentYear + t,
        wealthAtFreedom: wealthT,
        passiveIncomeAtFreedom: passiveIncome,
        expenseAtFreedom: inflatedExpense,
      };
    }
  }

  return { w0, weightedYield, yearsUntilFreedom: null, freedomCalendarYear: null, wealthAtFreedom: null, passiveIncomeAtFreedom: null, expenseAtFreedom: null };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinancialGoal({ items, displayCurrency, rates }: Props) {
  const [goal, setGoal] = useState<GoalState>(loadGoal);

  useEffect(() => {
    saveGoal(goal);
  }, [goal]);

  const setMode = (mode: GoalMode) => setGoal(prev => ({ ...prev, mode }));

  // ── Target wealth ──
  const targetAmount = parseFloat(goal.targetAmount.replace(/,/g, '')) || 0;
  const targetYears = parseInt(goal.targetYears, 10) || 0;
  const hasValidTargetGoal = targetAmount > 0 && targetYears > 0;

  const analysis = useMemo<Analysis | null>(() => {
    if (goal.mode !== 'target_wealth' || !hasValidTargetGoal || items.length === 0) return null;
    return computeAnalysis(items, displayCurrency, rates, targetAmount, targetYears);
  }, [goal.mode, items, displayCurrency, rates, targetAmount, targetYears, hasValidTargetGoal]);

  // ── Financial freedom ──
  const yearlyExpense = parseFloat(goal.yearlyExpense.replace(/,/g, '')) || 0;
  const hasValidExpense = yearlyExpense > 0;

  const freedomAnalysis = useMemo<FreedomAnalysis | null>(() => {
    if (goal.mode !== 'financial_freedom' || !hasValidExpense || items.length === 0) return null;
    return computeFinancialFreedom(items, displayCurrency, rates, yearlyExpense);
  }, [goal.mode, items, displayCurrency, rates, yearlyExpense, hasValidExpense]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Financial Goal</h2>
      <p className={styles.subtitle}>
        Choose a goal type and see how your portfolio performs against it.
      </p>

      {/* Mode toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${goal.mode === 'target_wealth' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('target_wealth')}
          type="button"
        >
          Target Total Wealth
        </button>
        <button
          className={`${styles.modeBtn} ${goal.mode === 'financial_freedom' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('financial_freedom')}
          type="button"
        >
          Financial Freedom
        </button>
      </div>

      {/* ── Target Wealth inputs ── */}
      {goal.mode === 'target_wealth' && (
        <>
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

          {!hasValidTargetGoal && (
            <div className={styles.placeholder}>
              Enter a target amount and number of years to see your goal analysis.
            </div>
          )}
        </>
      )}

      {/* ── Financial Freedom inputs & results ── */}
      {goal.mode === 'financial_freedom' && (
        <>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Current Yearly Expense ({displayCurrency})</label>
              <input
                type="number"
                className={styles.input}
                value={goal.yearlyExpense}
                min="0"
                step="1000"
                placeholder="e.g. 60000"
                onChange={e => setGoal(prev => ({ ...prev, yearlyExpense: e.target.value }))}
              />
            </div>
          </div>
          <p className={styles.freedomNote}>
            Assumes <strong>2.5% annual inflation</strong> on your expenses and per-asset compounding on your wealth.
            Financial freedom is reached when your passive income (portfolio × weighted yield) covers your inflation-adjusted expenses.
          </p>

          {freedomAnalysis && (
            <div className={styles.results}>
              {freedomAnalysis.yearsUntilFreedom !== null ? (
                <>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Current Wealth</span>
                      <span className={styles.metricValue}>{formatMoney(freedomAnalysis.w0, displayCurrency)}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Portfolio Yield (weighted avg)</span>
                      <span className={styles.metricValue}>{(freedomAnalysis.weightedYield * 100).toFixed(2)}%</span>
                    </div>
                    <div className={`${styles.metric} ${styles.metricHighlight}`}>
                      <span className={styles.metricLabel}>Years Until Financial Freedom</span>
                      <span className={`${styles.metricValue} ${styles.positive}`}>
                        {freedomAnalysis.yearsUntilFreedom} year{freedomAnalysis.yearsUntilFreedom !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className={`${styles.metric} ${styles.metricHighlight}`}>
                      <span className={styles.metricLabel}>Freedom Year</span>
                      <span className={`${styles.metricValue} ${styles.positive}`}>
                        {freedomAnalysis.freedomCalendarYear}
                      </span>
                    </div>
                    {freedomAnalysis.wealthAtFreedom !== null && (
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Wealth at Freedom</span>
                        <span className={styles.metricValue}>{formatMoney(freedomAnalysis.wealthAtFreedom, displayCurrency)}</span>
                      </div>
                    )}
                    {freedomAnalysis.passiveIncomeAtFreedom !== null && (
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Passive Income at Freedom</span>
                        <span className={`${styles.metricValue} ${styles.positive}`}>{formatMoney(freedomAnalysis.passiveIncomeAtFreedom, displayCurrency)}/yr</span>
                      </div>
                    )}
                    {freedomAnalysis.expenseAtFreedom !== null && (
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Inflation-Adjusted Expense at Freedom</span>
                        <span className={styles.metricValue}>{formatMoney(freedomAnalysis.expenseAtFreedom, displayCurrency)}/yr</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.suggestions}>
                    <h3 className={styles.suggestionsTitle}>Insights</h3>
                    <ul className={styles.suggestionsList}>
                      <li className={styles.suggestionGood}>
                        At your current trajectory you'll achieve financial freedom in {freedomAnalysis.yearsUntilFreedom} year{freedomAnalysis.yearsUntilFreedom !== 1 ? 's' : ''}, in {freedomAnalysis.freedomCalendarYear}.
                      </li>
                      {freedomAnalysis.expenseAtFreedom !== null && freedomAnalysis.passiveIncomeAtFreedom !== null && (
                        <li className={styles.suggestion}>
                          By then, your expenses (with 2.5%/yr inflation) will be {formatMoney(freedomAnalysis.expenseAtFreedom, displayCurrency)}/yr —
                          covered by your passive income of {formatMoney(freedomAnalysis.passiveIncomeAtFreedom, displayCurrency)}/yr.
                        </li>
                      )}
                      {freedomAnalysis.weightedYield > 0 && (
                        <li className={styles.suggestion}>
                          A higher portfolio yield would bring freedom sooner. Consider reallocating into higher-yield assets if risk permits.
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Current Wealth</span>
                      <span className={styles.metricValue}>{formatMoney(freedomAnalysis.w0, displayCurrency)}</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Portfolio Yield (weighted avg)</span>
                      <span className={styles.metricValue}>{(freedomAnalysis.weightedYield * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className={styles.suggestions}>
                    <ul className={styles.suggestionsList}>
                      {freedomAnalysis.weightedYield === 0 ? (
                        <li className={styles.suggestionWarn}>
                          Your portfolio weighted yield is 0%. Set expected annual yields on your assets to get a meaningful projection.
                        </li>
                      ) : (
                        <li className={styles.suggestionWarn}>
                          Financial freedom is not reachable within 100 years at current yields and expenses.
                          Consider increasing your yield allocation or reducing expenses.
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {!hasValidExpense && (
            <div className={styles.placeholder}>
              Enter your current yearly expense to calculate when you'll reach financial freedom.
            </div>
          )}
        </>
      )}
    </div>
  );
}
