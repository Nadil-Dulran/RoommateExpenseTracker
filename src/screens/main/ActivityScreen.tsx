import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Expense, Settlement } from '../../types';
import { useAppCurrency } from '../../context/CurrencyContext';
import { expensesService } from '../../services/expensesService';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { normalizeExpense, sortRawExpensesByLatest } from '../../utils/expenses';
import { settlementService } from '../../services/settlementService';
import { extractSettlementExpenseId, extractSettlementsPayload, normalizeSettlement } from '../../utils/settlements';
import { DAY_IN_MS, EARLIEST_ISO, extractMembersPayload, ensureDateValue, normalizeGroupInfo, roundCurrency, safeTimestamp,
  compareTimelineEntries,
  extractNumericOrderFromId,
  normalizeMember,
} from '../../utils/activity';
import { FilterOption, BackendGroup, TimelineEntry } from '../../types/activity';
import GroupActivityCard from '../../components/activity/GroupActivityCard';
import SettlementActivityCard from '../../components/activity/SettlementActivityCard';
import ExpenseActivityCard from '../../components/activity/ExpenseActivityCard';
import { styles } from './styles/Main.styles';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export default function ActivityScreen() {
  const navigation = useNavigation<NavigationProps>();
  const { formatCurrency } = useAppCurrency();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [backendGroups, setBackendGroups] = useState<BackendGroup[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const latestLoadIdRef = useRef(0);
  const latestExpenseLoadIdRef = useRef(0);

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
      const groupsWithMembers: BackendGroup[] = await Promise.all(
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
    const expenseLoadId = latestExpenseLoadIdRef.current + 1;
    latestExpenseLoadIdRef.current = expenseLoadId;

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
      const rawList = await loadByGroups();
      const normalized = sortRawExpensesByLatest(rawList)
          .map(item => normalizeExpense(item))
          .filter(item => !!item.id);
  if (latestExpenseLoadIdRef.current === expenseLoadId) {
    setExpenses(normalized);
  }
    } catch (error) {
      console.log('Failed to load activity expenses directly', error);
      try {
        const fallbackList = await loadByGroups();
        const normalized = sortRawExpensesByLatest(fallbackList)
          .map(item => normalizeExpense(item))
          .filter(item => !!item.id);
        if (latestExpenseLoadIdRef.current === expenseLoadId) {
          setExpenses(normalized);
        }
      } catch (fallbackError) {
        console.log('Failed to load activity expenses via group fallback', fallbackError);
        if (latestExpenseLoadIdRef.current === expenseLoadId) {
          setExpenses([]);
        }
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

  const loadInitialData = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      const loadId = latestLoadIdRef.current + 1;
      latestLoadIdRef.current = loadId;

      if (mode === 'initial') {
        setRefreshing(false);
      } else {
        setRefreshing(true);
      }

      await Promise.allSettled([
        loadCurrentUserId(),
        loadGroups(),
        loadExpenses(),
        loadSettlements(),
      ]);

      if (latestLoadIdRef.current === loadId) {
        setRefreshing(false);
      }
    },
    [loadCurrentUserId, loadGroups, loadExpenses, loadSettlements]
  );

  useEffect(() => {
    loadInitialData('initial');
  }, [loadInitialData]);

  useFocusEffect(
    useCallback(() => {
      loadInitialData('refresh');
    }, [loadInitialData])
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
      const normalizedDate =
        ensureDateValue(expense.createdAt) ??
        ensureDateValue(expense.date) ??
        EARLIEST_ISO;
      entries.push({
        id: `expense-${expense.id}-${expense.groupId}-${normalizedDate}`,
        kind: 'expense',
        date: normalizedDate,
        sortTime: safeTimestamp(normalizedDate),
        orderId: extractNumericOrderFromId(expense.id),
        expense,
      });
    });

    settlements.forEach(settlement => {
      const normalizedDate =
        ensureDateValue(settlement.createdAt) ??
        EARLIEST_ISO;

      entries.push({
        id: `settlement-${settlement.id}-${settlement.groupId}-${normalizedDate}`,
        kind: 'settlement',
        date: normalizedDate,
        sortTime: safeTimestamp(normalizedDate),
        orderId: extractNumericOrderFromId(settlement.id),
        settlement,
      });
    });

    backendGroups.forEach(group => {
      const normalizedDate = ensureDateValue(group.createdAt) ?? EARLIEST_ISO;

      entries.push({
        id: `group-${group.id}-${normalizedDate}`,
        kind: 'group_created',
        date: normalizedDate,
        sortTime: safeTimestamp(normalizedDate),
        orderId: extractNumericOrderFromId(group.id),
        group,
      });
    });

    return entries.sort(compareTimelineEntries);
  }, [expenses, settlements, backendGroups]);

    const filteredTimeline = useMemo(() => {
      if (filter === 'all') {
        return timelineEntries;
      }

      const windowDays = filter === 'week' ? 7 : 30;
      const boundary = Date.now() - windowDays * DAY_IN_MS;

      return timelineEntries.filter(entry => {
        const timestamp = safeTimestamp(entry.date);
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

      return Array.from(map.entries()).map(([date, items]) => ({
        date,
        items: [...items].sort(compareTimelineEntries),
      }));
    }, [filteredTimeline]);

  const settledExpenseIds = useMemo(() => {
    const settledIds = new Set<string>();

    settlements.forEach(settlement => {
      const parsed = extractSettlementExpenseId(settlement);
      if (parsed) {
        settledIds.add(parsed);
      }
    });

    return settledIds;
  }, [settlements]);

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

  const renderEntry = (entry: TimelineEntry) => {

    if (entry.kind === 'group_created') {
      return <GroupActivityCard 
      key={entry.id}
      entry={entry}/>;
    }

    if (entry.kind === 'settlement') {
      return <SettlementActivityCard
      key={entry.id}
      entry={entry}
      expenses={expenses}
      groupMap={groupMap}
      formatCurrency={formatCurrency}
      formatParticipantName={formatParticipantName}/>;
    }

    return (<ExpenseActivityCard
     key={entry.id}
     entry={entry}
     navigation={navigation}
     groupMap={groupMap}
     currentUserId={currentUserId}
     settledExpenseIds={settledExpenseIds}
     formatCurrency={formatCurrency}
     getShareForExpense={getShareForExpense}/>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadInitialData('refresh')} />
        }
      >
        <View style={styles.header}>
          <Text style={{...styles.title, marginBottom: 10}}>Activity</Text>

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

        <View style={styles.contentWrap}>
          {groupedTimeline.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No activity yet. Come back after tracking expenses.</Text>
            </View>
          ) : (
            groupedTimeline.map(({ date, items }) => (
              <View key={date} style={styles.daySection}>
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
