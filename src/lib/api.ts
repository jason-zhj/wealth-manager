import { supabase } from './supabase';
import { WealthRecord, RecordItem, CustomOption } from './types';

// ─── Records ─────────────────────────────────────────────────────────────────

export async function fetchRecords(): Promise<WealthRecord[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*, record_items(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as WealthRecord[];
}

export async function fetchLatestRecords(limit = 2): Promise<WealthRecord[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*, record_items(*)')
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as WealthRecord[];
}

export async function fetchRecordOneYearAgo(referenceDate: string): Promise<WealthRecord | null> {
  // Find the record closest to (referenceDate - 1 year)
  const oneYearAgo = new Date(referenceDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const targetDate = oneYearAgo.toISOString().split('T')[0];

  // Get the nearest record before or on that date
  const { data: before, error: e1 } = await supabase
    .from('records')
    .select('*, record_items(*)')
    .lte('date', targetDate)
    .order('date', { ascending: false })
    .limit(1);
  if (e1) throw e1;

  // Get the nearest record after that date
  const { data: after, error: e2 } = await supabase
    .from('records')
    .select('*, record_items(*)')
    .gt('date', targetDate)
    .order('date', { ascending: true })
    .limit(1);
  if (e2) throw e2;

  const beforeRecord = before?.[0] as WealthRecord | undefined;
  const afterRecord = after?.[0] as WealthRecord | undefined;

  if (!beforeRecord && !afterRecord) return null;
  if (!beforeRecord) return afterRecord!;
  if (!afterRecord) return beforeRecord;

  const diffBefore = Math.abs(new Date(beforeRecord.date).getTime() - oneYearAgo.getTime());
  const diffAfter = Math.abs(new Date(afterRecord.date).getTime() - oneYearAgo.getTime());
  return diffBefore <= diffAfter ? beforeRecord : afterRecord;
}

export async function fetchRecordWithItems(id: string): Promise<WealthRecord> {
  const { data, error } = await supabase
    .from('records')
    .select('*, record_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as WealthRecord;
}

export async function createRecord(date: string, items: RecordItem[]): Promise<WealthRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: record, error: recordError } = await supabase
    .from('records')
    .insert({ date, user_id: user.id })
    .select()
    .single();
  if (recordError) throw recordError;

  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      record_id: record.id,
      category: item.category,
      currency: item.currency,
      place_type: item.place_type,
      place: item.place,
      amount: item.amount,
      name: item.name,
      expected_annual_yield: item.expected_annual_yield,
      risk_level: item.risk_level,
      details: item.details,
    }));
    const { error: itemsError } = await supabase.from('record_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  return record as WealthRecord;
}

export async function updateRecord(id: string, date: string, items: RecordItem[]): Promise<void> {
  const { error: recordError } = await supabase
    .from('records')
    .update({ date })
    .eq('id', id);
  if (recordError) throw recordError;

  // Delete and re-insert items
  const { error: deleteError } = await supabase
    .from('record_items')
    .delete()
    .eq('record_id', id);
  if (deleteError) throw deleteError;

  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      record_id: id,
      category: item.category,
      currency: item.currency,
      place_type: item.place_type,
      place: item.place,
      amount: item.amount,
      name: item.name,
      expected_annual_yield: item.expected_annual_yield,
      risk_level: item.risk_level,
      details: item.details,
    }));
    const { error: itemsError } = await supabase.from('record_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) throw error;
}

// ─── Custom Options ───────────────────────────────────────────────────────────

export async function fetchCustomOptions(): Promise<CustomOption[]> {
  const { data, error } = await supabase
    .from('custom_options')
    .select('*')
    .order('field_name');
  if (error) throw error;
  return data as CustomOption[];
}

export async function upsertCustomOption(
  field_name: CustomOption['field_name'],
  value: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('custom_options')
    .upsert({ user_id: user.id, field_name, value }, { onConflict: 'user_id,field_name,value' });
  if (error) throw error;
}
