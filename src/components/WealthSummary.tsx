import { WealthRecord, DisplayCurrency, ExchangeRates } from '../lib/types';
import { convertAmount } from '../lib/currency';
import styles from './WealthSummary.module.css';

interface Props {
  latestRecord: WealthRecord;
  previousRecord: WealthRecord | null;
  yearAgoRecord: WealthRecord | null;
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
}

function totalWealth(record: WealthRecord, currency: DisplayCurrency, rates: ExchangeRates): number {
  return (record.record_items ?? []).reduce((sum, item) => {
    return sum + convertAmount(item.amount, item.currency, currency, rates);
  }, 0);
}

function formatDiff(diff: number, currency: DisplayCurrency) {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatPct(pct: number) {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export default function WealthSummary({ latestRecord, previousRecord, yearAgoRecord, displayCurrency, rates }: Props) {
  const current = totalWealth(latestRecord, displayCurrency, rates);
  const prevTotal = previousRecord ? totalWealth(previousRecord, displayCurrency, rates) : null;
  const yearAgoTotal = yearAgoRecord ? totalWealth(yearAgoRecord, displayCurrency, rates) : null;

  const prevDiff = prevTotal !== null ? current - prevTotal : null;
  const prevPct = prevTotal !== null && prevTotal !== 0 ? ((current - prevTotal) / prevTotal) * 100 : null;

  const yearDiff = yearAgoTotal !== null ? current - yearAgoTotal : null;
  const yearPct = yearAgoTotal !== null && yearAgoTotal !== 0 ? ((current - yearAgoTotal) / yearAgoTotal) * 100 : null;

  return (
    <div className={styles.summary}>
      <div className={styles.total}>
        <div className={styles.totalLabel}>Total Wealth</div>
        <div className={styles.totalValue}>
          {displayCurrency} {current.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={styles.totalDate}>as of {latestRecord.date}</div>
      </div>

      <div className={styles.diffs}>
        {prevDiff !== null && prevPct !== null && (
          <div className={styles.diffCard}>
            <div className={styles.diffLabel}>vs Previous Record</div>
            <div className={`${styles.diffValue} ${prevDiff >= 0 ? styles.positive : styles.negative}`}>
              {formatDiff(prevDiff, displayCurrency)}
            </div>
            <div className={`${styles.diffPct} ${prevPct >= 0 ? styles.positive : styles.negative}`}>
              {formatPct(prevPct)}
            </div>
            {previousRecord && <div className={styles.diffDate}>{previousRecord.date}</div>}
          </div>
        )}

        {yearDiff !== null && yearPct !== null && (
          <div className={styles.diffCard}>
            <div className={styles.diffLabel}>vs 1 Year Ago</div>
            <div className={`${styles.diffValue} ${yearDiff >= 0 ? styles.positive : styles.negative}`}>
              {formatDiff(yearDiff, displayCurrency)}
            </div>
            <div className={`${styles.diffPct} ${yearPct >= 0 ? styles.positive : styles.negative}`}>
              {formatPct(yearPct)}
            </div>
            {yearAgoRecord && <div className={styles.diffDate}>{yearAgoRecord.date}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
