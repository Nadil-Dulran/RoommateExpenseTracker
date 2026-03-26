import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Expense } from '../../types';
import { expensesService } from '../../services/expensesService';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { Image } from 'react-native';
import deleteIcon from '../../../assets/delete.png';
import editIcon from '../../../assets/edit.png';
import Icon from 'react-native-vector-icons/Feather';
import { useAppCurrency } from '../../context/CurrencyContext';

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
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const roundCurrency = (value: number) => {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  };



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

  const normalizeGroupInfo = (group: any) => ({
    id: String(group?.id ?? ''),
    name: group?.name || 'Untitled Group',
    emoji: group?.emoji || '👥',
    members: Array.isArray(group?.members)
      ? group.members
      : Array.isArray(group?.users)
      ? group.users
      : [],
  });

  const extractMembersPayload = (data: any): any[] => {
    if (Array.isArray(data)) { return data; }
    if (Array.isArray(data?.data)) { return data.data; }
    if (Array.isArray(data?.members)) { return data.members; }
    return [];
  };

  const normalizeMember = (member: any) => ({
    id: String(member?.id ?? member?.user_id ?? member?.userId ?? ''),
    name:
      member?.name ??
      member?.user?.name ??
      member?.full_name ??
      'Unknown',
  });

  const normalizeExpense = (raw: any): Expense => {
    const getSplitUserId = (split: any) => {
      return String(
        split?.userId ??
        split?.user_id ??
        split?.memberId ??
        split?.member_id ??
        split?.user?.id ??
        split?.user?.user_id ??
        ''
      );
    };

    const getSplitAmount = (split: any) => {
      return Number(
        split?.share_amount ??
        split?.amount ??
        split?.shareAmount ??
        split?.share ??
        split?.split_amount ??
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
      : Array.isArray(raw?.members)
      ? raw.members
      : [];

    const paidById = String(
      raw?.paidByUser?.id ??
      raw?.paid_by_user?.id ??
      raw?.paidBy?.id ??
      raw?.paidById ??
      raw?.paid_by ??
      raw?.paid_by_id ??
      raw?.userId ??
      raw?.user_id ??
      ''
    );

    const processedSplits = splitsRaw
      .map((split: any) => {
        const userId = getSplitUserId(split);
        const amount = getSplitAmount(split);
        return { userId, amount };
      })
      .filter((split: { userId: string; amount: number }) => !!split.userId && split.amount > 0);

    return {
      id: String(raw?.id ?? raw?.expenseId ?? raw?.expense_id ?? ''),
      category: (raw?.categoryEmoji ?? raw?.category_emoji ?? raw?.category ?? raw?.type ?? 'other') as Expense['category'],
      description: raw?.description ?? raw?.title ?? 'Expense',
      amount: Number(raw?.amount ?? raw?.total ?? raw?.expense_amount ?? 0),
      date: String(raw?.date ?? raw?.expense_date ?? raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()),
      groupId: String(raw?.groupId ?? raw?.group_id ?? raw?.group?.id ?? ''),
      paidBy: {
        id: paidById,
        name:
          raw?.paidByUser?.name ??
          raw?.paid_by_user?.name ??
          raw?.paidBy?.name ??
          raw?.paidByName ??
          raw?.paid_by_name ??
          raw?.payer_name ??
          'Unknown',
      },
      splits: processedSplits,
    };
  };

  const getGroupInfo = (groupId: string) =>
    backendGroups.find(g => String(g.id) === String(groupId));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const sortRawExpensesByLatest = (items: any[]) => {
    return [...items].sort((a, b) => {
      const aTime = Date.parse(String(a?.createdAt ?? a?.created_at ?? a?.date ?? ''));
      const bTime = Date.parse(String(b?.createdAt ?? b?.created_at ?? b?.date ?? ''));

      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return bTime - aTime;
      }

      const aId = Number(a?.id ?? a?.expenseId ?? a?.expense_id);
      const bId = Number(b?.id ?? b?.expenseId ?? b?.expense_id);

      if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
        return bId - aId;
      }

      return String(b?.id ?? b?.expenseId ?? b?.expense_id ?? '').localeCompare(
        String(a?.id ?? a?.expenseId ?? a?.expense_id ?? '')
      );
    });
  };

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

      const flat = groupedExpenses.flat();
      const uniqueById = new Map<string, any>();

      flat.forEach(item => {
        const key = String(item?.id ?? item?.expenseId ?? item?.expense_id ?? '');
        if (key) {
          uniqueById.set(key, item);
        }
      });

      return Array.from(uniqueById.values());
    };

    try {
      const data = await expensesService.getExpenses();
      const directList = Array.isArray(data) ? data : [];
      const rawList = directList.length > 0 ? directList : await loadByGroups();
      const normalized = sortRawExpensesByLatest(rawList)
        .map(normalizeExpense)
        .filter(item => !!item.id);

      setExpenses(normalized);
    } catch (e) {
      console.log('Failed to load expenses directly', e);
      try {
        const rawList = await loadByGroups();
        const normalized = sortRawExpensesByLatest(rawList)
          .map(normalizeExpense)
          .filter(item => !!item.id);
        setExpenses(normalized);
      } catch (fallbackError) {
        console.log('Failed to load expenses by groups', fallbackError);
        setExpenses([]);
      }
    }
  }, []);

  useEffect(() => {
    loadCurrentUserId();
    loadGroups();
    loadExpenses();
  }, [loadCurrentUserId, loadExpenses, loadGroups]);

  useFocusEffect(
    useCallback(() => {
      loadCurrentUserId();
      loadGroups();
      loadExpenses();
    }, [loadCurrentUserId, loadExpenses, loadGroups])
  );


  const confirmDelete = async () => {
    if (!selectedExpense) return;

    await expensesService.deleteExpense(parseInt(selectedExpense.id, 10));

    setSelectedExpense(null);
    setShowDeleteModal(false);
    await loadExpenses();
  };

  const confirmEdit = async () => {
    if (!selectedExpense) return;

    await expensesService.updateExpense(parseInt(selectedExpense.id, 10), {
      description: editDescription,
      amount: parseFloat(editAmount),
    });

    setShowEditModal(false);
    setSelectedExpense(null);
    await loadExpenses();
  };

  const memberNetByGroup = useMemo(() => {
    const me = String(currentUserId || '');
    const netMap = new Map<string, number>();

    if (!me) {
      return netMap;
    }

    expenses.forEach(expense => {
      const paidById = String(expense?.paidBy?.id ?? '');
      const groupId = String(expense?.groupId ?? '');
      const normalizedSplits = Array.isArray(expense.splits)
        ? expense.splits.map(split => ({
            userId: String(split.userId ?? ''),
            amount: Number(split.amount ?? 0),
          }))
        : [];

      const mySplit = normalizedSplits.find(split => split.userId === me);

      if (paidById === me) {
        normalizedSplits.forEach(split => {
          if (!split.userId || split.userId === me || split.amount <= 0) {
            return;
          }

          const key = `${groupId}::${split.userId}`;
          const next = roundCurrency((netMap.get(key) ?? 0) + split.amount);
          netMap.set(key, next);
        });
        return;
      }

      if (mySplit && paidById) {
        const key = `${groupId}::${paidById}`;
        const next = roundCurrency((netMap.get(key) ?? 0) - mySplit.amount);
        netMap.set(key, next);
      }
    });

    return netMap;
  }, [expenses, currentUserId]);


  const renderExpense = ({ item }: { item: Expense }) => {
  const splits = Array.isArray(item.splits) ? item.splits : [];
  const paidBy = item.paidBy ?? { id: '', name: 'Unknown' };
  const group = getGroupInfo(item.groupId);
  const resolvedCurrentUserId = String(currentUserId || '');

  const normalizedSplits = splits
    .map(split => ({
      userId: String(split.userId ?? ''),
      amount: Number(split.amount ?? 0),
    }))
    .filter(split => !!split.userId);

  const paidByName =
    paidBy.name && paidBy.name !== 'Unknown'
      ? paidBy.name
      : group?.members?.find((member: any) => String(member.id) === String(paidBy.id))?.name ?? 'Unknown';
  const myShareAmount =
    normalizedSplits.find(split => String(split.userId) === String(resolvedCurrentUserId))?.amount ?? 0;
  const isMyExpense = String(paidBy.id) === String(resolvedCurrentUserId);

  const amountYouAreOwed = normalizedSplits
    .filter(split => String(split.userId) !== String(resolvedCurrentUserId))
    .reduce((sum, split) => sum + split.amount, 0);

  const statusAmount = roundCurrency(isMyExpense ? amountYouAreOwed : myShareAmount);
  const isSettlementEntry = String(item.description || '').trim().toLowerCase() === 'settlement';
  const counterpartyId =
    isMyExpense
      ? normalizedSplits.find(split => String(split.userId) !== String(resolvedCurrentUserId))?.userId ?? ''
      : String(paidBy.id ?? '');

  const counterpartyName =
    group?.members?.find((member: any) => String(member.id) === String(counterpartyId))?.name ??
    (isMyExpense ? `User ${counterpartyId}` : paidByName);

  const netWithCounterparty = memberNetByGroup.get(`${String(item.groupId)}::${String(counterpartyId)}`) ?? 0;
  const isSettledWithCounterparty =
    !!counterpartyId && Math.abs(roundCurrency(netWithCounterparty)) < 0.01;

  const getSplitMemberName = (splitUserId: string) => {
    if (String(splitUserId) === String(resolvedCurrentUserId)) {
      return 'You';
    }

    if (String(splitUserId) === String(paidBy.id)) {
      return paidByName;
    }

    return (
      group?.members?.find((member: any) => String(member.id) === String(splitUserId))?.name ??
      `User ${splitUserId}`
    );
  };

  const splitParticipantsForSettle = normalizedSplits.map(split => ({
    userId: split.userId,
    amount: roundCurrency(split.amount),
    name: getSplitMemberName(String(split.userId)),
  }));

return (
  <View style={[styles.card,  activeMenuId === item.id && { zIndex: 999 } ]}>
    {/* Top Row */}
<View style={styles.topRow}>
  <Text style={styles.title}> {item.description}</Text>

  <View style={styles.amountRow}>
    <Text style={styles.amount}>
      {formatCurrency(item.amount)}
    </Text>

    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() =>
          setActiveMenuId(
            activeMenuId === item.id ? null : item.id
          )
        }
        style={styles.menuButton}
      >
        <Icon name="more-vertical" size={18} color="#98A2B3" />
      </Pressable>

      {activeMenuId === item.id && (
        <View style={styles.dropdown}>

           {!isSettlementEntry && !isSettledWithCounterparty && !!counterpartyId && statusAmount >= 0.01 ? (
            <Pressable
              onPress={() => {
                setActiveMenuId(null);
                navigation.navigate('SettleUp', {
                  mode: 'single',
                  memberId: String(counterpartyId),
                  amount: statusAmount,
                  memberName: counterpartyName,
                  isYouPaying: !isMyExpense,
                  groupId: String(item.groupId),
                  expenseContext: {
                    expenseId: String(item.id),
                    description: item.description,
                    amount: roundCurrency(item.amount),
                    groupId: String(item.groupId ?? ''),
                    groupName: group?.name,
                    paidBy: {
                      id: String(paidBy.id ?? ''),
                      name: paidByName,
                    },
                    splits: splitParticipantsForSettle,
                  },
                });
              }}
              style={styles.menuItem}
            >
              <View style={styles.menuRowItem}>
                <Icon name="dollar-sign" size={16} color="#009966" />
                <Text style={[styles.menuText, { color: '#009966' }] }>
                  Settle Up
                </Text>
              </View>
            </Pressable>
           ) : (
            <View style={styles.menuItem}>
              <View style={styles.menuRowItem}>
                <Icon name="check-circle" size={16} color="#12B76A" />
                <Text style={[styles.menuText, { color: '#12B76A' }] }>
                  Settled
                </Text>
              </View>
            </View>
           )}

          <Pressable
            onPress={() => handleEdit(item)}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Image source={editIcon} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleDelete(item)}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Image source={deleteIcon} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: '#FF2056' }]}>
                Delete
              </Text>
            </View>
          </Pressable>


        </View>
      )}
    </View>
  </View>
