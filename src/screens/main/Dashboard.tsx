import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabParamList, RootStackParamList } from '../../types/navigation';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import profileIcon from '../../../assets/ProfileIcon.png';
import { useAppCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { dashboardService } from '../../services/dashboardService';
import { groupsService } from '../../services/groupsService';
import { settlementService } from '../../services/settlementService';
import { CATEGORY_EMOJI_BY_TYPE, DashboardCategory } from '../../constants/emojis';
import { Settlement } from '../../types';
import { extractSettlementsPayload, normalizeSettlement } from '../../utils/settlements';

type DashboardUser = {
  id: string;
  name: string;
  avatarBase64?: string | null;
  currency?: string;
};

type DashboardGroup = {
  id: string;
  name: string;
  emoji?: string;
  balance?: {
    amount: number;
    isYouOwing: boolean;
  };
};

type DashboardExpense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  emoji: string;
  paidBy: {
    id: string;
    name: string;
  };
};

type DashboardData = {
  user: DashboardUser;
  summary: {
    totalOwed: number;
    totalOwing: number;
    totalBalance: number;
  };
  groups: DashboardGroup[];
  recentExpenses: DashboardExpense[];
};

const toSafeNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toSafeString = (value: any, fallback = '') => {
  if (value == null) {
    return fallback;
  }

  const parsed = String(value).trim();
  return parsed || fallback;
};

const getExpenseEmoji = (expense: any) => {
  const directEmojiCandidates = [
    expense?.emoji,
    expense?.categoryEmoji,
    expense?.category_emoji,
    expense?.categoryIcon,
    expense?.category_icon,
    expense?.icon,
    expense?.category?.emoji,
    expense?.category?.icon,
  ];

  const directEmoji = directEmojiCandidates
    .map(value => toSafeString(value))
    .find(value => !!value);

  if (directEmoji) {
    return directEmoji;
  }

  const categoryKey = toSafeString(
    expense?.category ?? expense?.type ?? expense?.categoryType ?? expense?.category_type,
    'other'
  ).toLowerCase() as DashboardCategory;

  return CATEGORY_EMOJI_BY_TYPE[categoryKey] ?? CATEGORY_EMOJI_BY_TYPE.other;
};

const normalizeRecentExpense = (expense: any): DashboardExpense => ({
  id: toSafeString(expense?.id ?? expense?.expenseId ?? expense?.expense_id),
  description: toSafeString(expense?.description ?? expense?.title, 'Expense'),
  amount: toSafeNumber(expense?.amount ?? expense?.total ?? expense?.expense_amount),
  date: toSafeString(
    expense?.date ?? expense?.expense_date ?? expense?.createdAt ?? expense?.created_at,
    new Date(0).toISOString()
  ),
  emoji: getExpenseEmoji(expense),
  paidBy: {
    id: toSafeString(
      expense?.paidBy?.id ?? expense?.paid_by_id ?? expense?.paidById ?? expense?.userId
    ),
    name: toSafeString(
      expense?.paidBy?.name ??
        expense?.paid_by_name ??
        expense?.paidByName ??
        expense?.user?.name,
      'Unknown'
    ),
  },
});

