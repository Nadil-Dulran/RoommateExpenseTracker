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

import { RootStackParamList, SettleUpExpenseContext } from '../../types/navigation';
import { Expense, Settlement } from '../../types';
import { expensesService } from '../../services/expensesService';
import { groupMembersService } from '../../services/groupMembersService';
import { settlementService } from '../../services/settlementService';
import {
  extractSettlementsPayload,
  normalizeSettlement,
} from '../../utils/settlements';
import { useAppCurrency } from '../../context/CurrencyContext';

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
  const { formatCurrency, currencyCode } = useAppCurrency();

  const mode = route.params.mode;
  const groupIdFromRoute = route.params.groupId;
  const expenseContext: SettleUpExpenseContext | undefined =
    mode === 'single' ? route.params.expenseContext : undefined;

  const [currentUserId, setCurrentUserId] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberBalance | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const loadSettlementsForGroups = useCallback(
    async (candidateGroupIds: Array<string | number | undefined>) => {
      const numericIds = Array.from(
        new Set(
          candidateGroupIds
            .map(value => {
              if (value == null || value === '') {
                return null;
              }
              const parsed = Number(value);
              return Number.isFinite(parsed) ? parsed : null;
            })
            .filter((value): value is number => value !== null)
        )
      );

      if (numericIds.length === 0) {
        setSettlements([]);
        return;
      }

      try {
        const lists = await Promise.all(
          numericIds.map(async groupId => {
            try {
              const response = await settlementService.getSettlements(groupId);
              return extractSettlementsPayload(response);
            } catch (error) {
              console.log('Failed to fetch settlements for group', groupId, error);
              return [];
            }
          })
        );

        const normalized = lists
          .flat()
          .map(item => normalizeSettlement(item))
          .filter(item => !!item.id)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

        setSettlements(normalized);
      } catch (error) {
        console.log('Failed to load settlements list for Settle Up', error);
        setSettlements([]);
      }
    },
    []
  );

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

      const uniqueGroupIds = new Set<string>();
      if (groupIdFromRoute) {
        uniqueGroupIds.add(String(groupIdFromRoute));
      }
      normalizedExpenses.forEach(expense => {
        if (expense.groupId) {
          uniqueGroupIds.add(String(expense.groupId));
        }
      });

      await loadSettlementsForGroups(Array.from(uniqueGroupIds));
    } catch (error) {
      Alert.alert(
        'Failed to load balances',
        error instanceof Error ? error.message : 'Unknown error'
      );
      setGroupMembers([]);
      setExpenses([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [groupIdFromRoute, loadSettlementsForGroups]);

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

    settlements.forEach(settlement => {
      const payerId = String(settlement.payerId || '');
      if (payerId && !map.has(payerId)) {
        map.set(payerId, settlement.payerName || `Member ${payerId}`);
      }

      const receiverId = String(settlement.receiverId || '');
      if (receiverId && !map.has(receiverId)) {
        map.set(receiverId, settlement.receiverName || `Member ${receiverId}`);
      }
    });

    return map;
  }, [groupMembers, expenses, settlements]);

  const expenseSpecificBalances = useMemo<MemberBalance[] | null>(() => {
    if (!expenseContext || !currentUserId) {
      return null;
    }

    const payerId = String(expenseContext.paidBy.id || '');
    const me = String(currentUserId);
    const entries: MemberBalance[] = [];

    if (payerId === me) {
      expenseContext.splits.forEach(split => {
        const splitUserId = String(split.userId || '');
        const splitAmount = Number(split.amount || 0);

        if (!splitUserId || splitUserId === me || splitAmount <= 0) {
          return;
        }

        entries.push({
          id: splitUserId,
          name: split.name ?? `Member ${splitUserId}`,
          amount: roundCurrency(splitAmount),
          isYouPaying: false,
          groupId: expenseContext.groupId ?? groupIdFromRoute,
        });
      });

      return entries.filter(member => member.amount >= 0.01);
    }

    const mySplit = expenseContext.splits.find(
      split => String(split.userId || '') === me
    );

    if (mySplit && payerId) {
      entries.push({
        id: payerId,
        name: expenseContext.paidBy.name || `Member ${payerId}`,
        amount: roundCurrency(Number(mySplit.amount || 0)),
        isYouPaying: true,
        groupId: expenseContext.groupId ?? groupIdFromRoute,
      });
    }

    return entries.filter(member => member.amount >= 0.01);
  }, [expenseContext, currentUserId, groupIdFromRoute]);

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

    settlements.forEach(settlement => {
      const payerId = String(settlement.payerId || '');
      const receiverId = String(settlement.receiverId || '');
      const amount = Number(settlement.amount || 0);
      const groupId = settlement.groupId ? String(settlement.groupId) : undefined;

      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      if (payerId === String(currentUserId) && receiverId) {
        const existing = map.get(receiverId) ?? { net: 0, groupIds: new Set<string>() };
        existing.net += amount;
        if (groupId) {
          existing.groupIds.add(groupId);
        }
        map.set(receiverId, existing);
        return;
      }

      if (receiverId === String(currentUserId) && payerId) {
        const existing = map.get(payerId) ?? { net: 0, groupIds: new Set<string>() };
        existing.net -= amount;
        if (groupId) {
          existing.groupIds.add(groupId);
        }
        map.set(payerId, existing);
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
      }, [currentUserId, expenses, groupIdFromRoute, memberNameMap, settlements]);

  const memberTotals = useMemo(() => {
    if (expenseSpecificBalances && expenseSpecificBalances.length > 0) {
      return expenseSpecificBalances;
    }

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
  }, [mode, route.params, allMemberTotals, memberNameMap, expenseSpecificBalances]);

  const expenseParticipants = useMemo(
    () => {
      if (!expenseContext) {
        return [];
      }

      return expenseContext.splits.map(split => {
        const userId = String(split.userId || '');
        return {
          id: userId,
          name:
            split.name ??
            memberNameMap.get(userId) ??
            `Member ${userId}`,
          amount: roundCurrency(Number(split.amount || 0)),
          isCurrentUser:
            !!currentUserId && userId === String(currentUserId),
        };
      });
    },
    [expenseContext, memberNameMap, currentUserId]
  );

  const expenseSummary = useMemo(() => {
    if (!expenseContext || !expenseSpecificBalances || expenseSpecificBalances.length === 0) {
      return null;
    }

    const oweEntries = expenseSpecificBalances.filter(member => member.isYouPaying);
    const owedEntries = expenseSpecificBalances.filter(member => !member.isYouPaying);

    if (oweEntries.length > 0) {
      const total = oweEntries.reduce((sum, entry) => sum + entry.amount, 0);
      return {
        label: 'You owe',
        amount: total,
        subText:
          oweEntries.length === 1
            ? `to ${oweEntries[0].name}`
            : `to ${oweEntries.length} people`,
        color: '#ff2056',
      };
    }

    if (owedEntries.length > 0) {
      const total = owedEntries.reduce((sum, entry) => sum + entry.amount, 0);
      return {
        label: 'You are owed',
        amount: total,
        subText:
          owedEntries.length === 1
            ? `from ${owedEntries[0].name}`
            : `from ${owedEntries.length} people`,
        color: '#009966',
      };
    }

    return null;
  }, [expenseContext, expenseSpecificBalances]);

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
      const payerId = youArePaying ? currentUserId : selectedMember.id;
      const receiverId = youArePaying ? selectedMember.id : currentUserId;
      const settlementAmount = roundCurrency(selectedMember.amount);

      await settlementService.createSettlement({
        groupId: numericGroupId,
        payerId,
        receiverId,
        amount: settlementAmount,
        currency: currencyCode,
        method: 'CASH',
        notes: expenseContext?.description
          ? `Settlement for ${expenseContext.description}`
          : null,
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
            <Text style={styles.subtitle}>
              {expenseContext
                ? 'Only the people involved in this expense'
                : groupIdFromRoute
                ? 'Balances for this group'
                : 'Simplified settlement plan'}
            </Text>
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
            <Text style={styles.summaryAmount}>{formatCurrency(summaryState.amount)}</Text>
            <Text style={styles.summarySub}>{summaryState.subText}</Text>
          </View>
        )}

        {expenseContext && (
          <View style={styles.expenseMetaCard}>
            <Text style={styles.expenseMetaTitle}>{expenseContext.description}</Text>
            <Text style={styles.expenseMetaSub}>
              {expenseContext.groupName ? `${expenseContext.groupName} • ` : ''}Paid by {expenseContext.paidBy.name}
            </Text>
          </View>
        )}

        {expenseContext && expenseSummary && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: expenseSummary.color },
            ]}
          >
            <Text style={styles.summaryLabel}>{expenseSummary.label}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(expenseSummary.amount)}</Text>
            <Text style={styles.summarySub}>{expenseSummary.subText}</Text>
          </View>
        )}

        {expenseContext && expenseParticipants.length > 0 && (
          <View style={styles.participantsCard}>
            <Text style={styles.participantsTitle}>People in this expense</Text>
            {expenseParticipants.map((participant, index) => (
              <View
                key={participant.id}
                style={[
                  styles.participantRow,
                  index === expenseParticipants.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View>
                  <Text style={styles.participantName}>
                    {participant.name}
                    {participant.isCurrentUser ? ' (You)' : ''}
                  </Text>
                  <Text style={styles.participantMeta}>
                    {participant.isCurrentUser ? 'Your share' : 'Share'}
                  </Text>
                </View>

                <Text style={styles.participantAmount}>
                  {formatCurrency(participant.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>
            {expenseContext ? 'Settle this expense' : 'Balances by Person'}
          </Text>

          {!loading && memberTotals.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {expenseContext
                  ? 'Everyone is settled for this expense.'
                  : 'No unsettled balances found.'}
              </Text>
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
                  {formatCurrency(member.amount)}
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
                ? `Mark ${formatCurrency(selectedMember?.amount ?? 0)} as paid?`
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

  expenseMetaCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  expenseMetaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  expenseMetaSub: {
    fontSize: 13,
    color: '#6a7282',
  },

  participantsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  participantsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },

  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f7',
  },

  participantName: {
    fontSize: 14,
    fontWeight: '500',
  },

  participantMeta: {
    fontSize: 12,
    color: '#98a2b3',
  },

  participantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
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