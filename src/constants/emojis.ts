import { CategoryType } from '../types/expense';

export type DashboardCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'other';

export const CATEGORY_EMOJI_BY_TYPE: Record<DashboardCategory, string> = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  bills: '🧾',
  entertainment: '🎬',
  other: '📌',
};

export const categories: Record<CategoryType, { icon: string; name: string }> = {
  food: { icon: '🍔', name: 'Food' },
  transport: { icon: '🚗', name: 'Transport' },
  shopping: { icon: '🛍️', name: 'Shopping' },
  bills: { icon: '🧾', name: 'Bills' },
  entertainment: { icon: '🎬', name: 'Entertainment' },
  other: { icon: '📌', name: 'Other' },
};