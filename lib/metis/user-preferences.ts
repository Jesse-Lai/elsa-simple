export type UserPreferences = {
  fullName: string;
  defaultPanel: 'prototype' | 'conversation';
};

export const USER_PREFERENCES_KEY = 'elsa-user-preferences-v1';
export const defaultUserPreferences: UserPreferences = { fullName: 'Jesse Lai', defaultPanel: 'prototype' };

export function parseUserPreferences(raw: string | null): UserPreferences {
  try {
    const value = JSON.parse(raw ?? '{}');
    return {
      fullName: typeof value?.fullName === 'string' && value.fullName.trim() ? value.fullName.trim().slice(0, 80) : defaultUserPreferences.fullName,
      defaultPanel: value?.defaultPanel === 'conversation' ? 'conversation' : 'prototype',
    };
  } catch {
    return defaultUserPreferences;
  }
}
