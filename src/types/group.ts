import { User } from './user';

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  members: User[];
}
