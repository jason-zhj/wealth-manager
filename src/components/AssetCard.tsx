import { RecordItem } from '../lib/types';
import { formatLabel } from '../lib/labels';
import { RISK_COLOR } from '../lib/constants';
import styles from './AssetCard.module.css';

interface Props {
  item: RecordItem;
}

export default function AssetCard({ item }: Props) {
  const riskColor = RISK_COLOR[item.risk_level] ?? '#6b7280';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{item.name || formatLabel(item.category) || '—'}</span>
        <span className={styles.amount}>
          {item.currency} {item.amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className={styles.grid}>
        {item.place_type && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Place Type</span>
            <span className={styles.fieldValue}>{formatLabel(item.place_type)}</span>
          </div>
        )}
        {item.place && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Place</span>
            <span className={styles.fieldValue}>{formatLabel(item.place)}</span>
          </div>
        )}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Annual Yield</span>
          <span className={styles.fieldValue}>{item.expected_annual_yield}%</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Risk</span>
          <span className={styles.fieldValue}>
            <span className={styles.riskDot} style={{ background: riskColor }} />
            {formatLabel(item.risk_level)}
          </span>
        </div>
        {item.details && (
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <span className={styles.fieldLabel}>Details</span>
            <span className={styles.fieldValue}>{item.details}</span>
          </div>
        )}
      </div>
    </div>
  );
}
