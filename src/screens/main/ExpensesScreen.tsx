import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, Settlement } from '../../types';
import { expensesService } from '../../services/expensesService';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { useAppCurrency } from '../../context/CurrencyContext';
import { settlementService } from '../../services/settlementService';
import { extractSettlementExpenseId, extractSettlementsPayload, normalizeSettlement,
} from '../../utils/settlements';
import { normalizeExpense, sortRawExpensesByLatest } from '../../utils/expenses';
import DeleteExpenseModal from '../../components/expenses/DeleteExpenseModal';
import EditExpenseModal from '../../components/expenses/EditExpenseModal';
import ExpenseCard from '../../components/expenses/ExpenseCard';

type SplitMode = 'equal' | 'exact' | 'percentage';

interface GroupMember {
  id: string;
  name: string;
  avatarUri?: string | null;
}

const toImageUri = (value?: string | null, mimeType = 'image/jpeg') => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:image')
  ) {
    return normalized;
  }

  const compact = normalized.replace(/\s/g, '');
  return `data:${mimeType};base64,${compact}`;
};

export default function ExpensesScreen() {
  const navigation = useNavigation<any>();
  const { currency, formatCurrency } = useAppCurrency();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [backendGroups, setBackendGroups] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitMode>('equal');
  const [editExactSplits, setEditExactSplits] = useState<Record<string, string>>({});
  const [editPercentageSplits, setEditPercentageSplits] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const buildPairKey = (groupId: string, payerId: string, receiverId: string) => {
    return `${String(groupId || '')}:${String(payerId || '')}:${String(receiverId || '')}`;
  };

  const roundCurrency = (value: number) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  };

  const isSettlementDescription = (value?: string | null) =>
    String(value || '').trim().toLowerCase() === 'settlement';



const handleEdit = (item: Expense) => {
  setActiveMenuId(null);
  setSelectedExpense(item);
  setEditDescription(item.description);
  setEditAmount(item.amount.toString());
  setShowEditModal(true);
};

const handleDelete = (item: Expense) => {
  setActiveMenuId(null);
  setSelectedExpense(item);
  setShowDeleteModal(true);
};

  const loadCurrentUserId = useCallback(async () => {
    try {
      const storedUserId =
        (await AsyncStorage.getItem('userId')) ??
        (await AsyncStorage.getItem('user_id'));
      if (storedUserId) {
        setCurrentUserId(String(storedUserId));
      }
    } catch (error) {
      console.log('Failed to load current user id', error);
    }
  }, []);

  const normalizeMember = useCallback((member: any): GroupMember => {
    const avatarValue = member?.avatarBase64 ?? null;

    const avatarMimeType = 'image/jpeg';

    return {
      id: String(member?.id ?? ''),
      name: member?.name ?? 'Unknown',
      avatarUri: toImageUri(avatarValue, avatarMimeType),
    };
  }, []);

  const normalizeGroupInfo = useCallback((group: any) => ({
    id: String(group?.id ?? ''),
    name: group?.name || 'Untitled Group',
    emoji: group?.emoji || '👥',
    members: Array.isArray(group?.members)
      ? group.members.map(normalizeMember)
      : Array.isArray(group?.users)
      ? group.users.map(normalizeMember)
      : [],
  }), [normalizeMember]);

  const extractMembersPayload = (data: any): any[] => {
    if (Array.isArray(data)) { return data; }
    return [];
  };

  const getGroupInfo = useCallback(
    (groupId: string) => backendGroups.find(g => String(g.id) === String(groupId)),
    [backendGroups]
  );

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
        baseGroups.map(async (group: any) => {
          try {
            const membersResponse = await groupMembersService.getMembers(group.id);
            const members = extractMembersPayload(membersResponse).map(normalizeMember);
            return { ...group, members: members.length > 0 ? members : group.members };
          } catch {
            return {
              ...group,
              members: (group.members || []).map(normalizeMember),
            };
          }
        })
      );

      setBackendGroups(groupsWithMembers);
    } catch (error) {
      console.log('Failed to load groups for expenses', error);
      setBackendGroups([]);
    }
  }, [normalizeGroupInfo, normalizeMember]);