const normalizeDashboardData = (raw: any): DashboardData => {
  const source = raw?.data ?? raw ?? {};
  const user = source?.user ?? {};
  const summary = source?.summary ?? {};
  const groups = Array.isArray(source?.groups) ? source.groups : [];
  const recentExpenses = Array.isArray(source?.recentExpenses)
    ? source.recentExpenses
    : Array.isArray(source?.recent_expenses)
    ? source.recent_expenses
    : [];

  return {
    user: {
      id: toSafeString(user?.id),
      name: toSafeString(user?.name, 'User'),
      avatarBase64: user?.avatarBase64 ?? user?.avatar_base64 ?? user?.avatar ?? null,
      currency: toSafeString(user?.currency),
    },
    summary: {
      totalOwed: toSafeNumber(summary?.totalOwed ?? summary?.total_owed),
      totalOwing: toSafeNumber(summary?.totalOwing ?? summary?.total_owing),
      totalBalance: toSafeNumber(summary?.totalBalance ?? summary?.total_balance),
    },
    groups: groups.map((group: any) => ({
      id: toSafeString(group?.id),
      name: toSafeString(group?.name, 'Untitled Group'),
      emoji: toSafeString(group?.emoji, '👥'),
      balance: {
        amount: toSafeNumber(group?.balance?.amount),
        isYouOwing: Boolean(group?.balance?.isYouOwing),
      },
    })),
    recentExpenses: recentExpenses.map(normalizeRecentExpense),
  };
};

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { formatCurrency } = useAppCurrency();
  const { notifications } = useNotifications();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const toImageUri = (value?: string | null) => {
    if (!value) {
      return null;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue) {
      return null;
    }

    if (normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://')) {
      return normalizedValue;
    }

    if (normalizedValue.startsWith('data:image')) {
      return normalizedValue;
    }

    return `data:image/jpeg;base64,${normalizedValue.replace(/\s/g, '')}`;
  };

  const loadCurrentUserId = useCallback(async () => {
    try {
      const storedUserId =
        (await AsyncStorage.getItem('userId')) ||
        (await AsyncStorage.getItem('user_id'));

      if (storedUserId) {
        setCurrentUserId(String(storedUserId));
      }
    } catch (error) {
      console.log('Failed to load current user id for dashboard', error);
    }
  }, []);

  const loadSettlements = useCallback(async () => {
    const fetchForGroup = async (groupId: number) => {
      try {
        const response = await settlementService.getSettlements(groupId);
        return extractSettlementsPayload(response);
      } catch {
        return [];
      }
    };

    try {
      const groupsResponse = await groupsService.getGroups();
      const groupList: any[] = Array.isArray(groupsResponse)
        ? groupsResponse
        : Array.isArray(groupsResponse?.data)
        ? groupsResponse.data
        : Array.isArray(groupsResponse?.groups)
        ? groupsResponse.groups
        : [];

      const settlementResponses = await Promise.all(
        groupList.map(async group => {
          const groupId = Number(group?.id);
          if (!Number.isFinite(groupId)) {
            return [];
          }

          return fetchForGroup(groupId);
        })
      );

      const normalized = settlementResponses
        .flat()
        .map(item => normalizeSettlement(item))
        .filter(item => !!item.id);

      setSettlements(normalized);
    } catch (error) {
      console.log('Failed to load settlements for dashboard', error);
      setSettlements([]);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const data = await dashboardService.getDashboard();
      setDashboard(normalizeDashboardData(data));
    } catch (error) {
      setDashboard(null);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllDashboardData = useCallback(async () => {
    await Promise.allSettled([
      loadCurrentUserId(),
      loadDashboard(),
      loadSettlements(),
    ]);
  }, [loadCurrentUserId, loadDashboard, loadSettlements]);

  useEffect(() => {
    void loadAllDashboardData();
  }, [loadAllDashboardData]);

  useFocusEffect(
    useCallback(() => {
      void loadAllDashboardData();
    }, [loadAllDashboardData])
  );

  const baseSummary = useMemo(() => {
    return (
      dashboard?.summary ?? {
        totalOwed: 0,
        totalOwing: 0,
        totalBalance: 0,
      }
    );
  }, [dashboard?.summary]);

  const adjustedSummary = useMemo(() => {
    let adjustedBalance = baseSummary.totalBalance;
    let adjustedOwed = baseSummary.totalOwed;
    let adjustedOwing = baseSummary.totalOwing;

    const me = String(currentUserId || '');
    if (!me) {
      return { totalOwed: adjustedOwed, totalOwing: adjustedOwing, totalBalance: adjustedBalance };
    }

    settlements.forEach(settlement => {
      const payerId = String(settlement.payerId || '');
      const receiverId = String(settlement.receiverId || '');
      const amount = Number(settlement.amount || 0);

      if (payerId === me && receiverId) {
        adjustedBalance += amount;
        adjustedOwing -= amount;
      } else if (receiverId === me && payerId) {
        adjustedBalance -= amount;
        adjustedOwed -= amount;
      }
    });

    return {
      totalOwed: Math.max(0, adjustedOwed),
      totalOwing: Math.max(0, adjustedOwing),
      totalBalance: adjustedBalance,
    };
  }, [baseSummary, settlements, currentUserId]);

  const summary = adjustedSummary;

  const recentExpenses = dashboard?.recentExpenses ?? [];
  const baseGroups = useMemo(() => {
    return dashboard?.groups ?? [];
  }, [dashboard?.groups]);

  const groups = useMemo(() => {
    const me = String(currentUserId || '');
    if (!me) {
      return baseGroups;
    }

    return baseGroups.map(group => {
      const groupId = String(group.id || '');
      const groupSettlements = settlements.filter(
        s => String(s.groupId || '') === groupId
      );

      if (groupSettlements.length === 0) {
        return group;
      }

      let adjustedAmount = group.balance?.amount ?? 0;
      const isYouOwing = group.balance?.isYouOwing ?? false;

      groupSettlements.forEach(settlement => {
        const payerId = String(settlement.payerId || '');
        const receiverId = String(settlement.receiverId || '');
        const amount = Number(settlement.amount || 0);

        if (isYouOwing && payerId === me && receiverId) {
          adjustedAmount -= amount;
        } else if (!isYouOwing && receiverId === me && payerId) {
          adjustedAmount -= amount;
        }
      });

      return {
        ...group,
        balance: {
          amount: Math.max(0, adjustedAmount),
          isYouOwing: group.balance?.isYouOwing ?? false,
        },
      };
    });
  }, [baseGroups, settlements, currentUserId]);

  const currentUser = dashboard?.user;
  const avatarUri = toImageUri(currentUser?.avatarBase64);
  const avatarSource: ImageSourcePropType = avatarUri ? { uri: avatarUri } : profileIcon;
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009966" />
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              Welcome back, {currentUser?.name ?? 'there'}!
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellWrapper}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={24} color="#6a7282" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={avatarSource}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#101828', '#1e2939']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Icon name="credit-card" size={16} color="#99A1AF" />
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>

          <Text style={styles.balanceAmount}>
            {formatCurrency(summary.totalBalance, { signed: true })}
          </Text>

          <View style={styles.balanceRow}>
            <View style={styles.subCard}>
              <Text style={styles.owedLabel}>You are owed</Text>
              <Text style={styles.owedAmount}>
                {formatCurrency(summary.totalOwed)}
              </Text>
            </View>

            <View style={styles.subCard}>
              <Text style={styles.oweLabel}>You owe</Text>
              <Text style={styles.oweAmount}>
                {formatCurrency(summary.totalOwing)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Settle Button */}
        <TouchableOpacity
          style={styles.settleButton}
          onPress={() => navigation.navigate('SettleUp', { mode: 'all' })}
        >
          <Icon name="dollar-sign" size={18} color="#007a55" />
          <Text style={styles.settleText}>Settle All Debts</Text>
        </TouchableOpacity>

        {/* Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {groups.map(group => {
          const balance = group.balance ?? { amount: 0, isYouOwing: false };

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetails', { id: group.id })}
            >
              <View style={styles.groupLeft}>
                <View style={styles.emojiBox}>
                  <Text style={styles.emoji}>{group.emoji ?? '👥'}</Text>
                </View>

                <Text style={styles.groupName}>{group.name}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.balanceType,
                    {
                      color: balance.isYouOwing ? '#ff2056' : '#009966',
                    },
                  ]}
                >
                  {balance.isYouOwing ? 'you owe' : 'owes you'}
                </Text>

                <Text
                  style={[
                    styles.groupAmount,
                    {
                      color: balance.isYouOwing ? '#ff2056' : '#009966',
                    },
                  ]}
                >
                  {formatCurrency(balance.amount)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Recent Activity
        </Text>

        {recentExpenses.map(expense => {
          return (
            <TouchableOpacity
              key={expense.id}
              style={styles.activityCard}
              onPress={() => navigation.navigate('Activity')}
            >
              <View style={styles.groupLeft}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{expense.emoji}</Text>
                </View>

                <View>
                  <Text style={styles.groupName}>
                    {expense.description}
                  </Text>
                  <Text style={styles.activitySub}>
                    {expense.paidBy.name} paid
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.activityAmount}>
                  {formatCurrency(expense.amount)}
                </Text>
                <Text style={styles.activitySub}>
                  {new Date(expense.date).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {!!errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },

  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#101828',
  },

  subtitle: {
    fontSize: 14,
    color: '#6a7282',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  bellWrapper: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff2056',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: '#F3F4F6',
    borderWidth: 1,
  },

  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  balanceLabel: {
    color: '#99A1AF',
    fontSize: 14,
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },

  balanceRow: {
    flexDirection: 'row',
    gap: 10,
  },

  subCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 14,
  },

  owedLabel: { color: '#009966', fontSize: 12 },
  oweLabel: { color: '#ff2056', fontSize: 12 },

  owedAmount: {
    color: '#009966',
    fontSize: 18,
    fontWeight: '600',
  },

  oweAmount: {
    color: '#ff2056',
    fontSize: 18,
    fontWeight: '600',
  },

  settleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderColor: '#d0fae5',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },

  settleText: {
    color: '#007a55',
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101828',
  },

  seeAll: {
    color: '#009966',
    fontWeight: '500',
  },

  groupCard: {
    marginRight: 1,
    marginLeft: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 2,
  },

  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emoji: {
    fontSize: 22,
  },

  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },

  balanceType: {
    fontSize: 14,
    fontWeight: '700',
  },

  groupAmount: {
    fontSize: 18,
    fontWeight: '700',
  },

  activityCard: {
    marginRight: 1,
    marginLeft: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    elevation: 2,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 20,
  },

  activitySub: {
    fontSize: 12,
    color: '#99A1AF',
  },

  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101828',
  },

  errorCard: {
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
});