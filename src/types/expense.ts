import { User } from './user';

export interface Split {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;    
  groupId: string;
  paidBy: User;
  splits: Split[];
  createdAt?: string;
  updatedAt?: string;
}
