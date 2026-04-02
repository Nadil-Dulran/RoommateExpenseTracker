import { Expense } from '../types';

const ensureStringId = (value: any): string => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  if (typeof value === 'object') {
    return ensureStringId(
      value?.id ??
      value?.userId ??
      value?.user_id ??
      value?.memberId ??
      value?.member_id ??
      value?.user?.id ??
      value?.user?.user_id ??
      ''
    );
  }

  return '';
};

const toNumber = (value: any): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getSplitSources = (raw: any): any[] => {
  if (Array.isArray(raw?.splits)) { return raw.splits; }
  if (Array.isArray(raw?.expenseSplits)) { return raw.expenseSplits; }
  if (Array.isArray(raw?.expense_splits)) { return raw.expense_splits; }
  if (Array.isArray(raw?.splitDetails)) { return raw.splitDetails; }
  if (Array.isArray(raw?.split_details)) { return raw.split_details; }
  if (Array.isArray(raw?.split)) { return raw.split; }
  return [];
};

const normalizeSplits = (raw: any) => {
  const splits = getSplitSources(raw);

  return splits
    .map((split: any) => ({
      userId: ensureStringId(
        split?.userId ??
        split?.user_id ??
        split?.memberId ??
        split?.member_id ??
        split?.user?.id ??
        split?.user?.user_id ??
        split
      ),
      amount: toNumber(
        split?.amount ??
        split?.share_amount ??
        split?.shareAmount ??
        split?.share ??
        split?.split_amount ??
        split?.value ??
        0
      ),
    }))
    .filter(split => !!split.userId && split.amount > 0);
};

export const extractExpensesPayload = (data: any): any[] => {
  if (Array.isArray(data)) { return data; }
  if (Array.isArray(data?.data)) { return data.data; }
  if (Array.isArray(data?.expenses)) { return data.expenses; }
  if (Array.isArray(data?.items)) { return data.items; }
  if (Array.isArray(data?.data?.expenses)) { return data.data.expenses; }
  if (Array.isArray(data?.data?.items)) { return data.data.items; }
  return [];
};

export const sortRawExpensesByLatest = (items: any[]) => {
  return [...(items || [])].sort((a, b) => {
    const aTime = Date.parse(String(a?.createdAt ?? a?.created_at ?? a?.date ?? a?.expense_date ?? ''));
    const bTime = Date.parse(String(b?.createdAt ?? b?.created_at ?? b?.date ?? b?.expense_date ?? ''));

    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }

    const aId = Number(a?.id ?? a?.expenseId ?? a?.expense_id);
    const bId = Number(b?.id ?? b?.expenseId ?? b?.expense_id);

    if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
      return bId - aId;
    }

    return String(b?.id ?? b?.expenseId ?? b?.expense_id ?? '').localeCompare(
      String(a?.id ?? a?.expenseId ?? a?.expense_id ?? '')
    );
  });
};

export const normalizeExpense = (raw: any, fallbackGroupId?: string | number): Expense => {
  const paidById = ensureStringId(
    raw?.paidByUser ??
      raw?.paid_by_user ??
      raw?.paidBy ??
      raw?.paid_by ??
      raw?.paidById ??
      raw?.paid_by_id ??
      raw?.userId ??
      raw?.user_id ??
      ''
  );

  return {
    id: String(raw?.id ?? raw?.expenseId ?? raw?.expense_id ?? ''),
    category: String(raw?.category ?? raw?.type ?? 'other').toLowerCase() as Expense['category'],
    description: raw?.description ?? raw?.title ?? 'Expense',
    amount: toNumber(raw?.amount ?? raw?.total ?? raw?.expense_amount ?? 0),
    date: String(
      raw?.date ??
        raw?.expense_date ??
        raw?.createdAt ??
        raw?.created_at ??
        new Date(0).toISOString()
    ),
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? raw?.created ?? ''),
    updatedAt: String(raw?.updatedAt ?? raw?.updated_at ?? raw?.updated ?? ''),
    groupId: String(raw?.groupId ?? raw?.group_id ?? raw?.group?.id ?? fallbackGroupId ?? ''),
    paidBy: {
      id: paidById,
      name:
        raw?.paidByUser?.name ??
        raw?.paid_by_user?.name ??
        raw?.paidBy?.name ??
        raw?.paid_by_name ??
        raw?.paidByName ??
        'Unknown',
    },
    splits: normalizeSplits(raw),
  };
};
