export interface WealthRecord {
  id: string;
  user_id: string;
  date: string; // ISO date "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
  record_items?: RecordItem[];
}

export interface RecordItem {
  id?: string;
  record_id?: string;
  category: string;
  currency: 'SGD' | 'USD';
  place_type: string;
  place: string;
  amount: number;
  name: string;
  expected_annual_yield: number;
  risk_level: 'low' | 'medium' | 'high';
  details: string;
}

export interface CustomOption {
  id: string;
  user_id: string;
  field_name: 'category' | 'place_type' | 'place';
  value: string;
}

export type DisplayCurrency = 'SGD' | 'CNY' | 'USD';

export interface ExchangeRates {
  SGD: number;
  USD: number;
  CNY: number;
}
