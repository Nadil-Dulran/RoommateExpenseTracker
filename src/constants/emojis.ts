export type DashboardCategory =
  | 'food'
  | 'travel'
  | 'shopping'
  | 'utilities'
  | 'entertainment'
  | 'other';

export const CATEGORY_EMOJI_BY_TYPE: Record<DashboardCategory, string> = {
  food: '🍔',
  travel: '🚗',
  shopping: '🛍️',
  utilities: '🧾',
  entertainment: '🎬',
  other: '📌',
};