const loadExpenses = useCallback(async () => {
  try {
    const groupsResponse = await groupsService.getGroups();

    const groupList = Array.isArray(groupsResponse)
      ? groupsResponse
      : [];

    const groupedExpenses = await Promise.all(
      groupList.map(async group => {
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

    const uniqueExpenses = new Map<string, any>();

    groupedExpenses.flat().forEach(expense => {
      const id = String(expense?.id ?? '');

      if (id) {
        uniqueExpenses.set(id, expense);
      }
    });

    const normalized = sortRawExpensesByLatest(
      Array.from(uniqueExpenses.values())
    )
      .map(normalizeExpense)
      .filter(expense => !!expense.id);

    setExpenses(normalized);
  } catch (error) {
    console.log('Failed to load expenses', error);
    setExpenses([]);
  }
}, []);

  useEffect(() => {
    loadCurrentUserId();
    loadGroups();
    loadExpenses();
  }, [loadCurrentUserId, loadExpenses, loadGroups]);

  const loadSettlementsForCurrentGroups = useCallback(async () => {
    if (!backendGroups.length) {
      setSettlements([]);
      return;
    }

    try {
      const lists = await Promise.all(
        backendGroups.map(async group => {
          const groupIdNumber = Number(group?.id);
          if (!Number.isFinite(groupIdNumber)) {
            return [];
          }

          try {
            const response = await settlementService.getSettlements(groupIdNumber);
            const payload = extractSettlementsPayload(response);
            return payload.map(normalizeSettlement);
          } catch (error) {
            console.log('Failed to load settlements for group', group?.id, error);
            return [];
          }
        })
      );

      const flattened = lists
        .flat()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setSettlements(flattened);
    } catch (error) {
      console.log('Failed to load settlements list', error);
      setSettlements([]);
    }
  }, [backendGroups]);

  const reloadAllData = useCallback(() => {
    loadGroups();
    loadExpenses();
  }, [loadGroups, loadExpenses]);

  useFocusEffect(
    useCallback(() => {
      loadCurrentUserId();
      reloadAllData();
      loadSettlementsForCurrentGroups();
    }, [loadCurrentUserId, reloadAllData, loadSettlementsForCurrentGroups])
  );

  useEffect(() => {
    loadSettlementsForCurrentGroups();
  }, [loadSettlementsForCurrentGroups]);

  const selectedGroupMembers = useMemo<GroupMember[]>(() => {
    if (!selectedExpense) {
      return [];
    }

    const groupInfo = getGroupInfo(selectedExpense.groupId);
    if (!groupInfo?.members) {
      return [];
    }

    return groupInfo.members.map((member: GroupMember | any) => ({
      id: String(member?.id ?? ''),
      name: member?.name ?? `User ${member?.id ?? ''}`,
      avatarUri: member?.avatarUri ?? null,
    }));
  }, [selectedExpense, getGroupInfo]);

  const fallbackParticipants = useMemo<GroupMember[]>(() => {
    if (!selectedExpense) {
      return [];
    }

    const unique = new Map<string, GroupMember>();
    selectedExpense.splits.forEach(split => {
      unique.set(String(split.userId), {
        id: String(split.userId),
        name: `User ${split.userId}`,
        avatarUri: null,
      });
    });
    return Array.from(unique.values());
  }, [selectedExpense]);

  const editParticipants = useMemo<GroupMember[]>(() => {
    return selectedGroupMembers.length > 0
      ? selectedGroupMembers
      : fallbackParticipants;
  }, [selectedGroupMembers, fallbackParticipants]);

  const percentageSplitsTotal = useMemo(() => {
    return Object.values(editPercentageSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  }, [editPercentageSplits]);

  useEffect(() => {
    if (!selectedExpense) {
      setEditDescription('');
      setEditAmount('');
      setSplitType('equal');
      setEditExactSplits({});
      setEditPercentageSplits({});
      return;
    }

    setEditDescription(selectedExpense.description);
    setEditAmount(selectedExpense.amount.toFixed(2));

    const exactMap: Record<string, string> = {};
    selectedExpense.splits.forEach(split => {
      exactMap[String(split.userId)] = split.amount.toFixed(2);
    });
    setEditExactSplits(exactMap);

    const percentageMap: Record<string, string> = {};
    let hasExplicitPercentages = true;
    selectedExpense.splits.forEach(split => {
      if (typeof split.percentage === 'number' && Number.isFinite(split.percentage)) {
        percentageMap[String(split.userId)] = split.percentage.toString();
      } else {
        hasExplicitPercentages = false;
      }
    });

    if (!hasExplicitPercentages) {
      const total = selectedExpense.amount || 0;
      selectedExpense.splits.forEach(split => {
        const percent = total === 0 ? 0 : (split.amount / total) * 100;
        percentageMap[String(split.userId)] = percent.toFixed(2);
      });
    }

    setEditPercentageSplits(percentageMap);

    if (selectedExpense.splitType && ['equal', 'exact', 'percentage'].includes(selectedExpense.splitType)) {
      setSplitType(selectedExpense.splitType as SplitMode);
      return;
    }

    if (hasExplicitPercentages) {
      setSplitType('percentage');
      return;
    }

    const participantCount = selectedExpense.splits.length || 1;
    const equalShare = participantCount > 0 ? selectedExpense.amount / participantCount : selectedExpense.amount;
    const allEqual = selectedExpense.splits.every(split => Math.abs(split.amount - equalShare) < 0.01);
    setSplitType(allEqual ? 'equal' : 'exact');
  }, [selectedExpense]);

  useEffect(() => {
    if (!editParticipants.length) {
      return;
    }

    setEditExactSplits(prev => {
      let mutated = false;
      const next = { ...prev };
      editParticipants.forEach(member => {
        if (next[member.id] == null) {
          next[member.id] = '0';
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });

    setEditPercentageSplits(prev => {
      let mutated = false;
      const next = { ...prev };
      editParticipants.forEach(member => {
        if (next[member.id] == null) {
          next[member.id] = '0';
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });
  }, [editParticipants]);

  const handleSplitModeChange = (mode: SplitMode) => {
    setSplitType(mode);

    if (mode === 'exact') {
      setEditExactSplits(prev => {
        const next = { ...prev };
        editParticipants.forEach(member => {
          if (next[member.id] == null) {
            next[member.id] = '0';
          }
        });
        return next;
      });
    }

    if (mode === 'percentage') {
      setEditPercentageSplits(prev => {
        const next = { ...prev };
        if (Object.keys(next).length === 0 && editParticipants.length > 0) {
          const equalPercent = Number((100 / editParticipants.length).toFixed(2));
          editParticipants.forEach(member => {
            next[member.id] = equalPercent.toString();
          });
        } else {
          editParticipants.forEach(member => {
            if (next[member.id] == null) {
              next[member.id] = '0';
            }
          });
        }
        return next;
      });
    }
  };

  const dismissEditModal = () => {
    setShowEditModal(false);
    setSelectedExpense(null);
    setActiveMenuId(null);
  };


  const confirmDelete = async () => {
    if (!selectedExpense) return;

    await expensesService.deleteExpense(parseInt(selectedExpense.id, 10));

    setSelectedExpense(null);
    setShowDeleteModal(false);
    await loadExpenses();
  };

  const confirmEdit = async () => {
    if (!selectedExpense) {
      return;
    }

    if (!editParticipants.length) {
      Alert.alert('Members unavailable', 'Unable to load participants for this expense. Please try again.');
      return;
    }

    if (!editDescription.trim()) {
      Alert.alert('Missing description', 'Please enter a description for this expense.');
      return;
    }

    const normalizedAmount = parseFloat(editAmount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than zero.');
      return;
    }

    let splitPayload: { userId: string; amount: number; percentage?: number }[] = [];

    if (splitType === 'equal') {
      const memberCount = editParticipants.length;
      if (memberCount === 0) {
        Alert.alert('Split error', 'No members available for equal split.');
        return;
      }

      const baseShare = roundCurrency(normalizedAmount / memberCount);
      let remaining = roundCurrency(normalizedAmount);

      splitPayload = editParticipants.map((member, index) => {
        const isLast = index === memberCount - 1;
        const amount = isLast ? roundCurrency(remaining) : baseShare;
        remaining = roundCurrency(remaining - amount);
        return {
          userId: String(member.id),
          amount,
        };
      });
    } else if (splitType === 'exact') {
      splitPayload = editParticipants.map(member => {
        const parsedAmount = parseFloat(editExactSplits[member.id] || '0');
        const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
        return {
          userId: String(member.id),
          amount: roundCurrency(safeAmount),
        };
      });

      const exactTotal = splitPayload.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(exactTotal - normalizedAmount) > 0.01) {
        Alert.alert('Split mismatch', 'Exact amounts must add up to the total.');
        return;
      }
    } else {
      splitPayload = editParticipants.map(member => {
        const parsedPercent = parseFloat(editPercentageSplits[member.id] || '0');
        const percent = Number.isFinite(parsedPercent) ? parsedPercent : 0;
        return {
          userId: String(member.id),
          percentage: percent,
          amount: roundCurrency((normalizedAmount * percent) / 100),
        };
      });

      if (Math.abs(percentageSplitsTotal - 100) > 0.1) {
        Alert.alert('Split mismatch', 'Percentages must add up to 100%.');
        return;
      }
    }

    setIsSavingEdit(true);
    try {
      const safePayload: Record<string, any> = {
        description: editDescription.trim(),
        amount: normalizedAmount,
        splitType,
        splits: splitPayload,
      };

      const preservedCategory =
        selectedExpense.categoryLabel ??
        (typeof selectedExpense.category === 'string'
          ? selectedExpense.category
          : undefined);

      if (preservedCategory) {
        safePayload.category = preservedCategory;
      }

      if (selectedExpense.categoryEmoji) {
        safePayload.categoryEmoji = selectedExpense.categoryEmoji;
      }

      const preservedDate =
        selectedExpense.originalExpenseDate ??
        selectedExpense.date ??
        selectedExpense.createdAt ??
        selectedExpense.updatedAt ??
        null;

      if (preservedDate) {
        const field = selectedExpense.originalExpenseDateField;
        if (field === 'expense_date') {
          safePayload.expense_date = preservedDate;
        } else if (field === 'expenseDate') {
          safePayload.expenseDate = preservedDate;
        } else {
          safePayload.date = preservedDate;
        }

        if (!safePayload.date) {
          safePayload.date = preservedDate;
        }
        if (!safePayload.expense_date) {
          safePayload.expense_date = preservedDate;
        }
      }

      await expensesService.updateExpense(parseInt(selectedExpense.id, 10), safePayload);

      dismissEditModal();
      await loadExpenses();
    } catch (error: any) {
      Alert.alert('Failed to update expense', error?.message ?? 'Unknown error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const settlementsByExpenseId = useMemo(() => {
    const map = new Map<string, Settlement[]>();

    settlements.forEach(settlement => {
      const expenseId = extractSettlementExpenseId(settlement);
      if (!expenseId) {
        return;
      }

      const list = map.get(expenseId) ?? [];
      list.push(settlement);
      map.set(expenseId, list);
    });

    return map;
  }, [settlements]);

  const settledAmountByPair = useMemo(() => {
    const map = new Map<string, number>();

    settlements.forEach(settlement => {
      const groupId = String(settlement.groupId || '');
      const payerId = String(settlement.payerId || '');
      const receiverId = String(settlement.receiverId || '');
      const amount = Number(settlement.amount || 0);

      if (!groupId || !payerId || !receiverId || amount <= 0) {
        return;
      }

      const key = buildPairKey(groupId, payerId, receiverId);
      map.set(key, roundCurrency((map.get(key) ?? 0) + amount));
    });

    return map;
  }, [settlements]);

  const outstandingAmountByPair = useMemo(() => {
    const map = new Map<string, number>();
    const me = String(currentUserId || '');

    if (!me) {
      return map;
    }

    expenses.forEach(expense => {
      if (isSettlementDescription(expense.description)) {
        return;
      }

      const groupId = String(expense.groupId || '');
      const paidById = String(expense.paidBy?.id || '');
      const splits = Array.isArray(expense.splits) ? expense.splits : [];

      if (!groupId) {
        return;
      }

      if (paidById === me) {
        splits.forEach(split => {
          const splitUserId = String(split.userId || '');
          const splitAmount = Number(split.amount || 0);

          if (!splitUserId || splitUserId === me || splitAmount <= 0) {
            return;
          }

          const key = buildPairKey(groupId, splitUserId, me);
          map.set(key, roundCurrency((map.get(key) ?? 0) + splitAmount));
        });
        return;
      }

      const mySplit = splits.find(split => String(split.userId || '') === me);
      const myShareAmount = Number(mySplit?.amount || 0);

      if (!paidById || myShareAmount <= 0) {
        return;
      }

      const key = buildPairKey(groupId, me, paidById);
      map.set(key, roundCurrency((map.get(key) ?? 0) + myShareAmount));
    });

    return map;
  }, [expenses, currentUserId]);

  const visibleExpenses = useMemo(() => {
    return expenses.filter(expense => !isSettlementDescription(expense.description));
  }, [expenses]);

  const renderExpense = ({ item }: { item: Expense }) => {
    return (

      <ExpenseCard
        expense={item}
        currentUserId={currentUserId}
        getGroupInfo={getGroupInfo}
        settlements={settlements}
        settlementsByExpenseId={settlementsByExpenseId}
        outstandingAmountByPair={outstandingAmountByPair}
        settledAmountByPair={settledAmountByPair}
        activeMenuId={activeMenuId}
        setActiveMenuId={setActiveMenuId}
        navigation={navigation}
        formatCurrency={formatCurrency}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <View style={styles.container}>
       <Text style={styles.header}>All Expenses</Text>
      <Text style={styles.subHeader}>
        {visibleExpenses.length} total
      </Text>
      
<View style={styles.expenseListContainer}>

<FlatList
  key={`expenses-${settlements.length}`}
  data={visibleExpenses}
  keyExtractor={item => String(item.id)}
  renderItem={renderExpense}
  removeClippedSubviews={false}
  contentContainerStyle={styles.expenseListContent}
  onScrollBeginDrag={() => setActiveMenuId(null)}
  showsVerticalScrollIndicator={false} 
/>

</View>

      <EditExpenseModal
        visible={showEditModal}
        description={editDescription}
        amount={editAmount}
        currencySymbol={currency.symbol}
        splitType={splitType}
        participants={editParticipants}
        exactSplits={editExactSplits}
        percentageSplits={editPercentageSplits}
        saving={isSavingEdit}
        onDescriptionChange={setEditDescription}
        onAmountChange={setEditAmount}
        onSplitTypeChange={handleSplitModeChange}
        onExactSplitChange={(userId, value) =>
          setEditExactSplits(previous => ({ ...previous, [userId]: value }))
        }
        onPercentageSplitChange={(userId, value) =>
          setEditPercentageSplits(previous => ({ ...previous, [userId]: value }))
        }
        onCancel={dismissEditModal}
        onSave={confirmEdit}
        formatCurrency={formatCurrency}
      />
        
     <DeleteExpenseModal
       visible={showDeleteModal}
       expense={selectedExpense}
       onCancel={() => setShowDeleteModal(false)}
       onConfirm={confirmDelete}
     />

</View>
)};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },
  subHeader: {
    fontSize: 14,
    color: '#6A7282',
    marginBottom: 20,
  },
  expenseListContainer: {
    flex: 1,
  },
  expenseListContent: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 100,
  },
});