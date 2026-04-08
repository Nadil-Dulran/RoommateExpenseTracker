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
