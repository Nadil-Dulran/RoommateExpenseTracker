import { User } from './user';

export interface Split {
  userId: string;
  amount: number;
  percentage?: number;
}

export type CategoryType = 'food' | 'travel' | 'utilities' | 'shopping' | 'entertainment' | 'other';

export interface Expense {
  id: string;
  category: CategoryType;
  description: string;
  amount: number;
  date: string;    
  groupId: string;
  paidBy: User;
  splits: Split[];
  splitType?: 'equal' | 'exact' | 'percentage';
  createdAt?: string;
  updatedAt?: string;
}