</View>


    {/* Group + Date */}
    <Text style={styles.meta}>
      {group?.emoji} {group?.name}  •  {formatDate(item.date)}
    </Text>

    {/* Paid + Owed */}
    <View style={styles.paidRow}>
      <Text style={styles.metaLight}>Paid by </Text>
      <Text style={styles.bold}>{paidByName}</Text>

      <Text style={styles.metaLight}>  •  </Text>

      {isSettlementEntry || isSettledWithCounterparty || statusAmount < 0.01 ? (
        <Text style={styles.settledText}>Settled</Text>
      ) : (
        <Text style={isMyExpense ? styles.owedText : styles.oweText}>
          {isMyExpense ? 'You are owed: ' : 'You owe: '}
          {formatCurrency(statusAmount)}
        </Text>
      )}
    </View>

    {/* Divider */}
    <View style={styles.divider} />

{/* Split Pills (INLINE like screenshot) */}
<View style={styles.splitRow}>
  <Text style={styles.metaLight}>Split:</Text>

  {normalizedSplits.map(split => {
    const memberName = getSplitMemberName(String(split.userId));

    return (
      <View key={split.userId} style={styles.splitPill}>
        <Text style={styles.splitText}>
          {memberName} {formatCurrency(split.amount)}
        </Text>
      </View>
    );
  })}
