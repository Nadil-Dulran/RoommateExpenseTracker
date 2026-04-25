import { CategoryType } from './expense';

export interface Notification {
  id: string;
  read: boolean;
  type: 'expense_added' | 'expense_settled';
  title?: string;
  date: string;
  message: string;
  data?: Record<string, any>;
  readAt?: string | null;
  groupName: string;
  groupEmoji: string;
  relatedUser: {
    id: string;
    name: string;
    avatar: number; // Using require for images returns a number in React Native
  };
  expense?: {
    category: CategoryType;
    splits: {
      userId: string;
      amount: number;
    }[];
  };
}
