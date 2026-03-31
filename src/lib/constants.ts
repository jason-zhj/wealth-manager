export const DEFAULT_CATEGORIES = ['bankAccount', 'fund', 'equity', 'cpf'] as const;

export const DEFAULT_CURRENCIES = ['SGD', 'USD'] as const;

export const DEFAULT_PLACE_TYPES = ['bank', 'broker', 'cpf', 'others'] as const;

export const DEFAULT_PLACES: Record<string, string[]> = {
  bank: ['UOB', 'StandardChartered', 'DBS'],
  broker: ['moomoo', 'webull', 'longbridge', 'morganStanley'],
  cpf: ['cpf'],
  others: [],
};

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  bankAccount: '#4f46e5',
  fund: '#0ea5e9',
  equity: '#10b981',
  cpf: '#f59e0b',
};

export const RISK_COLOR: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
};

// Fallback exchange rates (SGD base)
export const FALLBACK_RATES = {
  SGD: 1,
  USD: 0.74,
  CNY: 5.35,
};

export const DISPLAY_CURRENCIES = ['SGD', 'CNY', 'USD'] as const;
