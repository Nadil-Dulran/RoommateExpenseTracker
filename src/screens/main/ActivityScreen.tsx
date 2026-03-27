import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { RootStackParamList } from '../../types/navigation';
import { Expense, Settlement } from '../../types';
import { useAppCurrency } from '../../context/CurrencyContext';
import { expensesService } from '../../services/expensesService';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import {
  extractExpensesPayload,
  normalizeExpense,
  sortRawExpensesByLatest,
} from '../../utils/expenses';
import { categories } from '../../data/mockData';
import { settlementService } from '../../services/settlementService';
import {
  extractSettlementsPayload,
  normalizeSettlement,
} from '../../utils/settlements';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
type FilterOption = 'all' | 'week' | 'month';

type GroupMember = { id: string; name: string };

type BackendGroup = {
  id: string;
  name: string;
  emoji: string;
  createdAt?: string;
  members: GroupMember[];
};

type TimelineEntry = {
  id: string;
  kind: 'expense' | 'settlement' | 'group_created';
  date: string;
  expense?: Expense;
  group?: BackendGroup;
  settlement?: Settlement;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const ensureDateValue = (value: any): string | undefined => {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(String(value));
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
};

const resolveGroupTimestamp = (group: any) => {
  const candidates = [
    group?.createdAt,
    group?.created_at,
    group?.createdOn,
    group?.created_on,
    group?.created,
    group?.createdDate,
    group?.created_date,
    group?.createdTime,
    group?.created_time,
    group?.createdTimestamp,
    group?.created_timestamp,
    group?.updatedAt,
    group?.updated_at,
  ];

  for (const candidate of candidates) {
    const normalized = ensureDateValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const extractMembersPayload = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.members)) {
    return data.members;
  }

  return [];
};

const normalizeMember = (member: any): GroupMember => ({
  id: String(member?.id ?? member?.user_id ?? member?.userId ?? ''),
  name:
    member?.name ??
    member?.user?.name ??
    member?.full_name ??
    'Member',
});

const normalizeGroupInfo = (group: any): BackendGroup => ({
  id: String(group?.id ?? ''),
  name: group?.name || 'Untitled Group',
  emoji: group?.emoji || '👥',
  createdAt: resolveGroupTimestamp(group),
  members: Array.isArray(group?.members)
    ? group.members.map(normalizeMember)
    : Array.isArray(group?.users)
    ? group.users.map(normalizeMember)
    : [],
});

const roundCurrency = (value: number) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

