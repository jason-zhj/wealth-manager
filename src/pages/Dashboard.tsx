import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WealthRecord, DisplayCurrency, ExchangeRates } from '../lib/types';
import { fetchLatestRecords, fetchRecordOneYearAgo } from '../lib/api';
import { getExchangeRates } from '../lib/currency';
import { FALLBACK_RATES, CATEGORY_COLORS, RISK_COLOR } from '../lib/constants';
import CurrencyToggle from '../components/CurrencyToggle';
import WealthSummary from '../components/WealthSummary';
import BreakdownChart from '../components/BreakdownChart';
import WealthProjection from '../components/WealthProjection';
import FinancialGoal from '../components/FinancialGoal';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<WealthRecord[]>([]);
  const [yearAgoRecord, setYearAgoRecord] = useState<WealthRecord | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('SGD');
  const [rates, setRates] = useState<ExchangeRates>({ ...FALLBACK_RATES });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [latestTwo, fetchedRates] = await Promise.all([
          fetchLatestRecords(2),
          getExchangeRates(),
        ]);
        setRecords(latestTwo);
        setRates(fetchedRates);

        if (latestTwo.length > 0) {
          const yearAgo = await fetchRecordOneYearAgo(latestTwo[0].date);
          setYearAgoRecord(yearAgo);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="spinner" />
      </div>
    );
  }

  const latestRecord = records[0] ?? null;
  const previousRecord = records[1] ?? null;
  const items = latestRecord?.record_items ?? [];

  if (!latestRecord) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.empty}>
          <p>No records yet. Add your first record to see your wealth overview.</p>
          <button className={styles.btnAdd} onClick={() => navigate('/records/new')}>
            Add First Record
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <CurrencyToggle value={displayCurrency} onChange={setDisplayCurrency} />
      </div>

      {/* Row 1: Summary + Category breakdown */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <WealthSummary
            latestRecord={latestRecord}
            previousRecord={previousRecord}
            yearAgoRecord={yearAgoRecord}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Asset Breakdown by Category</h2>
          <BreakdownChart
            items={items}
            groupBy="category"
            displayCurrency={displayCurrency}
            rates={rates}
            colorMap={CATEGORY_COLORS}
          />
        </div>

        {/* Row 2: Currency + Risk breakdowns */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Breakdown by Currency</h2>
          <BreakdownChart
            items={items}
            groupBy="currency"
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Breakdown by Risk Level</h2>
          <BreakdownChart
            items={items}
            groupBy="risk_level"
            displayCurrency={displayCurrency}
            rates={rates}
            colorMap={RISK_COLOR}
          />
        </div>

        {/* Row 3: Projection chart (full width) */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <WealthProjection
            items={items}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>

        {/* Row 4: Financial goal (full width) */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <FinancialGoal
            items={items}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>
      </div>
    </div>
  );
}
