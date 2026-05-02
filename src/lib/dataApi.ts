/**
 * Unified data API: routes calls to either the Supabase API (authenticated
 * users) or the guest API (localStorage) depending on the current mode.
 *
 * All pages and components should import from this module instead of api.ts
 * or guestApi.ts directly.
 */
import * as supabaseApi from './api';
import * as guestApi from './guestApi';

const GUEST_MODE_KEY = 'wm_guest_mode';

function isGuest(): boolean {
  return localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export const fetchRecords: typeof supabaseApi.fetchRecords = (...args) =>
  isGuest() ? guestApi.fetchRecords(...args) : supabaseApi.fetchRecords(...args);

export const fetchLatestRecords: typeof supabaseApi.fetchLatestRecords = (...args) =>
  isGuest() ? guestApi.fetchLatestRecords(...args) : supabaseApi.fetchLatestRecords(...args);

export const fetchRecordOneYearAgo: typeof supabaseApi.fetchRecordOneYearAgo = (...args) =>
  isGuest() ? guestApi.fetchRecordOneYearAgo(...args) : supabaseApi.fetchRecordOneYearAgo(...args);

export const fetchRecordWithItems: typeof supabaseApi.fetchRecordWithItems = (...args) =>
  isGuest() ? guestApi.fetchRecordWithItems(...args) : supabaseApi.fetchRecordWithItems(...args);

export const createRecord: typeof supabaseApi.createRecord = (...args) =>
  isGuest() ? guestApi.createRecord(...args) : supabaseApi.createRecord(...args);

export const updateRecord: typeof supabaseApi.updateRecord = (...args) =>
  isGuest() ? guestApi.updateRecord(...args) : supabaseApi.updateRecord(...args);

export const deleteRecord: typeof supabaseApi.deleteRecord = (...args) =>
  isGuest() ? guestApi.deleteRecord(...args) : supabaseApi.deleteRecord(...args);

export const fetchCustomOptions: typeof supabaseApi.fetchCustomOptions = (...args) =>
  isGuest() ? guestApi.fetchCustomOptions(...args) : supabaseApi.fetchCustomOptions(...args);

export const upsertCustomOption: typeof supabaseApi.upsertCustomOption = (...args) =>
  isGuest() ? guestApi.upsertCustomOption(...args) : supabaseApi.upsertCustomOption(...args);
