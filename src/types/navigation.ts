import { NavigatorScreenParams } from '@react-navigation/native';

export type SettleUpExpenseSplit = {
  userId: string;
  amount: number;
  name?: string;
};

export type SettleUpExpenseContext = {
  expenseId: string;
  description: string;
  amount: number;
  groupId?: string;
  groupName?: string;
  paidBy: { id: string; name: string };
  splits: SettleUpExpenseSplit[];
};

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;

  MainTabs: NavigatorScreenParams<BottomTabParamList> | undefined;

  SettleUp:
    | { mode: 'all'; groupId?: string }
    | {
        mode: 'single';
        memberId: string;
        amount?: number;
        groupId?: string;
        memberName?: string;
        isYouPaying?: boolean;
        expenseContext?: SettleUpExpenseContext;
      };

  Notifications: undefined;
  GroupDetails: { id: string; group?: any };
  JoinGroup:
    | {
        groupId?: string;
        openGroupDetailsOnSuccess?: boolean;
      }
    | undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Profile: undefined;
  Activity: undefined;
  Add: undefined;
  Groups: undefined;
  Expenses: undefined;
};