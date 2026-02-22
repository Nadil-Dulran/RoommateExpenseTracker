import { User } from './user';

export interface Split {
  userId: string;
  amount: number;
}

export type CategoryType = 'food' | 'travel' | 'utilities';

export interface Expense {
  id: string;
  category: CategoryType;
  description: string;
  amount: number;
  date: string;    
  groupId: string;
  paidBy: User;
  splits: Split[];
  createdAt?: string;
  updatedAt?: string;
}
