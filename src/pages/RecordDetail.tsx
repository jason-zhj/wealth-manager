import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WealthRecord, RecordItem, CustomOption, ExchangeRates } from '../lib/types';
import { fetchRecordWithItems, updateRecord, fetchCustomOptions } from '../lib/dataApi';
import { getExchangeRates } from '../lib/currency';
import { FALLBACK_RATES } from '../lib/constants';
import { validateItems } from '../components/RecordForm';
import RecordBreakdowns from '../components/RecordBreakdowns';
import AssetGroupList from '../components/AssetGroupList';
import styles from './RecordDetail.module.css';
import pageStyles from './PageShared.module.css';

type Mode = 'view' | 'edit';

interface Draft {
  date: string;
  items: RecordItem[];
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

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<WealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [mode, setMode] = useState<Mode>('view');
  const [draft, setDraft] = useState<Draft>({ date: '', items: [] });
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newItemIndex, setNewItemIndex] = useState<number | null>(null);
  const [rates, setRates] = useState<ExchangeRates>({ ...FALLBACK_RATES });

  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(index, el);
    else itemRefs.current.delete(index);
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchRecordWithItems(id),
      fetchCustomOptions(),
      getExchangeRates(),
    ])
      .then(([rec, opts, fetchedRates]) => {
        setRecord(rec);
        setDraft({ date: rec.date, items: rec.record_items ?? [] });
        setCustomOptions(opts);
        setRates(fetchedRates);
      })
      .catch(() => setLoadError('Failed to load record.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Scroll to new item after render, clear highlight after 2s
  useEffect(() => {
    if (newItemIndex === null) return;
    const el = itemRefs.current.get(newItemIndex);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setNewItemIndex(null), 2000);
    return () => clearTimeout(timer);
  }, [newItemIndex, draft.items.length]);

  const handleEdit = () => {
    setSaveError('');
    setMode('edit');
  };

  const handleDiscard = () => {
    setDraft({ date: record!.date, items: record!.record_items ?? [] });
    setSaveError('');
    setNewItemIndex(null);
    setMode('view');
  };

  const handleSave = async () => {
    if (!id) return;
    const itemError = validateItems(draft.items);
    if (!draft.date) { setSaveError('Please select a date.'); return; }
    if (itemError) { setSaveError(itemError); return; }

    setSaving(true);
    setSaveError('');
    try {
      await updateRecord(id, draft.date, draft.items);
      // Refresh record
      const updated = await fetchRecordWithItems(id);
      setRecord(updated);
      setDraft({ date: updated.date, items: updated.record_items ?? [] });
      setSuccessMsg('Record saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setMode('view');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleItemChange = (index: number, field: keyof RecordItem, value: string | number) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const handleItemRemove = (index: number) => {
    setDraft(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    if (newItemIndex === index) setNewItemIndex(null);
  };

  const handleAddItem = () => {
    const nextIndex = draft.items.length;
    setDraft(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
    setNewItemIndex(nextIndex);
  };

  const handleCustomOptionAdded = (option: CustomOption) => {
    setCustomOptions(prev => [...prev, option]);
  };

  if (loading) return <div className={pageStyles.page}><div className="spinner" /></div>;
  if (loadError) return <div className={pageStyles.page}><div className={styles.errorMsg}>{loadError}</div></div>;
  if (!record) return null;

  return (
    <div className={`${pageStyles.page} ${styles.detailPage}`}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Record Details</h1>
          {mode === 'view' && (
            <div className={styles.dateDisplay}>{record.date}</div>
          )}
          {mode === 'edit' && (
            <div className={styles.dateEditRow}>
              <label className={styles.dateLabel}>Date</label>
              <input
                type="date"
                className={styles.dateInput}
                value={draft.date}
                onChange={e => setDraft(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          {mode === 'view' ? (
            <>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => navigate('/records')}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnEdit}
                onClick={handleEdit}
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleDiscard}
                disabled={saving}
              >
                Discard
              </button>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
      {saveError && <div className={styles.errorBanner}>{saveError}</div>}

      {/* Asset Breakdowns — always visible */}
      {draft.items.length > 0 && (
        <RecordBreakdowns items={draft.items} rates={rates} />
      )}

      {/* Asset list */}
      <div className={styles.assetsSection}>
        <div className={styles.assetsSectionHeader}>
          <h2 className={styles.assetsSectionTitle}>
            Assets ({draft.items.length})
          </h2>
          {mode === 'edit' && (
            <button
              type="button"
              className={styles.btnAdd}
              onClick={handleAddItem}
            >
              + Add Asset
            </button>
          )}
        </div>

        <AssetGroupList
          items={draft.items}
          mode={mode}
          onChange={handleItemChange}
          onRemove={handleItemRemove}
          customOptions={customOptions}
          onCustomOptionAdded={handleCustomOptionAdded}
          newItemIndex={newItemIndex}
          newItemRef={setItemRef}
          displayCurrency="SGD"
          rates={rates}
        />
      </div>
    </div>
  );
}
