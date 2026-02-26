
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