</View>
  </View>
);};

  return (
    <View style={styles.container}>
       <Text style={styles.header}>All Expenses</Text>
      <Text style={styles.subHeader}>
        {expenses.length} total
      </Text>
      
<View style={{ flex: 1 }}>

<FlatList
  data={expenses}
  keyExtractor={item => String(item.id)}
  renderItem={renderExpense}
  removeClippedSubviews={false}
  ListHeaderComponent={
    <>
     {/* Add header content here */ }
    </>
  }
  contentContainerStyle={{
    paddingHorizontal: 2,
    paddingBottom: 100,
    paddingTop: 2,
  }}
  onScrollBeginDrag={() => setActiveMenuId(null)}
  showsVerticalScrollIndicator={false} 
/>



</View>

      {/* -------- Edit Modal -------- */}
    <Modal visible={showEditModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.editCard}>

      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Edit Expense</Text>
        <Pressable onPress={() => setShowEditModal(false)}>
          <Icon name="x" size={20} color="#6A7282" />
        </Pressable>
      </View>


        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={editDescription}
          onChangeText={setEditDescription}
          style={styles.input}
        />

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.dollar}>{currency.symbol}</Text>
          <TextInput
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="numeric"
            style={styles.amountInput}
          />
        </View>

      {/* Buttons */}
      <View style={styles.modalActions}>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => setShowEditModal(false)}
        >
          <Text style={{ fontWeight: '600' }}>Cancel</Text>
        </Pressable>

        <Pressable style={styles.saveBtn} onPress={confirmEdit}>
          <Text style={{ color: 'white', fontWeight: '600' }}>
            Save Changes
          </Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>


      {/* -------- Delete Modal -------- */}
     <Modal visible={showDeleteModal} transparent animationType="fade">
  <View style={styles.deleteOverlay}>
    <View style={styles.deleteCard}>

      {/* Icon */}
      <View style={styles.deleteIconWrapper}>
        <Icon name="trash-2" size={24} color="#FF2056" />
      </View>

      {/* Title */}
      <Text style={styles.deleteTitle}>Delete Expense?</Text>

      {/* Message */}
      <Text style={styles.deleteMessage}>
        Are you sure you want to delete "{selectedExpense?.description}"?
        {"\n"}This action cannot be undone.
      </Text>

      {/* Buttons */}
      <View style={styles.deleteActions}>
        <Pressable
          style={styles.cancelDeleteBtn}
          onPress={() => setShowDeleteModal(false)}
        >
          <Text style={styles.cancelDeleteText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={styles.confirmDeleteBtn}
          onPress={confirmDelete}
        >
          <Text style={styles.confirmDeleteText}>Delete</Text>
        </Pressable>
      </View>

    </View>
  </View>
</Modal>
</View>
  );
}
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
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 15,
  marginBottom: 16,

  shadowColor: '#000',
  shadowOpacity: 0.01,
  elevation: 1,
  overflow: 'visible',  
},
title: {
  fontSize: 16,
  fontWeight: '600',
  color: '#101828',
},
amountRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

