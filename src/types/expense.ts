import { User } from './user';

export interface Split {
  userId: string;
  amount: number;
  percentage?: number;
}

export type CategoryType = 'food' | 'transport' | 'bills' | 'shopping' | 'entertainment' | 'other';

export interface Expense {
  id: string;
  category: CategoryType;
  categoryLabel?: string;
  categoryEmoji?: string;
  description: string;
  amount: number;
  date: string;    
  groupId: string;
  paidBy: User;
  splits: Split[];
  splitType?: 'equal' | 'exact' | 'percentage';
  createdAt?: string;
  updatedAt?: string;
  originalExpenseDateField?: 'date' | 'expense_date' | 'expenseDate';
  originalExpenseDate?: string;
}
