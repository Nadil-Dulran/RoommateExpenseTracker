import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, Settlement } from '../../types';
import { expensesService } from '../../services/expensesService';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { Image } from 'react-native';
import deleteIcon from '../../../assets/delete.png';
import editIcon from '../../../assets/edit.png';
import Icon from 'react-native-vector-icons/Feather';
import { useAppCurrency } from '../../context/CurrencyContext';
import profileIcon from '../../../assets/ProfileIcon.png';
import { settlementService } from '../../services/settlementService';
import {
  extractSettlementExpenseId,
  extractSettlementsPayload,
  normalizeSettlement,
} from '../../utils/settlements';

type SplitMode = 'equal' | 'exact' | 'percentage';

interface GroupMember {
  id: string;
  name: string;
  avatarUri?: string | null;
}

const CATEGORY_KEYS: Expense['category'][] = [
  'food',
  'transport',
  'bills',
  'shopping',
  'entertainment',
  'other',
];

const normalizeCategoryType = (value?: string | null): Expense['category'] => {
  if (!value) {
    return 'other';
  }

  const normalized = String(value).trim().toLowerCase();
  return CATEGORY_KEYS.includes(normalized as Expense['category'])
    ? (normalized as Expense['category'])
    : 'other';
};

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

const renderAvatar = (avatar?: string | null) => {
  if (typeof avatar === 'number') {
    return avatar;
  }

  const uri = toImageUri(avatar);
  if (uri) {
    return { uri } as const;
  }

  return profileIcon;
};

