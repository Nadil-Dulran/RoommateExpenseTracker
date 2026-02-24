export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;

  MainTabs: undefined;

  SettleUp:
    | { mode: 'all' }
    | { mode: 'single'; memberId: string; amount: number };

  Notifications: undefined;
  GroupDetails: { id: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Profile: undefined;
  Activity: undefined;
  Add: undefined;
  Groups: undefined;
  Expenses: undefined;
};