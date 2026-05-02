/**
 * Guest-mode data layer: all operations are backed by localStorage.
 * The data shape mirrors the Supabase tables so pages/components are unaware
 * of which backend is in use.
 */
import { WealthRecord, RecordItem, CustomOption } from './types';

const RECORDS_KEY = 'wm_guest_records';
const OPTIONS_KEY = 'wm_guest_custom_options';

function uid(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadRecords(): WealthRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: WealthRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function loadOptions(): CustomOption[] {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOptions(options: CustomOption[]): void {
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
}

// ─── Records ──────────────────────────────────────────────────────────────────

export async function fetchRecords(): Promise<WealthRecord[]> {
  return loadRecords().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function fetchLatestRecords(limit = 2): Promise<WealthRecord[]> {
  const all = await fetchRecords();
  return all.slice(0, limit);
}

export async function fetchRecordOneYearAgo(referenceDate: string): Promise<WealthRecord | null> {
  const oneYearAgo = new Date(referenceDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const target = oneYearAgo.getTime();

  const all = await fetchRecords();
  if (all.length === 0) return null;

  return all.reduce((best, rec) => {
    const diff = Math.abs(new Date(rec.date).getTime() - target);
    const bestDiff = Math.abs(new Date(best.date).getTime() - target);
    return diff < bestDiff ? rec : best;
  });
}

export async function fetchRecordWithItems(id: string): Promise<WealthRecord> {
  const record = loadRecords().find(r => r.id === id);
  if (!record) throw new Error(`Record ${id} not found`);
  return record;
}

export async function createRecord(date: string, items: RecordItem[]): Promise<WealthRecord> {
  const records = loadRecords();
  const recordId = uid();
  const ts = now();
  const newRecord: WealthRecord = {
    id: recordId,
    user_id: 'guest',
    date,
    created_at: ts,
    updated_at: ts,
    record_items: items.map(item => ({
      ...item,
      id: uid(),
      record_id: recordId,
    })),
  };
  records.unshift(newRecord);
  saveRecords(records);
  return newRecord;
}

export async function updateRecord(id: string, date: string, items: RecordItem[]): Promise<void> {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) throw new Error(`Record ${id} not found`);
  records[idx] = {
    ...records[idx],
    date,
    updated_at: now(),
    record_items: items.map(item => ({
      ...item,
      id: item.id ?? uid(),
      record_id: id,
    })),
  };
  saveRecords(records);
}

export async function deleteRecord(id: string): Promise<void> {
  saveRecords(loadRecords().filter(r => r.id !== id));
}

// ─── Custom Options ───────────────────────────────────────────────────────────

export async function fetchCustomOptions(): Promise<CustomOption[]> {
  return loadOptions().sort((a, b) => a.field_name.localeCompare(b.field_name));
}

export async function upsertCustomOption(
  field_name: CustomOption['field_name'],
  value: string
): Promise<void> {
  const options = loadOptions();
  const exists = options.some(o => o.field_name === field_name && o.value === value);
  if (!exists) {
    options.push({ id: uid(), user_id: 'guest', field_name, value });
    saveOptions(options);
  }
}

// ─── Cleanup helpers (used during migration) ─────────────────────────────────

export function clearGuestData(): void {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(OPTIONS_KEY);
}
