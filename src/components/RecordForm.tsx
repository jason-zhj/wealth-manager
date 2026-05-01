import { useState, useEffect, useRef, useCallback } from 'react';
import { RecordItem, CustomOption } from '../lib/types';
import { fetchCustomOptions } from '../lib/api';
import AssetItemForm from './AssetItemForm';
import styles from './RecordForm.module.css';

interface Props {
  initialDate?: string;
  initialItems?: RecordItem[];
  onSave: (date: string, items: RecordItem[]) => Promise<void>;
  saveLabel?: string;
  extraActions?: React.ReactNode;
}

const emptyItem = (): RecordItem => ({
  category: '',
  currency: 'SGD',
  place_type: '',
  place: '',
  amount: 0,
  name: '',
  expected_annual_yield: 0,
  risk_level: 'medium',
  details: '',
});

export function validateItems(items: RecordItem[]): string {
  if (items.length === 0) return 'Please add at least one asset.';
  for (const item of items) {
    if (!item.category || !item.place_type || !item.place) {
      return 'Please fill in Category, Place Type, and Place for each asset.';
    }
  }
  return '';
}

export default function RecordForm({
  initialDate,
  initialItems,
  onSave,
  saveLabel = 'Save',
  extraActions,
}: Props) {
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<RecordItem[]>(initialItems ?? []);
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newItemIndex, setNewItemIndex] = useState<number | null>(null);

  // Refs map: index → div element for scrolling
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    fetchCustomOptions()
      .then(setCustomOptions)
      .catch(err => console.error('Failed to load custom options', err));
  }, []);

  // Scroll to new item after it renders, then clear highlight after 2s
  useEffect(() => {
    if (newItemIndex === null) return;
    const el = itemRefs.current.get(newItemIndex);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = setTimeout(() => setNewItemIndex(null), 2000);
    return () => clearTimeout(timer);
  }, [newItemIndex, items.length]);

  const handleAddItem = () => {
    const nextIndex = items.length;
    setItems(prev => [...prev, emptyItem()]);
    setNewItemIndex(nextIndex);
  };

  const handleItemChange = (index: number, field: keyof RecordItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleItemRemove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (newItemIndex === index) setNewItemIndex(null);
  };

  const handleCustomOptionAdded = (option: CustomOption) => {
    setCustomOptions(prev => [...prev, option]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date) {
      setError('Please select a date.');
      return;
    }
    const itemError = validateItems(items);
    if (itemError) {
      setError(itemError);
      return;
    }

    setSaving(true);
    try {
      await onSave(date, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.dateField}>
        <label className={styles.label}>Date</label>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className={styles.itemsSection}>
        <div className={styles.itemsHeader}>
          <h3 className={styles.itemsTitle}>Assets ({items.length})</h3>
          <button
            type="button"
            className={styles.btnAdd}
            onClick={handleAddItem}
          >
            + Add Asset
          </button>
        </div>

        {items.length === 0 && (
          <div className={styles.emptyItems}>
            No assets yet. Click "Add Asset" to get started.
          </div>
        )}

        {items.map((item, index) => (
          <AssetItemForm
            key={index}
            ref={el => setItemRef(index, el)}
            item={item}
            index={index}
            onChange={handleItemChange}
            onRemove={handleItemRemove}
            customOptions={customOptions}
            onCustomOptionAdded={handleCustomOptionAdded}
            highlight={index === newItemIndex}
          />
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        {extraActions}
        <button type="submit" className={styles.btnSave} disabled={saving}>
          {saving ? 'Saving...' : saveLabel}
        </button>
      </div>
    </form>
  );
}