export default function ActivityScreen() {
  const navigation = useNavigation<NavigationProps>();
  const { formatCurrency } = useAppCurrency();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [backendGroups, setBackendGroups] = useState<BackendGroup[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const loadCurrentUserId = useCallback(async () => {
    try {
      const storedUserId =
        (await AsyncStorage.getItem('userId')) ??
        (await AsyncStorage.getItem('user_id'));

      if (storedUserId) {
        setCurrentUserId(String(storedUserId));
      } else {
        setCurrentUserId('');
      }
    } catch (error) {
      console.log('Failed to load current user id for activity', error);
      setCurrentUserId('');
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const groupsResponse = await groupsService.getGroups();
      const groupList: any[] = Array.isArray(groupsResponse)
        ? groupsResponse
        : Array.isArray(groupsResponse?.data)
        ? groupsResponse.data
        : Array.isArray(groupsResponse?.groups)
        ? groupsResponse.groups
        : [];

      const baseGroups = groupList.map(normalizeGroupInfo);
      const groupsWithMembers = await Promise.all(
        baseGroups.map(async group => {
          try {
            const membersResponse = await groupMembersService.getMembers(group.id);
            const members = extractMembersPayload(membersResponse).map(normalizeMember);
            return { ...group, members: members.length > 0 ? members : group.members };
          } catch {
            return group;
          }
        })
      );

      setBackendGroups(groupsWithMembers);
    } catch (error) {
      console.log('Failed to load groups for activity', error);
      setBackendGroups([]);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    const loadByGroups = async () => {
      const groupsResponse = await groupsService.getGroups();
      const groupList: any[] = Array.isArray(groupsResponse)
        ? groupsResponse
        : Array.isArray(groupsResponse?.data)
        ? groupsResponse.data
        : Array.isArray(groupsResponse?.groups)
        ? groupsResponse.groups
        : [];

      const groupedExpenses = await Promise.all(
        groupList.map(async (group: any) => {
          const groupId = Number(group?.id);
          if (!Number.isFinite(groupId)) {
            return [];
          }

          try {
            return await expensesService.getExpenses(groupId);
          } catch {
            return [];
          }
        })
      );

      return groupedExpenses.flat();
    };

    try {
      const response = await expensesService.getExpenses();
      const directList = extractExpensesPayload(response);
      const rawList = directList.length > 0 ? directList : await loadByGroups();
      const normalized = sortRawExpensesByLatest(rawList)
        .map(item => normalizeExpense(item))
        .filter(item => !!item.id);

      setExpenses(normalized);
    } catch (error) {
      console.log('Failed to load activity expenses directly', error);
      try {
        const fallbackList = await loadByGroups();
        const normalized = sortRawExpensesByLatest(fallbackList)
          .map(item => normalizeExpense(item))
          .filter(item => !!item.id);
        setExpenses(normalized);
      } catch (fallbackError) {
        console.log('Failed to load activity expenses via group fallback', fallbackError);
        setExpenses([]);
      }
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

      normalized.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setSettlements(normalized);
    } catch (error) {
      console.log('Failed to load settlements for activity', error);
      setSettlements([]);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCurrentUserId(), loadGroups(), loadExpenses(), loadSettlements()]);
    setLoading(false);
  }, [loadCurrentUserId, loadGroups, loadExpenses, loadSettlements]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const groupMap = useMemo(() => {
    const entries = new Map<string, BackendGroup>();
    backendGroups.forEach(group => {
      entries.set(String(group.id), group);
    });
    return entries;
  }, [backendGroups]);

  const timelineEntries = useMemo(() => {
    const entries: TimelineEntry[] = [];

    expenses.forEach(expense => {
      const normalizedDate = ensureDateValue(expense.date);
      if (!normalizedDate) {
        return;
      }
      entries.push({
        id: `expense-${expense.id}`,
        kind: 'expense',
        date: normalizedDate,
        expense,
      });
    });

    settlements.forEach(settlement => {
      const normalizedDate = ensureDateValue(settlement.createdAt);
      if (!normalizedDate) {
        return;
      }

      entries.push({
        id: `settlement-${settlement.id}`,
        kind: 'settlement',
        date: normalizedDate,
        settlement,
      });
    });

    backendGroups.forEach(group => {
      const normalizedDate = ensureDateValue(group.createdAt);
      if (!normalizedDate) {
        return;
      }

      entries.push({
        id: `group-${group.id}`,
        kind: 'group_created',
        date: normalizedDate,
        group,
      });
    });

    return entries
      .filter(entry => Number.isFinite(Date.parse(entry.date)))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [expenses, settlements, backendGroups]);

    const filteredTimeline = useMemo(() => {
      const validEntries = timelineEntries.filter(entry =>
        Number.isFinite(Date.parse(entry.date))
      );

      if (filter === 'all') {
        return validEntries;
      }

      const windowDays = filter === 'week' ? 7 : 30;
      const boundary = Date.now() - windowDays * DAY_IN_MS;

      return validEntries.filter(entry => {
        const timestamp = Date.parse(entry.date);
        if (!Number.isFinite(timestamp)) {
          return false;
        }
        return timestamp >= boundary;
      });
    }, [timelineEntries, filter]);

    const groupedTimeline = useMemo(() => {
      const map = new Map<string, TimelineEntry[]>();

      filteredTimeline.forEach(entry => {
        const label = new Date(entry.date).toDateString();
        const bucket = map.get(label);

        if (bucket) {
          bucket.push(entry);
        } else {
          map.set(label, [entry]);
        }
      });

      return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
    }, [filteredTimeline]);

  const getShareForExpense = useCallback(
    (expense: Expense) => {
      if (!currentUserId) {
        return null;
      }

      const splits = Array.isArray(expense.splits) ? expense.splits : [];
      const normalizedSplits = splits.map(split => ({
        userId: String(split.userId ?? ''),
        amount: Number(split.amount ?? 0),
      }));

      const payerId = String(expense.paidBy?.id ?? '');

      if (payerId === String(currentUserId)) {
        const owed = normalizedSplits
          .filter(split => split.userId !== String(currentUserId))
          .reduce((sum, split) => sum + split.amount, 0);

        if (owed <= 0) {
          return null;
        }

        return { type: 'owed' as const, amount: roundCurrency(owed) };
      }

      const mySplit = normalizedSplits.find(split => split.userId === String(currentUserId));
      if (!mySplit || mySplit.amount <= 0) {
        return null;
      }

      return { type: 'owing' as const, amount: roundCurrency(mySplit.amount) };
    },
    [currentUserId]
  );

  const formatParticipantName = useCallback(
    (userId: string, fallback: string) => {
      if (!userId) {
        return fallback;
      }

      return String(userId) === String(currentUserId) ? 'You' : fallback;
    },
    [currentUserId]
  );

  const renderGroupActivity = (entry: TimelineEntry) => {
    if (!entry.group) {
      return null;
    }

    const memberCount = entry.group.members.length;

    return (
      <View key={entry.id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{entry.group.emoji}</Text>
            </View>

            <View>
              <Text style={styles.expenseTitle}>{entry.group.name}</Text>
              <Text style={styles.groupText}>New group created</Text>
              <Text style={styles.subText}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'} joined
              </Text>
            </View>
          </View>

          <Text style={styles.amount}>New</Text>
        </View>
      </View>
    );
  };

  const renderExpenseActivity = (entry: TimelineEntry) => {
    if (!entry.expense) {
      return null;
    }

    const expense = entry.expense;
    const group = groupMap.get(String(expense.groupId));
    const category = categories[expense.category] ?? categories.other;
    const share = getShareForExpense(expense);

    const splits = Array.isArray(expense.splits) ? expense.splits : [];
    const normalizedSplits = splits
      .map(split => ({
        userId: String(split.userId ?? ''),
        amount: Number(split.amount ?? 0),
      }))
      .filter(split => !!split.userId);

    const payerName =
      expense.paidBy?.name && expense.paidBy.name !== 'Unknown'
        ? expense.paidBy.name
        : group?.members.find(member => member.id === String(expense.paidBy?.id))?.name ||
          `Member ${expense.paidBy?.id}`;

    const isMyExpense = String(expense.paidBy?.id) === String(currentUserId);
    const counterpartyId = isMyExpense
      ? normalizedSplits.find(split => split.userId !== String(currentUserId))?.userId ?? ''
      : String(expense.paidBy?.id ?? '');

    const counterpartyName =
      group?.members.find(member => member.id === counterpartyId)?.name ??
      (isMyExpense && counterpartyId ? `Member ${counterpartyId}` : payerName);

    const splitParticipantsForSettle = normalizedSplits.map(split => ({
      userId: split.userId,
      amount: roundCurrency(split.amount),
      name:
        split.userId === String(currentUserId)
          ? 'You'
          : split.userId === String(expense.paidBy?.id)
          ? payerName
          : group?.members.find(member => member.id === split.userId)?.name ??
            `Member ${split.userId}`,
    }));

    const canSettle =
      !!share &&
      entry.kind !== 'settlement' &&
      share.amount >= 0.01 &&
      !!counterpartyId &&
      !!expense.groupId;

    return (
      <View key={entry.id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{category.icon}</Text>
            </View>

            <View>
              <Text style={styles.expenseTitle}>{expense.description}</Text>

              {group && (
                <Text style={styles.groupText}>
                  {group.emoji} {group.name}
                </Text>
              )}

              <Text style={styles.subText}>
                {payerName} paid • Split {normalizedSplits.length || 1}{' '}
                {normalizedSplits.length === 1 ? 'way' : 'ways'}
              </Text>
            </View>
          </View>

          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        </View>

        {share && (
          <View style={styles.shareRow}>
            <Text
              style={[
                styles.shareText,
                share.type === 'owed' ? { color: '#009966' } : { color: '#ff2056' },
              ]}
            >
              {share.type === 'owed'
                ? `You're owed ${formatCurrency(share.amount)}`
                : `You owe ${formatCurrency(share.amount)}`}
            </Text>

            {canSettle && (
              <TouchableOpacity
                style={styles.settleBtn}
                onPress={() =>
                  navigation.navigate('SettleUp', {
                    mode: 'single',
                    memberId: counterpartyId,
                    amount: share.amount,
                    memberName: counterpartyName,
                    isYouPaying: share.type === 'owing',
                    groupId: String(expense.groupId),
                    expenseContext: {
                      expenseId: String(expense.id),
                      description: expense.description,
                      amount: roundCurrency(expense.amount),
                      groupId: String(expense.groupId),
                      groupName: group?.name,
                      paidBy: { id: String(expense.paidBy?.id ?? ''), name: payerName },
                      splits: splitParticipantsForSettle,
                    },
                  })
                }
              >
                <Text style={styles.settleBtnText}>Settle Up</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSettlementActivity = (entry: TimelineEntry) => {
    if (!entry.settlement) {
      return null;
    }

    const settlement = entry.settlement;
    const group = groupMap.get(String(settlement.groupId));
    const payerName = formatParticipantName(settlement.payerId, settlement.payerName);
    const receiverName = formatParticipantName(settlement.receiverId, settlement.receiverName);
    const methodLabel =
      settlement.method === 'BANK'
        ? 'Bank'
        : settlement.method === 'UPI'
        ? 'UPI'
        : 'Cash';
    const notes = settlement.notes?.trim();

    return (
      <View key={entry.id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconBox, styles.settlementIconBox]}>
              <Icon name="repeat" size={18} color="#16a34a" />
            </View>

            <View>
              <Text style={styles.expenseTitle}>Settlement recorded</Text>
              {group && (
                <Text style={styles.groupText}>
                  {group.emoji} {group.name}
                </Text>
              )}
              <Text style={styles.subText}>
                {payerName} paid {receiverName}
              </Text>
            </View>
          </View>

          <Text style={[styles.amount, { color: '#16a34a' }]}>
            {formatCurrency(settlement.amount)}
          </Text>
        </View>

        <View style={styles.participantRow}>
          <Text style={styles.participantText}>{payerName}</Text>
          <Icon name="arrow-right" size={16} color="#6a7282" />
          <Text style={styles.participantText}>{receiverName}</Text>
        </View>

        <View style={styles.settlementMetaRow}>
          <View style={styles.methodPill}>
            <Text style={styles.methodText}>{methodLabel}</Text>
          </View>
          {notes ? <Text style={styles.notesText}>{notes}</Text> : null}
        </View>
      </View>
    );
  };

  const renderEntry = (entry: TimelineEntry) => {
    if (entry.kind === 'group_created') {
      return renderGroupActivity(entry);
    }

    if (entry.kind === 'settlement') {
      return renderSettlementActivity(entry);
    }

    return renderExpenseActivity(entry);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>

          <View style={styles.filterRow}>
            {(['all', 'week', 'month'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilter(type)}
                style={[styles.filterButton, filter === type && styles.filterActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === type && styles.filterTextActive,
                  ]}
                >
                  {type === 'all' ? 'All Time' : type === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#009966" size="large" />
            </View>
          ) : groupedTimeline.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No activity yet. Come back after tracking expenses.</Text>
            </View>
          ) : (
            groupedTimeline.map(({ date, items }) => (
              <View key={date} style={{ marginBottom: 24 }}>
                <Text style={styles.dateHeader}>{date}</Text>
                {items.map(entry => renderEntry(entry))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginTop: 6,
  },
  filterActive: {
    backgroundColor: '#009966',
  },
  filterText: {
    fontSize: 14,
    color: '#6a7282',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7282',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settlementIconBox: {
    backgroundColor: '#ecfdf3',
  },
  icon: {
    fontSize: 20,
  },
  expenseTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#101828',
  },
  groupText: {
    fontSize: 12,
    color: '#99a1af',
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 2,
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
    color: '#101828',
  },
  shareRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settleBtn: {
    backgroundColor: '#009966',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  settledBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settledText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  participantText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
  },
  settlementMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  methodPill: {
    borderRadius: 999,
    backgroundColor: '#ecfdf3',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  methodText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 12,
    color: '#6a7282',
    flex: 1,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6a7282',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});