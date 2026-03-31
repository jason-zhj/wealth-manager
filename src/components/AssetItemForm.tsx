import { useState, useMemo } from 'react';
import { RecordItem, CustomOption } from '../lib/types';
import { DEFAULT_CATEGORIES, DEFAULT_CURRENCIES, DEFAULT_PLACE_TYPES, DEFAULT_PLACES, RISK_LEVELS } from '../lib/constants';
import { upsertCustomOption } from '../lib/api';
import styles from './AssetItemForm.module.css';

interface Props {
  item: RecordItem;
  index: number;
  onChange: (index: number, field: keyof RecordItem, value: string | number) => void;
  onRemove: (index: number) => void;
  customOptions: CustomOption[];
  onCustomOptionAdded: (option: CustomOption) => void;
}

export default function AssetItemForm({ item, index, onChange, onRemove, customOptions, onCustomOptionAdded }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [addingCustom, setAddingCustom] = useState<'category' | 'place_type' | 'place' | null>(null);
  const [customInputValue, setCustomInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const customCategories = useMemo(
    () => customOptions.filter(o => o.field_name === 'category').map(o => o.value),
    [customOptions]
  );
  const customPlaceTypes = useMemo(
    () => customOptions.filter(o => o.field_name === 'place_type').map(o => o.value),
    [customOptions]
  );
  const customPlaces = useMemo(
    () => customOptions.filter(o => o.field_name === 'place').map(o => o.value),
    [customOptions]
  );

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  const allPlaceTypes = [...DEFAULT_PLACE_TYPES, ...customPlaceTypes];
  const defaultPlacesForType = DEFAULT_PLACES[item.place_type] ?? [];
  const allPlaces = [...defaultPlacesForType, ...customPlaces];

  const handleAddCustom = async (field: 'category' | 'place_type' | 'place') => {
    const value = customInputValue.trim();
    if (!value) return;
    setSaving(true);
    try {
      await upsertCustomOption(field, value);
      // Optimistically add to local state
      const newOption: CustomOption = {
        id: `temp-${Date.now()}`,
        user_id: '',
        field_name: field,
        value,
      };
      onCustomOptionAdded(newOption);
      onChange(index, field, value);
      setAddingCustom(null);
      setCustomInputValue('');
    } catch (err) {
      console.error('Failed to save custom option', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectChange = (field: keyof RecordItem) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setAddingCustom(field as 'category' | 'place_type' | 'place');
      setCustomInputValue('');
    } else {
      onChange(index, field, val);
      // Reset place when place_type changes
      if (field === 'place_type') {
        onChange(index, 'place', '');
      }
    }
  };

  const renderCustomInput = (field: 'category' | 'place_type' | 'place') => (
    <div className={styles.customInputRow}>
      <input
        type="text"
        className={styles.customInput}
        placeholder="Enter custom value..."
        value={customInputValue}
        onChange={e => setCustomInputValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAddCustom(field)}
        autoFocus
      />
      <button
        type="button"
        className={styles.btnSave}
        onClick={() => handleAddCustom(field)}
        disabled={saving || !customInputValue.trim()}
      >
        {saving ? '...' : 'Add'}
      </button>
      <button
        type="button"
        className={styles.btnCancel}
        onClick={() => { setAddingCustom(null); setCustomInputValue(''); }}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={() => setCollapsed(c => !c)}>
        <span className={styles.cardTitle}>
          {item.name || item.category || `Asset ${index + 1}`}
          {item.amount > 0 && (
            <span className={styles.cardAmount}>
              {item.currency} {item.amount.toLocaleString()}
            </span>
          )}
        </span>
        <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className={styles.btnRemove}
            onClick={() => onRemove(index)}
            title="Remove"
          >
            ✕
          </button>
          <span className={styles.collapseIcon}>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.fields}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              {addingCustom === 'category' ? (
                renderCustomInput('category')
              ) : (
                <select
                  className={styles.select}
                  value={item.category}
                  onChange={handleSelectChange('category')}
                >
                  <option value="">Select category...</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">+ Add custom...</option>
                </select>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Currency</label>
              <select
                className={styles.select}
                value={item.currency}
                onChange={handleSelectChange('currency')}
              >
                {DEFAULT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Place Type</label>
              {addingCustom === 'place_type' ? (
                renderCustomInput('place_type')
              ) : (
                <select
                  className={styles.select}
                  value={item.place_type}
                  onChange={handleSelectChange('place_type')}
                >
                  <option value="">Select place type...</option>
                  {allPlaceTypes.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">+ Add custom...</option>
                </select>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Place</label>
              {addingCustom === 'place' ? (
                renderCustomInput('place')
              ) : (
                <select
                  className={styles.select}
                  value={item.place}
                  onChange={handleSelectChange('place')}
                >
                  <option value="">Select place...</option>
                  {allPlaces.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">+ Add custom...</option>
                </select>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Amount</label>
              <input
                type="number"
                className={styles.input}
                value={item.amount || ''}
                min="0"
                step="0.01"
                onChange={e => onChange(index, 'amount', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                className={styles.input}
                value={item.name}
                placeholder="e.g. fund name, share name"
                onChange={e => onChange(index, 'name', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Expected Annual Yield (%)</label>
              <input
                type="number"
                className={styles.input}
                value={item.expected_annual_yield || ''}
                min="0"
                step="0.1"
                onChange={e => onChange(index, 'expected_annual_yield', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Risk Level</label>
              <select
                className={styles.select}
                value={item.risk_level}
                onChange={handleSelectChange('risk_level')}
              >
                {RISK_LEVELS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Details</label>
            <textarea
              className={styles.textarea}
              value={item.details}
              rows={2}
              placeholder="Optional notes..."
              onChange={e => onChange(index, 'details', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
