export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;

  MainTabs: undefined;

  SettleUp:
    | { mode: 'all'; groupId?: string }
    | {
        mode: 'single';
        memberId: string;
        amount?: number;
        groupId?: string;
        memberName?: string;
        isYouPaying?: boolean;
      };

  Notifications: undefined;
  GroupDetails: { id: string; group?: any };
};

export type BottomTabParamList = {
  Home: undefined;
  Profile: undefined;
  Activity: undefined;
  Add: undefined;
  Groups: undefined;
  Expenses: undefined;
};