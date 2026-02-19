import { Expense, Group, User } from '../types';

export const currentUser: User = {
  id: '1',
  name: 'John Doe',
};

export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Trip',
    emoji: '🏝️',
    members: [currentUser],
  },
];

export const expenses: Expense[] = [
  {
    id: 'e1',
    description: 'Dinner',
    amount: 120,
    date: new Date().toISOString(),
    groupId: 'g1',
    paidBy: currentUser,
    splits: [
      { userId: '1', amount: 60 },
      { userId: '2', amount: 60 },
    ],
  },
];
