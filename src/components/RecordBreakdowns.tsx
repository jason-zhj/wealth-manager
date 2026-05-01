import { useState } from 'react';
import { RecordItem, DisplayCurrency, ExchangeRates } from '../lib/types';
import { CATEGORY_COLORS, RISK_COLOR, FALLBACK_RATES } from '../lib/constants';
import CurrencyToggle from './CurrencyToggle';
import BreakdownChart from './BreakdownChart';
import styles from './RecordBreakdowns.module.css';

type CategoryGroupBy = 'category' | 'place_type' | 'place';

interface Props {
  items: RecordItem[];
  initialCurrency?: DisplayCurrency;
  rates?: ExchangeRates;
}

export default function RecordBreakdowns({ items, initialCurrency = 'SGD', rates: ratesProp }: Props) {
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(initialCurrency);
  const [categoryGroupBy, setCategoryGroupBy] = useState<CategoryGroupBy>('category');

  const rates: ExchangeRates = ratesProp ?? { ...FALLBACK_RATES };

  if (items.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Asset Breakdown</h3>
        <CurrencyToggle value={displayCurrency} onChange={setDisplayCurrency} />
      </div>
      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>By Category</span>
            <select
              className={styles.groupBySelect}
              value={categoryGroupBy}
              onChange={e => setCategoryGroupBy(e.target.value as CategoryGroupBy)}
            >
              <option value="category">Category</option>
              <option value="place_type">Place Type</option>
              <option value="place">Place</option>
            </select>
          </div>
          <BreakdownChart
            items={items}
            groupBy={categoryGroupBy}
            displayCurrency={displayCurrency}
            rates={rates}
            colorMap={categoryGroupBy === 'category' ? CATEGORY_COLORS : {}}
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>By Currency</span>
          </div>
          <BreakdownChart
            items={items}
            groupBy="currency"
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>By Risk Level</span>
          </div>
          <BreakdownChart
            items={items}
            groupBy="risk_level"
            displayCurrency={displayCurrency}
            rates={rates}
            colorMap={RISK_COLOR}
          />
        </div>
      </div>
    </div>
  );
}
