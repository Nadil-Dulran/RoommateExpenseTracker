import { Expense, Group, User, Notification } from '../types';
import { CategoryType } from '../types/expense';
import profileIcon from '../../assets/ProfileIcon.png';


export const currentUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: profileIcon,
};

export const user2: User = {
  id: '2',
  name: 'Sarah',
  avatar: profileIcon,
};

export const user3: User = {
  id: '3',
  name: 'Mike',
  avatar: profileIcon,
};


export const groups: Group[] = [
  {
    id: 'g1',
    name: 'Trip',
    emoji: '🏝️',
    members: [currentUser, user2, user3],
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
  {
    id: '1',
    read: false,
    type: 'expense_added',
    date: '2026-02-23T12:00:00Z',
    message: 'added you to "Dinner"',
    groupName: 'Trip',
    groupEmoji: '🏝️',
    relatedUser: {
      id: '2',
      name: 'Sarah',
      avatar: profileIcon,
    },
    expense: {
      category: 'food',
      splits: [
        { userId: '1', amount: 60 },
        { userId: '2', amount: 60 },
      ],
    },
  },
  {
    id: '2',
    read: true,
    type: 'expense_settled',
    date: '2026-02-22T12:00:00Z',
    message: 'settled up "Dinner"',
    groupName: 'Trip',
    groupEmoji: '🏝️',
    relatedUser: {
      id: '2',
      name: 'Sarah',
      avatar: profileIcon,
    },
    expense: {
      category: 'utilities',
      splits: [
        { userId: '1', amount: 60 },
        { userId: '2', amount: 60 },
      ],
    },
  },
];


export const categories: Record<CategoryType, { icon: string; name: string }> = {
  food: { icon: '🍔', name: 'Food' },
  travel: { icon: '🚗', name: 'Transport' },
  shopping: { icon: '🛍️', name: 'Shopping' },
  utilities: { icon: '🧾', name: 'Bills' },
  entertainment: { icon: '🎬', name: 'Entertainment' },
  other: { icon: '📌', name: 'Other' },
};

//new Date().toISOString(),