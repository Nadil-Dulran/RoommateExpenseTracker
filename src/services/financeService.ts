import { Expense } from '../types/expense';
import { User } from '../types/user';
import { expenses } from '../data/mockData';


export function calculateUserBalance(
  expenses: Expense[],
  currentUser: User
) {
  let totalOwed = 0;   // others owe you
  let totalOwing = 0;  // you owe others

  expenses.forEach(expense => {
    const yourSplit = expense.splits.find(
      split => split.userId === currentUser.id
    );

    // If YOU paid
    if (expense.paidBy.id === currentUser.id) {
      expense.splits.forEach(split => {
        if (split.userId !== currentUser.id) {
          totalOwed += split.amount;
        }
      });
    }

    // If someone else paid and you owe
    else if (yourSplit) {
      totalOwing += yourSplit.amount;
    }
  });

  return {
    totalOwed,
    totalOwing,
    totalBalance: totalOwed - totalOwing,
  };
}

import { groups } from '../data/mockData';

export function calculateMemberBalances(
  expenses: Expense[],
  currentUser: User
) {
  const map = new Map<
    string,
    { id: string; name: string; amount: number }
  >();

  expenses.forEach(expense => {
    const group = groups.find(g => g.id === expense.groupId);
    if (!group) return;

    const yourSplit = expense.splits.find(
      s => s.userId === currentUser.id
    );

    // YOU paid
    if (expense.paidBy.id === currentUser.id) {
      expense.splits.forEach(split => {
        if (split.userId !== currentUser.id) {
          const member = group.members.find(
            m => m.id === split.userId
          );

          const existing = map.get(split.userId);

          if (existing) {
            existing.amount += split.amount;
          } else {
            map.set(split.userId, {
              id: split.userId,
              name: member?.name ?? 'Member',
              amount: split.amount, // positive = they owe you
            });
          }
        }
      });
    }

    // Someone else paid
    else if (yourSplit) {
      const payer = group.members.find(
        m => m.id === expense.paidBy.id
      );

      const existing = map.get(expense.paidBy.id);

      if (existing) {
        existing.amount -= yourSplit.amount; // negative = you owe
      } else {
        map.set(expense.paidBy.id, {
          id: expense.paidBy.id,
          name: payer?.name ?? 'Member',
          amount: -yourSplit.amount,
        });
      }
    }
  });

  return Array.from(map.values()).map(member => ({
    ...member,
    isYouPaying: member.amount < 0,
    amount: Math.abs(member.amount),
  }));
}

export function calculateGroupBalance(
  groupId: string,
  expenses: Expense[],
  currentUser: User
) {
  let balance = 0;

  expenses
    .filter(expense => expense.groupId === groupId)
    .forEach(expense => {
      const yourSplit = expense.splits.find(
        s => s.userId === currentUser.id
      );

      // YOU paid
      if (expense.paidBy.id === currentUser.id) {
        expense.splits.forEach(split => {
          if (split.userId !== currentUser.id) {
            balance += split.amount;
          }
        });
      }

      // Someone else paid
      else if (yourSplit) {
        balance -= yourSplit.amount;
      }
    });

  return {
    amount: Math.abs(balance),
    isYouOwing: balance < 0,
  };
}

export function settleWithMember(
  currentUser: User,
  memberId: string,
  amount: number,
  isYouPaying: boolean
) {
  const settlementExpense: Expense = {
    id: `settle_${Date.now()}`,
    category: 'utilities',
    description: 'Settlement',
    amount,
    date: new Date().toISOString(),
    groupId: 'g1', // or dynamically detect group if needed
    paidBy: isYouPaying ? currentUser : { id: memberId, name: 'Member' },
    splits: [
      { userId: currentUser.id, amount },
      { userId: memberId, amount },
    ],
  };

  expenses.unshift(settlementExpense);
}

export function calculateUserShare(
  expense: Expense,
  currentUser: User
) {
  const yourSplit = expense.splits.find(
    s => s.userId === currentUser.id
  );

  if (!yourSplit) return null;

  // YOU paid
  if (expense.paidBy.id === currentUser.id) {
    const othersOwe = expense.splits
      .filter(s => s.userId !== currentUser.id)
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      type: 'owed' as const,
      amount: othersOwe,
    };
  }

  // Someone else paid
  return {
    type: 'owing' as const,
    amount: yourSplit.amount,
  };
}