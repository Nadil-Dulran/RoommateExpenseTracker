import { Expense, Settlement } from './index';

export type FilterOption = 'all' | 'week' | 'month';

export type GroupMember = {
  id: string;
  name: string;
};

export type BackendGroup = {
  id: string;
  name: string;
  emoji: string;
  createdAt?: string;
  members: GroupMember[];
};

export type TimelineEntry = {
  id: string;
  kind: 'expense' | 'settlement' | 'group_created';
  date: string;
  sortTime: number;
  orderId: number;
  expense?: Expense;
  group?: BackendGroup;
  settlement?: Settlement;
};