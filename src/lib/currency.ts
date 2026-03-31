import { ExchangeRates } from './types';
import { FALLBACK_RATES } from './constants';

const CACHE_KEY = 'wm_exchange_rates';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedRates {
  rates: ExchangeRates;
  fetchedAt: number;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRates = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
        return parsed.rates;
      }
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/SGD');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    const rates: ExchangeRates = {
      SGD: 1,
      USD: data.rates?.USD ?? FALLBACK_RATES.USD,
      CNY: data.rates?.CNY ?? FALLBACK_RATES.CNY,
    };
    const toCache: CachedRates = { rates, fetchedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
    return rates;
  } catch {
    return { ...FALLBACK_RATES };
  }
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  // Convert to SGD first, then to target
  const inSGD = fromCurrency === 'SGD' ? amount : amount / (rates[fromCurrency as keyof ExchangeRates] ?? 1);
  if (toCurrency === 'SGD') return inSGD;
  return inSGD * (rates[toCurrency as keyof ExchangeRates] ?? 1);
}
