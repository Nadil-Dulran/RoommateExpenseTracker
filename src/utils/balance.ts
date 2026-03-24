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

const extractSplits = (expense: any): Array<{ userId: string; amount: number }> => {
  const candidates = [
    expense?.splits,
    expense?.expenseSplits,
    expense?.expense_splits,
    expense?.splitDetails,
    expense?.split_details,
  ];

  const base = candidates.find(Array.isArray) ?? [];

  return base
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

const resolvePaidById = (expense: any): string => {
  if (!expense) {
    return '';
  }

  const paidByCandidate =
    expense?.paidBy ??
    expense?.paid_by ??
    expense?.paidByUser ??
    expense?.paid_by_user ??
    expense?.paidById ??
    expense?.paid_by_id ??
    expense?.userId ??
    expense?.user_id ??
    '';

  if (typeof paidByCandidate === 'object') {
    return ensureStringId(paidByCandidate);
  }

  return ensureStringId(paidByCandidate);
};

const resolveExpenseAmount = (expense: any): number => {
  return toNumber(
    expense?.amount ??
    expense?.total ??
    expense?.expense_amount ??
    expense?.value ??
    0
  );
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