amount: {
  fontSize: 17,
  fontWeight: '700',
  color: '#101828',
  marginRight: 8,
},
menuButton: {
  padding: 4,
},

meta: {
  fontSize: 13,
  color: '#6A7282',
  marginTop: 6,
},
splitRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 7,
  marginTop: 1,
},
splitPill: {
  backgroundColor: '#F2F4F7',
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 14,
},
splitText: {
  fontSize: 12,
  color: '#344054',
},
metaLight: {
  fontSize: 13,
  color: '#98A2B3',
},

paidRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
  flexWrap: 'wrap',
},
owedText: {
  color: '#12B76A',
  fontWeight: '600',
},

settledText: {
  color: '#12B76A',
  fontWeight: '700',
},

oweText: {
  color: '#F04438',
  fontWeight: '600',
},

divider: {
  height: 1,
  backgroundColor: '#F2F4F7',
  marginVertical: 12,
},
splitList: {
  gap: 8,
},

splitStackItem: {
  backgroundColor: '#F2F4F7',
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  gap: 4,
},
  metaSmall: {
    fontSize: 12,
    color: '#99A1AF',
  },
  bold: {
    fontWeight: '600',
  },
  owed: {
    color: '#009966',
    marginTop: 6,
    fontWeight: '600',
  },
  owe: {
    color: '#FF2056',
    marginTop: 6,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  menu: {
    fontSize: 20,
  },
  dropdownItem: {
    paddingVertical: 6,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancel: {
    color: '#6A7282',
    fontWeight: '600',
  },
  save: {
    color: '#009966',
    fontWeight: '700',
  },
  delete: {
    color: '#FF2056',
    fontWeight: '300',
    fontFamily: 'Inter',
  },

dropdown: {
  position: 'absolute',
  top: 28,
  right: 0,
  width: 180,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  paddingVertical: 8,
  zIndex: 1000,
  elevation: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
},

menuItem: {
  paddingVertical: 12,
  paddingHorizontal: 16,
},

menuText: {
  fontSize: 14,
  fontWeight: '400',
  color: '#101828',
},

topRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

amountContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

menuRowItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

menuIcon: {
  width: 16,
  height: 16,
},

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  padding: 20,
},

editCard: {
  backgroundColor: '#FFF',
  borderRadius: 24,
  padding: 20,
  maxHeight: '85%',
},

modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},

