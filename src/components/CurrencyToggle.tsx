import { DisplayCurrency } from '../lib/types';
import { DISPLAY_CURRENCIES } from '../lib/constants';
import styles from './CurrencyToggle.module.css';

interface Props {
  value: DisplayCurrency;
  onChange: (currency: DisplayCurrency) => void;
}

export default function CurrencyToggle({ value, onChange }: Props) {
  return (
    <div className={styles.toggle}>
      {DISPLAY_CURRENCIES.map(currency => (
        <button
          key={currency}
          className={`${styles.btn} ${value === currency ? styles.active : ''}`}
          onClick={() => onChange(currency as DisplayCurrency)}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
