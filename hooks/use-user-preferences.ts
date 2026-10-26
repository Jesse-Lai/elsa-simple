'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { parseUserPreferences, USER_PREFERENCES_KEY, type UserPreferences } from '@/lib/metis/user-preferences';

const changeEvent = 'elsa-preferences-changed';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(changeEvent, callback);
  };
}
function snapshot() {
  try { return localStorage.getItem(USER_PREFERENCES_KEY); } catch { return null; }
}
function serverSnapshot() { return null; }

export function useUserPreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => parseUserPreferences(raw), [raw]);
}

export function saveUserPreferences(preferences: UserPreferences) {
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(changeEvent));
}
