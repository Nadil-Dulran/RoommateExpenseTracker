import { Expense, Group, User, Notification } from '../types';
import { CategoryType } from '../types/expense';


export const currentUser: User = {
  id: '1',
  name: 'John Doe',
};
export const user2: User = {
  id: '2',
  name: 'Sarah',
};

export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Trip',
    emoji: '🏝️',
    balance: 50,
    balanceType: 'owed',
    members: [currentUser, user2],
  },
];

export const expenses: Expense[] = [
  {
    id: 'e1',
    category: 'food',
    description: 'Dinner',
    amount: 120,
    date: new Date().toISOString(),
    groupId: 'g1',
    paidBy: user2,
    splits: [
      { userId: '1', amount: 60 },
      { userId: '2', amount: 80 },
    ],
  },
];

export const notifications: Notification[] = [
  { id: '1', read: false },
  { id: '2', read: true },
];

export const categories: Record<CategoryType, { icon: string }> = {
  food: { icon: '🍔' },
  travel: { icon: '✈️' },
  utilities: { icon: '🧾' },
};