type ExpenseSplit = {
  userId?: number | string;
  amount?: number | string;
  share_amount?: number | string;
  percentage?: number;
};

const ensureStringId = (value: any): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'object') {
    return ensureStringId(value?.id ?? '');
  }
  return '';
};

const toNumber = (value: any): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const extractSplits = (expense: any): Array<{ userId: string; amount: number }> => {
  const splits = Array.isArray(expense?.splits)
    ? (expense.splits as ExpenseSplit[])
    : [];
  return splits
    .map((split) => ({
      userId: ensureStringId(split.userId),
      amount: toNumber(split.amount),
    }))
    .filter(split => !!split.userId && split.amount > 0);
};

const resolvePaidById = (expense: any): string => {
  if (!expense) { return ''}
  return ensureStringId(expense?.paidBy);
};

const resolveExpenseAmount = (expense: any): number => {
  return toNumber( expense?.amount ?? 0 );
};

export const calculateGroupBalance = (
  expenses: any[],
  currentUserId: string | number | null | undefined
) => {
  const userId = ensureStringId(currentUserId);
  if (!userId) {
    return { amount: 0, isYouOwing: false };
  }

  let total = 0;

  (expenses || []).forEach(expense => {
    if (!expense) {
      return;
    }

    const paidById = resolvePaidById(expense);
    const splits = extractSplits(expense);
    const mySplit = splits.find(split => split.userId === userId);
    const myShare = mySplit ? mySplit.amount : 0;
    const amount = resolveExpenseAmount(expense);

    if (paidById === userId) {
      total += amount - myShare;
      return;
    }

    if (myShare > 0) {
      total -= myShare;
    }
  });

  return {
    amount: Math.abs(total),
    isYouOwing: total < 0,
  };
};