label: {
  marginBottom: 6,
  fontWeight: '500',
  marginTop: 15,
},

amountInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingHorizontal: 12,
},

dollar: {
  marginRight: 4,
},

amountInput: {
  flex: 1,
  paddingVertical: 10,
},

modalActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
},

cancelBtn: {
  flex: 1,
  backgroundColor: '#E5E7EB',
  padding: 14,
  borderRadius: 16,
  alignItems: 'center',
  marginRight: 10,
},

saveBtn: {
  flex: 1,
  backgroundColor: '#009966',
  padding: 14,
  borderRadius: 16,
  alignItems: 'center',
},

deleteOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},

deleteCard: {
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: 28,
  paddingVertical: 30,
  paddingHorizontal: 25,
  alignItems: 'center',

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 25,
  elevation: 10,
},

deleteIconWrapper: {
  width: 48,
  height: 48,
  borderRadius: 35,
  backgroundColor: '#FFF5F7',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
},

deleteTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#101828',
  marginBottom: 10,
},

deleteMessage: {
  fontSize: 14,
  color: '#6A7282',
  textAlign: 'center',
  lineHeight: 20,
  marginBottom: 25,
},

deleteActions: {
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'space-between',
},

cancelDeleteBtn: {
  flex: 1,
  backgroundColor: '#E5E7EB',
  paddingVertical: 14,
  borderRadius: 16,
  alignItems: 'center',
  marginRight: 10,
},

confirmDeleteBtn: {
  flex: 1,
  backgroundColor: '#FF2056',
  paddingVertical: 14,
  borderRadius: 16,
  alignItems: 'center',
},

cancelDeleteText: {
  fontWeight: '800',
  color: '#101828',
  fontFamily: 'Inter',
  fontSize: 16,
},

confirmDeleteText: {
  fontWeight: '800',
  color: '#FFFFFF',
  fontFamily: 'Inter',
  fontSize: 16,
},


});
