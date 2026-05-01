import { useRef } from 'react';
import { RecordItem, CustomOption, ExchangeRates, DisplayCurrency } from '../lib/types';
import { formatLabel } from '../lib/labels';
import { convertAmount } from '../lib/currency';
import { FALLBACK_RATES } from '../lib/constants';
import AssetCard from './AssetCard';
import AssetItemForm from './AssetItemForm';
import styles from './AssetGroupList.module.css';

interface Props {
  items: RecordItem[];
  mode: 'view' | 'edit';
  // Edit-mode props (only needed when mode === 'edit')
  onChange?: (index: number, field: keyof RecordItem, value: string | number) => void;
  onRemove?: (index: number) => void;
  customOptions?: CustomOption[];
  onCustomOptionAdded?: (option: CustomOption) => void;
  newItemIndex?: number | null;
  newItemRef?: (index: number, el: HTMLDivElement | null) => void;
  displayCurrency?: DisplayCurrency;
  rates?: ExchangeRates;
}

function groupByCategory(items: RecordItem[]): Map<string, { item: RecordItem; originalIndex: number }[]> {
  const map = new Map<string, { item: RecordItem; originalIndex: number }[]>();
  items.forEach((item, originalIndex) => {
    const cat = item.category || 'Uncategorized';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push({ item, originalIndex });
  });
  return map;
}

export default function AssetGroupList({
  items,
  mode,
  onChange,
  onRemove,
  customOptions = [],
  onCustomOptionAdded,
  newItemIndex,
  newItemRef,
  displayCurrency = 'SGD',
  rates,
}: Props) {
  const effectiveRates: ExchangeRates = rates ?? { ...FALLBACK_RATES };

  // Freeze which indices belong to which category bucket when entering edit mode.
  // This prevents items from jumping between groups as the user changes the category field.
  const frozenGroupsRef = useRef<Map<string, number[]> | null>(null);
  const prevModeRef = useRef(mode);

  if (prevModeRef.current !== mode) {
    if (mode === 'edit') {
      const structure = new Map<string, number[]>();
      for (const [cat, entries] of groupByCategory(items)) {
        structure.set(cat, entries.map(e => e.originalIndex));
      }
      frozenGroupsRef.current = structure;
    } else {
      frozenGroupsRef.current = null;
    }
    prevModeRef.current = mode;
  }

  // Build display groups: frozen structure (live item values by index) in edit mode,
  // or freshly computed grouping in view mode.
  const frozenStructure = frozenGroupsRef.current;
  const frozenIndexSet = frozenStructure
    ? new Set(Array.from(frozenStructure.values()).flat())
    : null;

  let groups: Map<string, { item: RecordItem; originalIndex: number }[]>;
  if (frozenStructure) {
    groups = new Map(
      Array.from(frozenStructure.entries()).map(([cat, indices]) => [
        cat,
        indices
          .filter(i => i < items.length)
          .map(i => ({ item: items[i], originalIndex: i })),
      ])
    );
    // Newly added items (not in the frozen structure) go at the bottom
    const newEntries: { item: RecordItem; originalIndex: number }[] = [];
    items.forEach((item, i) => {
      if (!frozenIndexSet!.has(i)) {
        newEntries.push({ item, originalIndex: i });
      }
    });
    if (newEntries.length > 0) {
      const newCat = 'New Items';
      groups.set(newCat, [...(groups.get(newCat) ?? []), ...newEntries]);
    }
  } else {
    groups = groupByCategory(items);
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        No assets yet.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {[...groups.entries()].map(([category, entries]) => {
        const total = entries.reduce(
          (sum, { item }) => sum + convertAmount(item.amount, item.currency, displayCurrency, effectiveRates),
          0
        );
        return (
          <div key={category} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>{formatLabel(category)}</span>
              <span className={styles.groupMeta}>
                {entries.length} {entries.length === 1 ? 'asset' : 'assets'} &nbsp;·&nbsp;
                {displayCurrency} {total.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {mode === 'view'
              ? entries.map(({ item }) => (
                  <AssetCard key={item.id ?? item.name ?? String(item.amount)} item={item} />
                ))
              : entries.map(({ item, originalIndex }) => (
                  <AssetItemForm
                    key={originalIndex}
                    ref={newItemRef ? (el) => newItemRef(originalIndex, el) : undefined}
                    item={item}
                    index={originalIndex}
                    onChange={onChange!}
                    onRemove={onRemove!}
                    customOptions={customOptions}
                    onCustomOptionAdded={onCustomOptionAdded ?? (() => {})}
                    highlight={originalIndex === newItemIndex}
                  />
                ))
            }
          </div>
        );
      })}
    </div>
  );
}
