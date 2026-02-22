import { User } from './user';

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  balance: number;
  balanceType: 'owed' | 'owing';
  members: User[];
}
