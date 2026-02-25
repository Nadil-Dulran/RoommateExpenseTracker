
export type CategoryType = 'food' | 'travel' | 'utilities';

export interface Notification {
  id: string;
  read: boolean;
  type: 'expense_added' | 'expense_settled';
  date: string;
  message: string;
  groupName: string;
  groupEmoji: string;
  relatedUser: {
    id: string;
    name: string;
    avatar: string;
  };
  expense?: {
    category: CategoryType;
    splits: {
      userId: string;
      amount: number;
    }[];
  };
}