const resolveSplitMemberName = (
  splitUserId: string,
  currentUserId: string,
  paidById: string,
  paidByName: string,
  members: GroupMember[]
) => {
  if (!splitUserId) {
    return 'Unknown';
  }

  if (splitUserId === currentUserId) {
    return 'You';
  }

  if (splitUserId === paidById) {
    return paidByName || `User ${splitUserId}`;
  }

  return (
    members.find(member => String(member.id) === String(splitUserId))?.name ??
    `User ${splitUserId}`
  );
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
    const avatarValue =
      member?.avatarBase64 ??
      null;

    const avatarMimeType =
      member?.avatarMimeType ??
      member?.avatar_mime_type ??
      member?.mimeType ??
      'image/jpeg';

    return {
      id: String(member?.id ?? member?.user_id ?? member?.userId ?? ''),
      name:
        member?.name ??
        'Unknown',
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
    if (Array.isArray(data?.data)) { return data.data; }
    if (Array.isArray(data?.members)) { return data.members; }
    return [];
  };

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

    const getSplitPercentage = (split: any) => {
      const value =
        split?.percentage ??
        split?.percent ??
        split?.percentageShare ??
        split?.percentage_share ??
        split?.sharePercentage ??
        split?.share_percentage ??
        split?.split_percentage ??
        split?.percentageSplit ??
        split?.percentage_split;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
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
        const percentage = getSplitPercentage(split);
        return percentage != null ? { userId, amount, percentage } : { userId, amount };
      })
      .filter((split: { userId: string; amount: number }) => !!split.userId && split.amount > 0);

    const resolveSplitType = (): Expense['splitType'] => {
      const rawType =
        raw?.splitType ??
        raw?.split_type ??
        raw?.splitMode ??
        raw?.split_mode ??
        raw?.splitStrategy ??
        raw?.split_strategy ??
        '';

      if (typeof rawType === 'string') {
        const normalized = rawType.trim().toLowerCase();
        if (normalized === 'equal' || normalized === 'exact' || normalized === 'percentage') {
          return normalized as Expense['splitType'];
        }
      }

      return undefined;
    };

    const rawCategoryLabel =
      raw?.category ??
      raw?.categoryName ??
      raw?.category_name ??
      raw?.categoryLabel ??
      raw?.category_label ??
      raw?.type ??
      null;

    const resolvedCategory = normalizeCategoryType(
      raw?.categoryType ??
        raw?.category_type ??
        rawCategoryLabel ??
        raw?.categoryEmoji ??
        raw?.category_emoji ??
        undefined
    );

    const categoryEmojiValue =
      raw?.categoryEmoji ??
      raw?.category_emoji ??
      raw?.categoryIcon ??
      raw?.category_icon ??
      null;

    const expenseDateField: Expense['originalExpenseDateField'] =
      raw?.expense_date != null
        ? 'expense_date'
        : raw?.expenseDate != null
        ? 'expenseDate'
        : raw?.date != null
        ? 'date'
        : undefined;

    const expenseDateValue =
      raw?.expense_date ??
      raw?.expenseDate ??
      raw?.date ??
      null;

    const resolvedDateValue =
      expenseDateValue ??
      raw?.createdAt ??
      raw?.created_at ??
      new Date().toISOString();

    return {
      id: String(raw?.id ?? raw?.expenseId ?? raw?.expense_id ?? ''),
      category: resolvedCategory,
      categoryLabel: rawCategoryLabel ?? undefined,
      categoryEmoji: categoryEmojiValue ?? undefined,
      description: raw?.description ?? raw?.title ?? 'Expense',
      amount: Number(raw?.amount ?? raw?.total ?? raw?.expense_amount ?? 0),
      date: String(resolvedDateValue),
      originalExpenseDateField: expenseDateField,
      originalExpenseDate: expenseDateValue ? String(expenseDateValue) : undefined,
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
      splitType: resolveSplitType(),
    };
  };

  const getGroupInfo = useCallback(
    (groupId: string) => backendGroups.find(g => String(g.id) === String(groupId)),
    [backendGroups]
  );

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
  }, [normalizeGroupInfo, normalizeMember]);

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
    }, [loadCurrentUserId, reloadAllData])
  );

  useEffect(() => {
    loadSettlementsForCurrentGroups();
  }, [backendGroups]);

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

  const normalizedEditAmountValue = useMemo(() => parseFloat(editAmount) || 0, [editAmount]);

  const equalShareAmount = useMemo(() => {
    if (!editParticipants.length) {
      return 0;
    }
    return normalizedEditAmountValue / editParticipants.length;
  }, [normalizedEditAmountValue, editParticipants.length]);

  const exactSplitsTotal = useMemo(() => {
    return Object.values(editExactSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  }, [editExactSplits]);

  const percentageSplitsTotal = useMemo(() => {
    return Object.values(editPercentageSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  }, [editPercentageSplits]);

  const percentageAmountMap = useMemo(() => {
    return editParticipants.reduce<Record<string, number>>((acc, member) => {
      const percent = parseFloat(editPercentageSplits[member.id] || '0');
      acc[member.id] = (normalizedEditAmountValue * percent) / 100;
      return acc;
    }, {});
  }, [editParticipants, editPercentageSplits, normalizedEditAmountValue]);

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

  const visibleExpenses = useMemo(() => {
    return expenses.filter(expense => !isSettlementDescription(expense.description));
  }, [expenses]);


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

  const isSettlementEntry = isSettlementDescription(item.description);
  const expenseSettlements = settlementsByExpenseId.get(String(item.id)) ?? [];

  const settledAmountForPair = (payerId: string, receiverId: string) => {
    return roundCurrency(
      expenseSettlements
        .filter(settlement => String(settlement.payerId) === payerId && String(settlement.receiverId) === receiverId)
        .reduce((sum, settlement) => sum + Number(settlement.amount ?? 0), 0)
    );
  };

  const resolvedPayerId = String(paidBy.id ?? '');
  const unsettledCounterparties = isMyExpense
    ? normalizedSplits
        .filter(split => String(split.userId) !== String(resolvedCurrentUserId))
        .map(split => {
          const settledAmount = settledAmountForPair(String(split.userId), resolvedCurrentUserId);
          return {
            userId: String(split.userId),
            amount: roundCurrency(split.amount),
            outstanding: roundCurrency(split.amount - settledAmount),
          };
        })
        .filter(split => split.outstanding >= 0.01)
    : null;

  const unsettledCounterparty = isMyExpense
    ? unsettledCounterparties?.[0] ?? null
    : null;

  const counterpartyId = isMyExpense
    ? unsettledCounterparty?.userId ?? ''
    : resolvedPayerId;

  const counterpartyName =
    group?.members?.find((member: any) => String(member.id) === String(counterpartyId))?.name ??
    (isMyExpense ? `User ${counterpartyId}` : paidByName);

  const settledAmount = isMyExpense
    ? 0
    : settledAmountForPair(resolvedCurrentUserId, resolvedPayerId);

  const totalOutstandingForPayer = isMyExpense
    ? roundCurrency(
        (unsettledCounterparties ?? []).reduce((sum, split) => sum + split.outstanding, 0)
      )
    : 0;

  const statusAmount = isMyExpense
    ? totalOutstandingForPayer
    : roundCurrency(myShareAmount - settledAmount);

  const isSettledWithCounterparty = isMyExpense
    ? (unsettledCounterparties?.length ?? 0) === 0
    : statusAmount < 0.01;

  const splitParticipantName = (splitUserId: string) =>
    resolveSplitMemberName(
      String(splitUserId),
      resolvedCurrentUserId,
      String(paidBy.id ?? ''),
      paidByName,
      (group?.members ?? []) as GroupMember[]
    );

  const splitParticipantsForSettle = normalizedSplits.map(split => ({
    userId: split.userId,
    amount: roundCurrency(split.amount),
    name: splitParticipantName(String(split.userId)),
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
    const memberName = splitParticipantName(String(split.userId));

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
        {visibleExpenses.length} total
      </Text>
      
<View style={{ flex: 1 }}>

<FlatList
  key={`expenses-${settlements.length}`}
  data={visibleExpenses}
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
  <Text style={styles.modalTitlee}>Edit Expense</Text>
  <Pressable onPress={dismissEditModal}>
    <Icon name="x" size={22} color="#6A7282" />
  </Pressable>
</View>

{/* Description */}
<Text style={styles.labell}>Description</Text>
<TextInput
  value={editDescription}
  onChangeText={setEditDescription}
  style={styles.inputt}
/>

{/* Amount */}
<Text style={styles.labell}>Amount</Text>
<View style={styles.amountInputContainer}>
  <Text style={styles.dollar}>{currency.symbol}</Text>
  <TextInput
    value={editAmount}
    onChangeText={setEditAmount}
    keyboardType="decimal-pad"
    style={styles.amountInput}
  />
</View>

{/* Split */}
<Text style={styles.labell}>Split</Text>

<View style={styles.splitToggleRow}>
  {['equal', 'exact', 'percentage'].map(type => (
    <Pressable
      key={type}
      onPress={() => handleSplitModeChange(type as SplitMode)}
      style={[
        styles.splitToggleBtn,
        splitType === type && styles.activeSplitToggle,
      ]}
    >
      <Text
        style={[
          styles.splitToggleText,
          splitType === type && styles.activeSplitText,
        ]}
      >
        {type === 'equal'
          ? 'Equal'
          : type === 'exact'
          ? 'Exact'
          : '%'}
      </Text>
    </Pressable>
  ))}
</View>

{/* Split Preview Box */}
<View style={styles.splitPreview}>
  <Text style={styles.splitPreviewTitle}>
    {splitType === 'equal'
      ? 'Split equally:'
      : splitType === 'exact'
      ? 'Enter exact amounts:'
      : 'Enter percentages:'}
  </Text>

  {editParticipants.length === 0 ? (
    <Text style={styles.metaLight}>No participants found for this expense.</Text>
  ) : (
    <>
      {splitType === 'equal' &&
        editParticipants.map(member => (
          <View key={member.id} style={styles.splitRowItem}>
            <View style={styles.splitLeft}>
              <Image source={renderAvatar(member.avatarUri)} style={styles.splitAvatar} />
              <Text style={styles.splitName}>{member.name}</Text>
            </View>
            <View style={styles.splitRowRight}>
              <Text style={styles.splitAmount}>
                {currency.symbol}
                {roundCurrency(equalShareAmount || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

      {splitType === 'exact' && (
        <>
          {editParticipants.map(member => (
            <View key={member.id} style={styles.splitRowItem}>
              <View style={styles.splitLeft}>
                <Image source={renderAvatar(member.avatarUri)} style={styles.splitAvatar} />
                <Text style={styles.splitName}>{member.name}</Text>
              </View>
              <View style={styles.splitRowRight}>
                <TextInput
                  style={styles.splitInput}
                  keyboardType="decimal-pad"
                  value={editExactSplits[member.id] ?? '0'}
                  onChangeText={value =>
                    setEditExactSplits(prev => ({
                      ...prev,
                      [member.id]: value,
                    }))
                  }
                />
              </View>
            </View>
          ))}
          <Text
            style={[
              styles.splitSummaryText,
              Math.abs(exactSplitsTotal - normalizedEditAmountValue) < 0.01
                ? styles.splitSummarySuccess
                : styles.splitSummaryError,
            ]}
          >
            {formatCurrency(exactSplitsTotal)} / {formatCurrency(normalizedEditAmountValue)}
          </Text>
        </>
      )}

      {splitType === 'percentage' && (
        <>
          {editParticipants.map(member => (
            <View key={member.id} style={styles.splitRowItem}>
              <View style={styles.splitLeft}>
                <Image source={renderAvatar(member.avatarUri)} style={styles.splitAvatar} />
                <Text style={styles.splitName}>{member.name}</Text>
              </View>
              <View style={styles.splitRowRight}>
                <View style={styles.percentageInputGroup}>
                  <TextInput
                    style={styles.percentageInput}
                    keyboardType="decimal-pad"
                    value={editPercentageSplits[member.id] ?? '0'}
                    onChangeText={value =>
                      setEditPercentageSplits(prev => ({
                        ...prev,
                        [member.id]: value,
                      }))
                    }
                  />
                  <Text style={styles.percentageSuffix}>%</Text>
                </View>
                <Text style={styles.splitAmount}>
                  {currency.symbol}
                  {roundCurrency(percentageAmountMap[member.id] ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          <Text
            style={[
              styles.splitSummaryText,
              Math.abs(percentageSplitsTotal - 100) < 0.1
                ? styles.splitSummarySuccess
                : styles.splitSummaryError,
            ]}
          >
            {percentageSplitsTotal.toFixed(2)}% / 100%
          </Text>
        </>
      )}
    </>
  )}
</View>

<View style={styles.modalActions}>
  <Pressable style={styles.cancelBtn} onPress={dismissEditModal}>
    <Text style={styles.cancel}>Cancel</Text>
  </Pressable>

  <Pressable
    style={[styles.saveBtn, isSavingEdit && { opacity: 0.6 }]}
    onPress={confirmEdit}
    disabled={isSavingEdit}
  >
    <Text style={styles.save}>{isSavingEdit ? 'Saving...' : 'Save Changes'}</Text>
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
    color: '#FFFFFF',
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
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 20,
  maxHeight: '85%',
},

modalTitlee: {
  fontSize: 22,
  fontWeight: '700',
  color: '#101828',
},

labell: {
  fontSize: 14,
  fontWeight: '600',
  color: '#344054',
  marginTop: 18,
  marginBottom: 8,
},

inputt: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  padding: 14,
  fontSize: 15,
},

amountInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  paddingHorizontal: 14,
},

dollar: {
  marginRight: 6,
  fontSize: 16,
},

amountInput: {
  flex: 1,
  paddingVertical: 12,
  fontSize: 15,
},

/* Split Toggle */
splitToggleRow: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 6,
},

splitToggleBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  alignItems: 'center',
},

activeSplitToggle: {
  backgroundColor: '#E6F4EC',
  borderColor: '#009966',
},

splitToggleText: {
  color: '#6A7282',
  fontWeight: '500',
},

activeSplitText: {
  color: '#009966',
  fontWeight: '600',
},

/* Split Preview */
splitPreview: {
  marginTop: 14,
  backgroundColor: '#F9FAFB',
  borderRadius: 18,
  padding: 14,
},

splitPreviewTitle: {
  fontSize: 13,
  color: '#6A7282',
  marginBottom: 10,
},

splitRowItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 10,
},

splitLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginRight: 12,
},

splitAvatar: {
  width: 28,
  height: 28,
  borderRadius: 14,
  marginRight: 8,
},

splitName: {
  fontSize: 14,
  color: '#101828',
},

splitAmount: {
  fontSize: 15,
  fontWeight: '600',
  color: '#101828',
},

splitRowRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

splitInput: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingVertical: 8,
  paddingHorizontal: 12,
  minWidth: 90,
  backgroundColor: '#FFFFFF',
  textAlign: 'right',
  fontSize: 14,
},

splitSummaryText: {
  marginTop: 6,
  fontSize: 12,
  fontWeight: '600',
  textAlign: 'right',
},

splitSummarySuccess: {
  color: '#12B76A',
},

splitSummaryError: {
  color: '#F04438',
},


percentageInputGroup: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: '#FFFFFF',
  minWidth: 95,
  justifyContent: 'flex-end',
},

percentageInput: {
  minWidth: 50,
  paddingVertical: 4,
  textAlign: 'right',
},

percentageSuffix: {
  marginLeft: 4,
  color: '#6A7282',
  fontWeight: '600',
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
