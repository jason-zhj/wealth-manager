import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WealthRecord, DisplayCurrency, ExchangeRates } from '../lib/types';
import { fetchLatestRecords, fetchRecordOneYearAgo } from '../lib/api';
import { getExchangeRates } from '../lib/currency';
import { FALLBACK_RATES } from '../lib/constants';
import CurrencyToggle from '../components/CurrencyToggle';
import WealthSummary from '../components/WealthSummary';
import AssetPieChart from '../components/AssetPieChart';
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

      <div className={styles.grid}>
        <div className={styles.summaryCard}>
          <WealthSummary
            latestRecord={latestRecord}
            previousRecord={previousRecord}
            yearAgoRecord={yearAgoRecord}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Asset Breakdown</h2>
          <AssetPieChart
            items={latestRecord.record_items ?? []}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>
      </div>
    </div>
  );
}
