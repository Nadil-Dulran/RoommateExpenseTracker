import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { RootStackParamList } from '../../types/navigation';
import { Expense } from '../../types';
import { expensesService } from '../../services/expensesService';
import { groupMembersService } from '../../services/groupMembersService';

type RouteProps = RouteProp<RootStackParamList, 'SettleUp'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

type MemberBalance = {
  id: string;
  name: string;
  amount: number;
  isYouPaying: boolean;
  groupId?: string;
};

type GroupMember = {
  id: string;
  name: string;
};

const roundCurrency = (value: number) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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
  id: String(
    member.id ??
      ''
  ),
  name:
    member.name ??
    'Member',
});

const normalizeExpense = (raw: any): Expense => {
  const getSplitUserId = (split: any) => {
    return String(
        split.user_id ??
        ''
    );
  };

  const getSplitAmount = (split: any) => {
    return Number(
      split.share_amount ??
        0
    );
  };

  const splitsRaw = Array.isArray(raw?.splits)
    ? raw.splits
    : Array.isArray(raw?.expenseSplits)
    ? raw.expenseSplits
    : Array.isArray(raw?.expense_splits)
    ? raw.expense_splits
    : Array.isArray(raw?.splitDetails)
    ? raw.splitDetails
    : Array.isArray(raw?.split_details)
    ? raw.split_details
    : [];

  const paidById = String(
      raw.paid_by ??
      ''
  );

  return {
    id: String(raw?.id ?? raw?.expenseId ?? raw?.expense_id ?? ''),
    category: String(raw?.category ?? raw?.type ?? 'other').toLowerCase() as Expense['category'],
    description: raw?.description ?? raw?.title ?? 'Expense',
    amount: Number(raw?.amount ?? raw?.total ?? raw?.expense_amount ?? 0),
    date: String(
      raw?.date ??
        raw?.expense_date ??
        raw?.createdAt ??
        raw?.created_at ??
        new Date().toISOString()
    ),
    groupId: String(raw?.groupId ?? raw?.group_id ?? raw?.group?.id ?? ''),
    paidBy: {
      id: paidById,
      name:
        raw?.paidByUser?.name ??
        raw?.paid_by_user?.name ??
        raw?.paidBy?.name ??
        raw?.paid_by_name ??
        raw?.paidByName ??
        'Unknown',
    },
    splits: splitsRaw
      .map((split: any) => ({
        userId: getSplitUserId(split),
        amount: getSplitAmount(split),
      }))
      .filter(
        (split: { userId: string; amount: number }) =>
          !!split.userId && split.amount > 0
      ),
  };
};

