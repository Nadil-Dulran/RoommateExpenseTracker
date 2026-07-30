import { Expense } from '../types';

export const CATEGORY_KEYS: Expense['category'][] = [
  'food',
  'transport',
  'bills',
  'shopping',
  'entertainment',
  'other',
];

export const normalizeCategoryType = (
  value?: string | null
): Expense['category'] => {
  const category = String(value ?? '').trim().toLowerCase();

  return CATEGORY_KEYS.includes(category as Expense['category'])
    ? (category as Expense['category'])
    : 'other';
};

export const extractExpensesPayload = (data: any): any[] => {
  return Array.isArray(data) ? data : [];
};

export const sortRawExpensesByLatest = (items: any[]) => {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(
      String(a?.expense_date ?? a?.created_at ?? '')
    );

    const bTime = Date.parse(
      String(b?.expense_date ?? b?.created_at ?? '')
    );

    if (
      Number.isFinite(aTime) &&
      Number.isFinite(bTime) &&
      aTime !== bTime
    ) {
      return bTime - aTime;
    }

    return Number(b?.id ?? 0) - Number(a?.id ?? 0);
  });
};

export const normalizeExpense = (raw: any): Expense => {
  const splits = Array.isArray(raw?.splits)
    ? raw.splits.map((split: any) => ({
        userId: String(split?.user_id ?? ''),
        amount: Number(split?.share_amount ?? 0),
        percentage:
          split?.percentage != null
            ? Number(split.percentage)
            : undefined,
      }))
    : [];

  const splitType =
    raw?.split_type === 'equal' ||
    raw?.split_type === 'exact' ||
    raw?.split_type === 'percentage'
      ? raw.split_type
      : undefined;

  return {
    id: String(raw?.id ?? ''),
    category: normalizeCategoryType(raw?.category),
    categoryLabel: raw?.category ?? undefined,
    description: raw?.title ?? 'Expense',
    amount: Number(raw?.amount ?? 0),
    date: String(
      raw?.expense_date ??
      raw?.created_at ??
      new Date().toISOString()
    ),
    groupId: String(raw?.group_id ?? ''),
    paidBy: {
      id: String(raw?.paid_by ?? ''),
      name: raw?.paid_by_name ?? 'Unknown',
    },
    splits,
    splitType,
    createdAt: raw?.created_at
      ? String(raw.created_at)
      : undefined,
    updatedAt: raw?.updated_at
      ? String(raw.updated_at)
      : undefined,
    originalExpenseDateField: raw?.expense_date
      ? 'expense_date'
      : undefined,
    originalExpenseDate: raw?.expense_date
      ? String(raw.expense_date)
      : undefined,
  };
};