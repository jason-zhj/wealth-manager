import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WealthRecord, RecordItem } from '../lib/types';
import { fetchRecords } from '../lib/dataApi';
import { RISK_COLOR } from '../lib/constants';
import styles from './RecordsList.module.css';

function computeTotals(items: RecordItem[] = []) {
  let totalSGD = 0;
  let weightedYield = 0;
  let totalWeight = 0;
  const riskOrder = { low: 0, medium: 1, high: 2 };
  let maxRisk: RecordItem['risk_level'] = 'low';

  for (const item of items) {
    // Approximate SGD amount (currency conversion not available here, use as-is for listing)
    const amount = item.amount;
    totalSGD += amount;
    weightedYield += amount * item.expected_annual_yield;
    totalWeight += amount;
    if (riskOrder[item.risk_level] > riskOrder[maxRisk]) {
      maxRisk = item.risk_level;
    }
  }

  const avgYield = totalWeight > 0 ? weightedYield / totalWeight : 0;
  return { totalSGD, avgYield, riskLevel: maxRisk };
}

export default function RecordsList() {
  const [records, setRecords] = useState<WealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecords()
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.page}><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Records</h1>
        <button className={styles.btnNew} onClick={() => navigate('/records/new')}>
          + Add Record
        </button>
      </div>

      {records.length === 0 ? (
        <div className={styles.empty}>
          <p>No records yet.</p>
          <button className={styles.btnNew} onClick={() => navigate('/records/new')}>
            Add your first record
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Wealth (SGD)</th>
                <th>Avg Annual Yield</th>
                <th>Risk Level</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const { totalSGD, avgYield, riskLevel } = computeTotals(record.record_items);
                return (
                  <tr key={record.id}>
                    <td className={styles.dateCell}>{record.date}</td>
                    <td className={styles.amountCell}>
                      {totalSGD.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>{avgYield.toFixed(2)}%</td>
                    <td>
                      <span
                        className={styles.riskBadge}
                        style={{ color: RISK_COLOR[riskLevel], background: RISK_COLOR[riskLevel] + '20' }}
                      >
                        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.btnView}
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