export default function SettleUpScreen() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps>();

  const mode = route.params.mode;
  const groupIdFromRoute = route.params.groupId;

  const [currentUserId, setCurrentUserId] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberBalance | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const storedUserId =
        (await AsyncStorage.getItem('userId'));

      if (!storedUserId) {
        throw new Error('Current user is not available. Please log in again.');
      }

      const me = String(storedUserId);
      setCurrentUserId(me);

      let loadedMembers: GroupMember[] = [];
      if (groupIdFromRoute) {
        try {
          const membersResponse = await groupMembersService.getMembers(groupIdFromRoute);
          loadedMembers = extractMembersPayload(membersResponse)
            .map(normalizeMember)
            .filter((member: GroupMember) => !!member.id);
        } catch {
          loadedMembers = [];
        }
      }

      let rawExpenses: any[] = [];
      const numericGroupId = Number(groupIdFromRoute);

      if (groupIdFromRoute && Number.isFinite(numericGroupId)) {
        try {
          rawExpenses = await expensesService.getExpenses(numericGroupId);
        } catch {
          const allExpenses = await expensesService.getExpenses();
          rawExpenses = allExpenses.filter((item: any) => {
            return String(item?.groupId ?? item?.group_id ?? item?.group?.id ?? '') === String(groupIdFromRoute);
          });
        }
      } else {
        rawExpenses = await expensesService.getExpenses();
      }

      const normalizedExpenses = rawExpenses
        .map(normalizeExpense)
        .filter((expense: Expense) => !!expense.id);

      setGroupMembers(loadedMembers);
      setExpenses(normalizedExpenses);
    } catch (error) {
      Alert.alert(
        'Failed to load balances',
        error instanceof Error ? error.message : 'Unknown error'
      );
      setGroupMembers([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [groupIdFromRoute]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();

    groupMembers.forEach(member => {
      map.set(String(member.id), member.name);
    });

    expenses.forEach(expense => {
      const payerId = String(expense.paidBy.id || '');
      if (payerId && !map.has(payerId)) {
        map.set(payerId, expense.paidBy.name || `Member ${payerId}`);
      }
    });

    return map;
  }, [groupMembers, expenses]);

  const allMemberTotals = useMemo<MemberBalance[]>(() => {
    if (!currentUserId) {
      return [];
    }

    const map = new Map<string, { net: number; groupIds: Set<string> }>();

    expenses.forEach(expense => {
      const paidById = String(expense.paidBy.id || '');
      const expenseGroupId = String(expense.groupId || '');
      const mySplit = expense.splits.find(split => String(split.userId) === String(currentUserId));

      if (paidById === String(currentUserId)) {
        expense.splits.forEach(split => {
          const splitUserId = String(split.userId || '');
          const splitAmount = Number(split.amount || 0);

          if (!splitUserId || splitUserId === String(currentUserId) || splitAmount <= 0) {
            return;
          }

          const existing = map.get(splitUserId) ?? { net: 0, groupIds: new Set<string>() };
          existing.net += splitAmount;

          if (expenseGroupId) {
            existing.groupIds.add(expenseGroupId);
          }

          map.set(splitUserId, existing);
        });

        return;
      }

      if (mySplit && paidById) {
        const myAmount = Number(mySplit.amount || 0);

        if (myAmount <= 0) {
          return;
        }

        const existing = map.get(paidById) ?? { net: 0, groupIds: new Set<string>() };
        existing.net -= myAmount;

        if (expenseGroupId) {
          existing.groupIds.add(expenseGroupId);
        }

        map.set(paidById, existing);
      }
    });

    return Array.from(map.entries())
      .map(([id, entry]) => {
        const memberGroupId =
          groupIdFromRoute ||
          (entry.groupIds.size === 1 ? Array.from(entry.groupIds)[0] : undefined);

        const netAmount = roundCurrency(entry.net);

        return {
          id,
          name: memberNameMap.get(id) ?? `Member ${id}`,
          amount: Math.abs(netAmount),
          isYouPaying: netAmount < 0,
          groupId: memberGroupId,
        };
      })
      .filter(member => member.amount >= 0.01);
  }, [currentUserId, expenses, groupIdFromRoute, memberNameMap]);

  const memberTotals = useMemo(() => {
    if (mode === 'single') {
      const selectedId = String(route.params.memberId);
      const fromBalances = allMemberTotals.find(member => String(member.id) === selectedId);

      if (fromBalances) {
        return [
          {
            ...fromBalances,
            name: route.params.memberName ?? fromBalances.name,
          },
        ];
      }

      const fallbackAmount = Number(route.params.amount ?? 0);

      if (fallbackAmount <= 0) {
        return [];
      }

      return [
        {
          id: selectedId,
          name:
            route.params.memberName ??
            memberNameMap.get(selectedId) ??
            `Member ${selectedId}`,
          amount: fallbackAmount,
          isYouPaying: route.params.isYouPaying ?? true,
          groupId: route.params.groupId,
        },
      ];
    }

    return allMemberTotals;
  }, [mode, route.params, allMemberTotals, memberNameMap]);

  const totalYouOwe = useMemo(() => {
    return memberTotals
      .filter(m => m.isYouPaying)
      .reduce((sum, m) => sum + m.amount, 0);
  }, [memberTotals]);

  const totalYouAreOwed = useMemo(() => {
    return memberTotals
      .filter(m => !m.isYouPaying)
      .reduce((sum, m) => sum + m.amount, 0);
  }, [memberTotals]);

  const summaryState = useMemo(() => {
    const oweCount = memberTotals.filter(m => m.isYouPaying).length;
    const owedCount = memberTotals.filter(m => !m.isYouPaying).length;

    if (totalYouOwe >= 0.01) {
      return {
        label: 'Total you owe',
        amount: totalYouOwe,
        subText: `to ${oweCount} people`,
        color: '#ff2056',
      };
    }

    if (totalYouAreOwed >= 0.01) {
      return {
        label: 'Total you are owed',
        amount: totalYouAreOwed,
        subText: `from ${owedCount} people`,
        color: '#009966',
      };
    }

    return {
      label: 'Total balance',
      amount: 0,
      subText: 'All settled',
      color: '#6a7282',
    };
  }, [memberTotals, totalYouAreOwed, totalYouOwe]);

  const handleConfirmSettle = async () => {
    if (!selectedMember) {
      return;
    }

    if (!currentUserId) {
      Alert.alert('Unable to settle', 'Current user is not available.');
      return;
    }

    const resolvedGroupId = selectedMember.groupId || groupIdFromRoute;
    const numericGroupId = Number(resolvedGroupId);

    if (!resolvedGroupId || !Number.isFinite(numericGroupId)) {
      Alert.alert(
        'Group context required',
        'Open Settle Up from a specific group to settle this balance.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const youArePaying = selectedMember.isYouPaying;
      const paidById = youArePaying ? currentUserId : selectedMember.id;
      const splitUserId = youArePaying ? selectedMember.id : currentUserId;

      await expensesService.createExpense({
        description: 'Settlement',
        amount: selectedMember.amount,
        category: 'other',
        groupId: numericGroupId,
        paidById,
        date: new Date().toISOString().split('T')[0],
        splitType: 'exact',
        splits: [{ userId: splitUserId, amount: selectedMember.amount }],
      });

      setSelectedMember(null);
      await loadData();
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Settle failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={26} color="#6a7282" />
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>Settle Up</Text>
            <Text style={styles.subtitle}>{groupIdFromRoute ? 'Balances for this group' : 'Simplified settlement plan'}</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#009966" size="large" />
          </View>
        )}

        {mode === 'all' && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: summaryState.color },
            ]}
          >
            <Text style={styles.summaryLabel}>{summaryState.label}</Text>
            <Text style={styles.summaryAmount}>${summaryState.amount.toFixed(2)}</Text>
            <Text style={styles.summarySub}>{summaryState.subText}</Text>
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Balances by Person</Text>

          {!loading && memberTotals.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No unsettled balances found.</Text>
            </View>
          )}

          {memberTotals.map(member => (
            <View
              key={member.id}
              style={[
                styles.memberCard,
                member.isYouPaying
                  ? styles.owingCard
                  : styles.owedCard,
              ]}
            >
              <View style={styles.memberLeft}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontWeight: 'bold' }}>{member.name[0] || '?'}</Text>
                </View>

                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text
                    style={[
                      styles.memberStatus,
                      {
                        color: member.isYouPaying
                          ? '#ff2056'
                          : '#009966',
                      },
                    ]}
                  >
                    {member.isYouPaying ? 'you owe' : 'owes you'}
                  </Text>
                </View>
              </View>

              <View style={styles.memberRight}>
                <Text
                  style={[
                    styles.memberAmount,
                    {
                      color: member.isYouPaying
                        ? '#ff2056'
                        : '#009966',
                    },
                  ]}
                >
                  ${member.amount.toFixed(2)}
                </Text>

                <TouchableOpacity
                  disabled={isSubmitting}
                  onPress={() => setSelectedMember(member)}
                  style={[
                    styles.settleButton,
                    {
                      backgroundColor: member.isYouPaying
                        ? '#ff2056'
                        : '#009966',
                      opacity: isSubmitting ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={styles.settleText}>Settle</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedMember} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Settle with {selectedMember?.name}?</Text>

            <Text style={styles.modalDesc}>
              {selectedMember?.isYouPaying
                ? `Mark $${selectedMember?.amount.toFixed(2)} as paid?`
                : `Mark balance as received?`}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={() => setSelectedMember(null)}
                style={styles.cancelBtn}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isSubmitting}
                onPress={handleConfirmSettle}
                style={styles.confirmBtn}
              >
                <Text style={{ color: '#fff' }}>{isSubmitting ? 'Saving...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    padding: 20,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },

  subtitle: {
    fontSize: 14,
    color: '#6a7282',
  },

  loadingWrap: {
    paddingVertical: 24,
  },

  summaryCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },

  summaryLabel: { color: '#fff', opacity: 0.8 },
  summaryAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  summarySub: { color: '#fff', opacity: 0.8 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 12,
  },

  emptyWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  emptyText: {
    color: '#6a7282',
  },

  memberCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  owingCard: {
    backgroundColor: '#fff5f7',
    borderWidth: 1,
    borderColor: '#ffd9e0',
  },

  owedCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },

  memberLeft: { flexDirection: 'row', alignItems: 'center' },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  memberName: { fontSize: 16, fontWeight: '600' },
  memberStatus: { fontSize: 12 },

  memberAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  settleButton: {
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },

  settleText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },

  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalDesc: { fontSize: 14, marginBottom: 20 },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },

  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 10,
  },

  confirmBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#101828',
    borderRadius: 12,
  },
});