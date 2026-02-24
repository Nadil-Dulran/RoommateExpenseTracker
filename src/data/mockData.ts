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
    members: [currentUser, user2],
  },
];

export const expenses: Expense[] = [
  {
    id: 'e1',
    category: 'food',
    description: 'Dinner',
    amount: 120,
    date: '2026-02-23T12:00:00Z',
    groupId: 'g1',
    paidBy: user2,
    splits: [
      { userId: '1', amount: 60 },
      { userId: '2', amount: 60 },
    ],
  },
];

export const notifications: Notification[] = [
  { id: '1', read: false },
  { id: '2', read: true },
  { id: '3', read: false },
  { id: '4', read: false },
];

export const categories: Record<CategoryType, { icon: string }> = {
  food: { icon: '🍔' },
  travel: { icon: '✈️' },
  utilities: { icon: '🧾' },
};

//new Date().toISOString(),