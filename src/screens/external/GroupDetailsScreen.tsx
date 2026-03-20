import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { RootStackParamList } from '../../types/navigation';
import { Expense, User } from '../../types';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { expensesService } from '../../services/expensesService';

type RouteProps = RouteProp<RootStackParamList, 'GroupDetails'>;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

export default function GroupDetailsScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();

  const { id, group: routeGroup } = route.params;

  const initialGroup = routeGroup ?? {
    id: String(id),
    name: 'Group',
    emoji: '👥',
    members: [],
  };
  const [groupData, setGroupData] = useState<any>(initialGroup);
  const group = groupData;
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editName, setEditName] = useState(group?.name ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState(group?.emoji ?? '🏠');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [emailInvite, setEmailInvite] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  const getCategoryIcon = (value: unknown) => {
    const normalized = String(value ?? 'other').trim().toLowerCase();
    const iconMap: Record<string, string> = {
      food: '🍔',
      travel: '✈️',
      utilities: '💡',
      shopping: '🛍️',
      entertainment: '🎬',
      other: '📦',
      work: '💼',
      rent: '🏠',
      transport: '🚕',
      grocery: '🛒',
    };

    return iconMap[normalized] ?? '📦';
  };

  const toImageUri = (value?: string | null, mimeType?: string | null) => {
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

    const compactBase64 = normalizedValue.replace(/\s/g, '');
    const normalizedMime = mimeType?.trim() || 'image/jpeg';

    return `data:${normalizedMime};base64,${compactBase64}`;
  };

  const normalizeMembers = (membersRaw: any[]) => {
    return (membersRaw || []).map((member: any, index: number) => {
      return {
        id: String(
          member?.id ??
          member?.user_id ??
          member?.userId ??
          member?.user?.id ??
          `member-${index}`
        ),
        name:
          member?.name ??
          member?.user?.name ??
          member?.full_name ??
          'Member',
        avatar: toImageUri(
          member?.avatarBase64 ?? member?.avatar_base64 ?? member?.avatar,
          member?.avatarMimeType ?? member?.avatar_mime_type ?? null
        )
      };
    });
  };

  const extractExpensesPayload = (data: any): any[] => {
    if (Array.isArray(data)) { return data; }
    if (Array.isArray(data?.data)) { return data.data; }
    if (Array.isArray(data?.expenses)) { return data.expenses; }
    if (Array.isArray(data?.items)) { return data.items; }
    if (Array.isArray(data?.data?.expenses)) { return data.data.expenses; }
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

    const splits = splitsRaw
      .map((split: any) => ({
        userId: getSplitUserId(split),
        amount: getSplitAmount(split),
      }))
      .filter((split: { userId: string; amount: number }) => !!split.userId && split.amount > 0);

    return {
      id: String(raw?.id ?? raw?.expenseId ?? raw?.expense_id ?? ''),
      category: String(raw?.category ?? raw?.type ?? 'other').toLowerCase() as Expense['category'],
      description: raw?.description ?? raw?.title ?? 'Expense',
      amount: Number(raw?.amount ?? raw?.total ?? raw?.expense_amount ?? 0),
      date: String(raw?.date ?? raw?.expense_date ?? raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()),
      groupId: String(raw?.groupId ?? raw?.group_id ?? raw?.group?.id ?? id),
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
      splits,
    };
  };

  const sortRawExpensesByLatest = (items: any[]) => {
    return [...items].sort((a, b) => {
      const aTime = Date.parse(String(a?.createdAt ?? a?.created_at ?? a?.date ?? a?.expense_date ?? ''));
      const bTime = Date.parse(String(b?.createdAt ?? b?.created_at ?? b?.date ?? b?.expense_date ?? ''));

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

  const loadGroupInfo = useCallback(async () => {
    try {
      const groupsResponse = await groupsService.getGroups();
      const groupsRaw = Array.isArray(groupsResponse)
        ? groupsResponse
        : Array.isArray(groupsResponse?.data)
        ? groupsResponse.data
        : Array.isArray(groupsResponse?.groups)
        ? groupsResponse.groups
        : [];

      const matched = groupsRaw.find((g: any) => String(g?.id) === String(id));
      if (!matched) {
        return;
      }

      setGroupData((prev: any) => ({
        ...prev,
        id: String(matched?.id ?? prev?.id ?? id),
        name: matched?.name ?? prev?.name ?? 'Group',
        emoji: matched?.emoji ?? prev?.emoji ?? '👥',
      }));
    } catch (error) {
      console.log('Failed to load group info', error);
    }
  }, [id]);

  const extractMembersPayload = (data: any) => {
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

  const loadGroupMembers = useCallback(async () => {
    try {
      const response = await groupMembersService.getMembers(group?.id ?? id);
      const members = normalizeMembers(extractMembersPayload(response));

      if (members.length > 0) {
        setGroupData((prev: any) => ({
          ...prev,
          members,
        }));
      }
    } catch (error) {
      console.log('Failed to load group members', error);
    }
  }, [group?.id, id]);

  const loadGroupExpenses = useCallback(async () => {
    const targetGroupId = Number(group?.id ?? id);

    try {
      let rawExpenses: any[] = [];

      if (Number.isFinite(targetGroupId)) {
        try {
          rawExpenses = extractExpensesPayload(await expensesService.getExpenses(targetGroupId));
        } catch {
          rawExpenses = [];
        }
      }

      if (rawExpenses.length === 0) {
        const allExpenses = extractExpensesPayload(await expensesService.getExpenses());
        rawExpenses = allExpenses.filter(item =>
          String(item?.groupId ?? item?.group_id ?? item?.group?.id ?? '') === String(group?.id ?? id)
        );
      }

      const normalized = sortRawExpensesByLatest(rawExpenses)
        .map(normalizeExpense)
        .filter((expense: Expense) => !!expense.id);

      setGroupExpenses(normalized);
    } catch (error) {
      console.log('Failed to load group expenses', error);
      setGroupExpenses([]);
    }
  }, [group?.id, id]);

  useEffect(() => {
    loadCurrentUserId();
    loadGroupInfo();
    loadGroupMembers();
    loadGroupExpenses();
  }, [loadCurrentUserId, loadGroupInfo, loadGroupMembers, loadGroupExpenses]);

  useEffect(() => {
    setEditName(group?.name ?? '');
    setSelectedEmoji(group?.emoji ?? '🏠');
  }, [group?.name, group?.emoji]);

  const handleUpdateGroup = async () => {
    try {
      const response = await groupsService.updateGroup(group?.id ?? id, {
        name: editName,
        emoji: selectedEmoji,
      });

      const updated = response?.data ?? response?.group ?? response ?? {};

      setGroupData((prev: any) => ({
        ...prev,
        name: updated?.name ?? editName,
        emoji: updated?.emoji ?? selectedEmoji,
      }));

      setShowEditModal(false);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await groupsService.deleteGroup(group?.id ?? id);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Delete failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  if (!group) {
    return (
      <View style={styles.center}>
        <Text>Group not found</Text>
      </View>
    );
  }

  // ---------------------------
  // BALANCE CALCULATIONS
  // ---------------------------

  const groupBalance = useMemo(
    () => {
      const me = String(currentUserId || '');
      if (!me) {
        return { amount: 0, isYouOwing: false };
      }

      let totalOwed = 0;
      let totalOwing = 0;

      groupExpenses.forEach(expense => {
        const mySplit = expense.splits.find(split => String(split.userId) === me);
        const isYouPaid = String(expense.paidBy.id) === me;

        if (isYouPaid) {
          expense.splits.forEach(split => {
            if (String(split.userId) !== me) {
              totalOwed += Number(split.amount || 0);
            }
          });
          return;
        }

        if (mySplit) {
          totalOwing += Number(mySplit.amount || 0);
        }
      });

      const net = totalOwed - totalOwing;
      return {
        amount: Math.abs(net),
        isYouOwing: net < 0,
      };
    },
    [currentUserId, groupExpenses]
  );

  const memberBalances = useMemo(
    () => {
      const me = String(currentUserId || '');
      if (!me) {
        return [];
      }

      const memberMap = new Map<string, { id: string; name: string; avatar?: any; amount: number }>();

      groupExpenses.forEach(expense => {
        const paidById = String(expense.paidBy.id || '');
        const mySplit = expense.splits.find(split => String(split.userId) === me);

        if (paidById === me) {
          expense.splits.forEach(split => {
            const splitUserId = String(split.userId || '');
            if (!splitUserId || splitUserId === me) {
              return;
            }

            const existing = memberMap.get(splitUserId);
            const memberInfo = (group.members || []).find((member: any) => String(member.id) === splitUserId);

            memberMap.set(splitUserId, {
              id: splitUserId,
              name: memberInfo?.name ?? `Member ${splitUserId}`,
              avatar: memberInfo?.avatar,
              amount: (existing?.amount ?? 0) + Number(split.amount || 0),
            });
          });

          return;
        }

        if (mySplit && paidById) {
          const existing = memberMap.get(paidById);
          const memberInfo = (group.members || []).find((member: any) => String(member.id) === paidById);

          memberMap.set(paidById, {
            id: paidById,
            name: memberInfo?.name ?? expense.paidBy.name ?? `Member ${paidById}`,
            avatar: memberInfo?.avatar,
            amount: (existing?.amount ?? 0) - Number(mySplit.amount || 0),
          });
        }
      });

      return Array.from(memberMap.values())
        .map(member => ({
          ...member,
          isYouPaying: member.amount < 0,
          amount: Math.abs(member.amount),
        }))
        .filter(member => member.amount > 0);
    },
    [currentUserId, groupExpenses, group?.members]
  );

  const calculateUserShareFromSplits = useCallback((expense: Expense) => {
    const me = String(currentUserId || '');
    if (!me) {
      return null;
    }

    const mySplit = expense.splits.find(split => String(split.userId) === me);
    if (!mySplit) {
      return null;
    }

    if (String(expense.paidBy.id) === me) {
      const othersOwe = expense.splits
        .filter(split => String(split.userId) !== me)
        .reduce((sum, split) => sum + Number(split.amount || 0), 0);

      return {
        type: 'owed' as const,
        amount: othersOwe,
      };
    }

    return {
      type: 'owing' as const,
      amount: Number(mySplit.amount || 0),
    };
  }, [currentUserId]);

  const resolveMemberNameById = useCallback((memberId: string, fallbackName = 'Unknown') => {
    const member = (group?.members || []).find((m: any) => String(m.id) === String(memberId));
    return member?.name ?? fallbackName;
  }, [group?.members]);

  // ---------------------------
  // UI
  // ---------------------------
const renderAvatar = (avatar?: string | any) => {
  if (!avatar) {
    return require('../../../assets/ProfileIcon.png'); // fallback image
  }

  return typeof avatar === 'string'
    ? { uri: avatar }
    : avatar;
};


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#6a7282" />
          </TouchableOpacity>

          <TouchableOpacity
             onPress={() => setShowMenu(true)}
             style={styles.menuButton}
           >
            <Icon name="more-vertical" size={22} color="#6a7282" />
          </TouchableOpacity>
        </View>

        {/* Drop down Menu */}
        {showMenu && (
  <View style={styles.menuOverlay}>
    <TouchableOpacity
      style={styles.overlayBackground}
      onPress={() => setShowMenu(false)}
    />

    <View style={styles.menuCard}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          setShowEditModal(true);
        }}
      >
        <Icon name="edit-2" size={18} color="#101828" />
        <Text style={styles.menuText}>Edit Group</Text>
      </TouchableOpacity>

      <View style={styles.menuDivider} />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMenu(false);
          setShowDeleteModal(true);
          setShowEditModal(false);
        }}
      >
        <Icon name="trash-2" size={18} color="#ff2056" />
        <Text style={[styles.menuText, { color: '#ff2056' }]}>
          Delete Group
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}
      
      {/* Edit Modal */}

<Modal
  visible={showEditModal}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlayCenter}>
    <View style={styles.editCard}>

      <Text style={styles.editTitle}>Edit Group</Text>

      {/* Group Name */}
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        value={editName}
        onChangeText={setEditName}
        style={styles.input}
        placeholder="Enter group name"
      />

      {/* Emoji Section */}
      <Text style={styles.label}>Emoji</Text>

      <View style={styles.emojiRow}>
        {['🏠','✈️','📄','🎉','🍕','🎬','⚽','🎵'].map(emoji => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.emojiButton,
              selectedEmoji === emoji && styles.emojiSelected
            ]}
            onPress={() => setSelectedEmoji(emoji)}
          >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.editButtonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowEditModal(false)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateGroup}
        >
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>

{/* Delete Modal */}
<Modal visible={showDeleteModal} transparent animationType="fade">
  <View style={styles.modalOverlayy}>
    <View style={styles.confirmCard}>
      <Icon name="trash-2" size={28} color="#ff2056" />

      <Text style={styles.modalTitlee}>Delete Group?</Text>

      <Text style={styles.modalDescription}>
        Are you sure you want to delete "{group.name}" ? This action cannot be undone and all expense history will be lost.
      </Text>

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={styles.cancelBtnn}
          onPress={() => setShowDeleteModal(false)}
        >
          <Text>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteGroup}
        >
          <Text style={{ color: '#fff' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.emojiBox}>
            <Text style={{ fontSize: 28 }}>{group.emoji}</Text>
          </View>

          <View style={{ flex: 0 }}>
            <Text style={styles.groupName}>{group.name}</Text>

            <View style={styles.avatarStack}>
              {(group.members || []).slice(0, 4).map((member: any, index: number) => (
                <Image
                  key={member.id}
                  source={renderAvatar(member.avatar)}
                  style={[
                    styles.avatar,
                    { marginLeft: index === 0 ? 0 : -10 },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your balance</Text>

          <Text
            style={[
              styles.balanceAmount,
              {
                color: groupBalance.isYouOwing
                  ? '#ff2056'
                  : '#009966',
              },
            ]}
          >
            <Text style={styles.memberAmount}>
            <Text style={{ fontFamily: Platform.OS === 'android' ? 'monospace' : 'System' }}>
              $
           </Text>
            {groupBalance.amount.toFixed(2)}
          </Text>
          </Text>

          <Text
            style={{
              color: groupBalance.isYouOwing
                ? '#ff2056'
                : '#009966',
            }}
          >
            {groupBalance.amount === 0
              ? 'All settled'
              : groupBalance.isYouOwing
              ? 'You owe'
              : 'You are owed'}
          </Text>
        </View>

        {/* Member Balances */}
        <Text style={styles.sectionTitle}>Balances with members</Text>

        {memberBalances.map(member => (
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
             <Image
               source={renderAvatar(member.avatar)}
               style={styles.avatarLarge}
             />

              <View>
                <Text style={styles.memberName}>
                  {member.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: member.isYouPaying
                      ? '#ff2056'
                      : '#009966',
                  }}
                >
                  {member.isYouPaying
                    ? 'you owe'
                    : 'owes you'}
                </Text>
              </View>
            </View>

            <View style={styles.memberActionRow}>
              <Text
                style={[
                  styles.memberAmountt,
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
                style={[
                  styles.settleBtn,
                  {
                    backgroundColor: member.isYouPaying
                      ? '#ff2056'
                      : '#009966',
                  },
                ]}
                onPress={() =>
                  navigation.navigate('SettleUp', {
                    mode: 'single',
                    memberId: member.id,
                    amount: member.amount,
                  })
                }
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
                  Settle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Group Members */}
        <View style={styles.membersSection}>
  {/* Header */}
  <View style={styles.membersHeader}>
    <Text style={styles.membersCount}>
      {(group.members || []).length} members
    </Text>

    <TouchableOpacity
      style={styles.addBtn}
      onPress={() => setShowInviteModal(true)}
    >
     <Icon name="user-plus" size={16} color="#009966" />
     <Text style={styles.addText}>Add</Text>
    </TouchableOpacity>
  </View>

  {/* Invite Modal */}
  <Modal
  visible={showInviteModal}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlayCenter}>
    <View style={styles.inviteCard}>

      {/* Header */}
      <View style={styles.inviteHeader}>
        <Text style={styles.inviteTitle}>Invite Members</Text>

        <TouchableOpacity onPress={() => setShowInviteModal(false)}>
          <Icon name="x" size={22} color="#6a7282" />
        </TouchableOpacity>
      </View>

      <Text style={styles.inviteSubtitle}>
        Share this group with others via invite link or email
      </Text>

      {/* Invite Link */}
      <Text style={styles.label}>Invite Link</Text>

      <View style={styles.linkRow}>
        <TextInput
          value={`https://splitwise.app/invite/${group.id}`}
          editable={false}
          style={styles.linkInput}
        />

        <TouchableOpacity
          style={styles.copyBtn}
          onPress={() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
          }}
        >
          <Icon name="copy" size={16} color="#fff" />
          <Text style={styles.copyText}>
            {linkCopied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={{ color: '#99a1af' }}>OR</Text>
        <View style={styles.divider} />
      </View>

      {/* Email Invite */}
      <Text style={styles.label}>Send Email Invite</Text>

      <View style={styles.linkRow}>
        <TextInput
          placeholder="friend@example.com"
          value={emailInvite}
          onChangeText={setEmailInvite}
          style={styles.linkInput}
        />

        <TouchableOpacity
          disabled={!emailInvite}
          style={[
            styles.sendBtn,
            !emailInvite && { backgroundColor: '#e5e7eb' }
          ]}
          onPress={() => {
            setEmailInvite('');
            setShowInviteModal(false);
          }}
        >
          <Icon name="mail" size={16} color="#fff" />
          <Text style={styles.copyText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setShowInviteModal(false)}
      >
        <Text style={{ fontWeight: '600' }}>Close</Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>

  {/* Members List */}
  {(group.members || []).map((member: any) => (
    <View key={member.id} style={styles.memberRow}>
      <View style={styles.memberRowLeft}>
      <Image
        source={renderAvatar(member.avatar)}
        style={styles.avatarLarge}
      />

        <View>
          <Text style={styles.memberRowName}>
            {member.name}
            {String(member.id) === String(currentUserId) && (
              <Text style={styles.youLabel}> (you)</Text>
            )}
          </Text>
        </View>
      </View>

      {String(member.id) !== String(currentUserId) && (
      <TouchableOpacity
       style={styles.removeBtn}
       onPress={() => {
          setMemberToRemove(member);
          setShowRemoveModal(true);
        }}
      >
       <Icon name="user-minus" size={16} color="#ff2056" />
      </TouchableOpacity>
      )}
    </View>
  ))}
</View>

    {/* Remove Confirm Modal */}
    <Modal
  visible={showRemoveModal}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlayCenter}>
    <View style={styles.removeCard}>

      {/* Icon Circle */}
      <View style={styles.removeIconCircle}>
        <Icon name="user-minus" size={28} color="#ff2056" />
      </View>

      {/* Title */}
      <Text style={styles.removeTitle}>
        Remove {memberToRemove?.name}?
      </Text>

      {/* Description */}
      <Text style={styles.removeDescription}>
        Are you sure you want to remove {memberToRemove?.name} from "{group.name}"?
        They will lose access to this group's expenses.
      </Text>

      {/* Buttons */}
      <View style={styles.removeButtonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowRemoveModal(false);
            setMemberToRemove(null);
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmRemoveButton}
          onPress={async () => {
            try {
              if (memberToRemove) {
                await groupMembersService.removeMember(group?.id ?? id, memberToRemove.id);

                setGroupData((prev: any) => ({
                  ...prev,
                  members: (prev?.members || []).filter((m: any) => m.id !== memberToRemove.id),
                }));
              }

              setShowRemoveModal(false);
              setMemberToRemove(null);
            } catch (error) {
              Alert.alert(
                'Remove failed',
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }}
        >
          <Text style={styles.confirmRemoveText}>Remove</Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>


        {/* Recent Expenses */}
        <View style={styles.expenseHeader}>
          <Text style={styles.sectionTitlee}>Recent Expenses</Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SettleUp', { mode: 'all' })
            }
          >
            <Text style={{ color: '#009966' }}>Settle up</Text>
          </TouchableOpacity>
        </View>

{groupExpenses.slice(0, 3).map(expense => {
  const categoryIcon = getCategoryIcon(expense.category);
  const share = calculateUserShareFromSplits(expense);
  const isCurrentUserPayer = String(expense.paidBy.id) === String(currentUserId);
  const paidByName =
    expense.paidBy.name && expense.paidBy.name !== 'Unknown'
      ? expense.paidBy.name
      : resolveMemberNameById(String(expense.paidBy.id), `Member ${expense.paidBy.id}`);

  // determine memberId for navigation
  const memberId =
    isCurrentUserPayer
      ? expense.splits.find(s => String(s.userId) !== String(currentUserId))?.userId ?? ''
      : expense.paidBy.id;

  const amount = share?.amount ?? 0;


  return (
    <TouchableOpacity
      key={expense.id}
      style={styles.expenseCard}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('SettleUp', {
          mode: 'single',
          memberId,
          amount,
        })
      }
    >
      {/* LEFT ICON */}
      <View style={styles.categoryIconn}>
        <Text style={{ fontSize: 18 }}>{categoryIcon}</Text>
      </View>

      {/* RIGHT CONTENT */}
      <View style={styles.expenseContent}>

        {/* Row 1: Title + Amount */}
        <View style={styles.rowBetween}>
          <Text style={styles.expenseTitlee}>
            {expense.description}
          </Text>

          <Text style={styles.expenseAmount}>
            ${expense.amount.toFixed(2)}
          </Text>
        </View>

        {/* Row 2: Paid + Date */}
        <View style={styles.rowBetween}>
          <Text style={styles.expenseSubb}>
            {isCurrentUserPayer
              ? 'You paid'
              : `${paidByName} paid`}
          </Text>

          <Text style={styles.expenseDate}>
            {new Date(expense.date).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric' }
            )}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.expenseDivider} />

        {/* Row 3: Share */}
        {share && (
          <Text
            style={[
              styles.expenseShare,
              {
                color:
                  share.type === 'owed'
                    ? '#009966'
                    : '#ff2056',
              },
            ]}
          >
            {share.type === 'owed'
              ? `You are owed: $${share.amount.toFixed(2)}`
              : `You owe: $${share.amount.toFixed(2)}`}
          </Text>
        )}

      </View>
    </TouchableOpacity>
  );
})}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 10,
  },

  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 23,
  },

  emojiBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#d4d6da',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  groupName: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 7,
  },

  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: '#101828',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  balanceLabel: {
    color: '#99a1af',
    marginBottom: 6,
  },

  balanceAmount: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7282',
    marginHorizontal: 20,
    marginBottom: 10,
  },
    sectionTitlee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7282',
    marginBottom: 10,
  },

  memberCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#f3f4f6',
    borderWidth: 2,
  },

  owingCard: {
    backgroundColor: '#fff5f7',
  },

  owedCard: {
    backgroundColor: '#ecfdf5',
  },

  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  memberName: {
    fontSize: 17,
    fontWeight: '500',
  },

  settleBtn: {
    paddingHorizontal: 17,
    paddingVertical: 7,
    borderRadius: 10,
  },

  memberActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  memberAmount: {
    fontSize: 35,
    fontWeight: 'bold',
    marginRight: 12,
  },
   memberAmountt: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
  },

  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  expenseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#f3f4f6',
    borderWidth: 2,
  },

  avatarStack: {
   flexDirection: 'row',
   marginRight: 8,
},

avatar: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#fff',
},
membersSection: {
  marginHorizontal: 20,
  marginTop: 20,
  marginBottom: 10,
},

membersHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

membersCount: {
  fontSize: 14,
  fontWeight: '600',
  color: '#6a7282',
},

addBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},

addText: {
  color: '#009966',
  fontWeight: '600',
  marginLeft: 4,
},

memberRow: {
  backgroundColor: '#ffffff',
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 14,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#f3f4f6',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

memberRowLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

avatarLarge: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginRight: 12,
  borderWidth: 2,
  borderColor: '#fff',
},

avatarText: {
  color: '#fff',
  fontWeight: 'bold',
},

memberRowName: {
  fontSize: 14,
  fontWeight: '600',
  color: '#101828',
},

youLabel: {
  fontSize: 13,
  fontWeight: '400',
  color: '#6a7282',
},

removeBtn: {
  padding: 6,
},
menuButton: {
  padding: 8,
},

menuOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100,
},

overlayBackground: {
  flex: 1,
},

menuCard: {
  position: 'absolute',
  top: 60,
  right: 20,
  backgroundColor: '#fff',
  borderRadius: 16,
  paddingVertical: 8,
  width: 180,
  elevation: 3,
},

menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  gap: 10,
},

menuText: {
  fontSize: 14,
  fontWeight: '400',
},

menuDivider: {
  height: 1,
  backgroundColor: '#f3f4f6',
},

modalOverlayy: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},

confirmCard: {
  backgroundColor: '#fff',
  borderRadius: 24,
  padding: 24,
  width: '90%',
  alignItems: 'center',
},

modalTitlee: {
  fontSize: 20,
  fontWeight: 'bold',
  marginVertical: 12,
},

modalDescription: {
  textAlign: 'center',
  color: '#6a7282',
  marginBottom: 20,
},

modalButtons: {
  flexDirection: 'row',
  gap: 12,
  width: '100%',
},

cancelBtnn: {
  flex: 1,
  backgroundColor: '#f3f4f6',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

saveBtn: {
  flex: 1,
  backgroundColor: '#009966',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

deleteBtn: {
  flex: 1,
  backgroundColor: '#ff2056',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},
modalOverlayCenter: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},

editCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
},


editTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 20,
},

label: {
  fontSize: 14,
  color: '#6a7282',
  marginBottom: 8,
  marginTop: 10,
},

input: {
  backgroundColor: '#f9fafb',
  borderRadius: 16,
  padding: 14,
  fontSize: 16,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

emojiRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 10,
},

emojiButton: {
  width: 33,
  height: 48,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderWidth: 2,
  borderColor: '#E5E7EB',
},

emojiSelected: {
  borderWidth: 2,
  borderColor: '#009966',
  backgroundColor: '#ecfdf5',
},

editButtonRow: {
  flexDirection: 'row',
  marginTop: 30,
  gap: 14,
},

cancelButton: {
  flex: 1,
  backgroundColor: '#f3f4f6',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},

saveButton: {
  flex: 1,
  backgroundColor: '#009966',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},

cancelText: {
  fontSize: 16,
  fontWeight: '600',
},

saveText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#fff',
},

inviteCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
},

inviteHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

inviteTitle: {
  fontSize: 22,
  fontWeight: 'bold',
},

inviteSubtitle: {
  marginTop: 10,
  marginBottom: 20,
  color: '#6a7282',
},

linkRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 20,
},

linkInput: {
  flex: 1,
  backgroundColor: '#f9fafb',
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

copyBtn: {
  backgroundColor: '#009966',
  paddingHorizontal: 16,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  gap: 6,
},

sendBtn: {
  backgroundColor: '#009966',
  paddingHorizontal: 16,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  gap: 6,
},

copyText: {
  color: '#fff',
  fontWeight: '600',
},

dividerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 20,
},

divider: {
  flex: 1,
  height: 1,
  backgroundColor: '#e5e7eb',
},

closeBtn: {
  backgroundColor: '#f3f4f6',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},
removeCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
  alignItems: 'center',
},

removeIconCircle: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: '#ffe8ed',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
},

removeTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
},

removeDescription: {
  textAlign: 'center',
  color: '#6a7282',
  marginBottom: 28,
  lineHeight: 20,
},

removeButtonRow: {
  flexDirection: 'row',
  gap: 12,
},

confirmRemoveButton: {
  flex: 1,
  backgroundColor: '#ff2056',
  padding: 16,
  borderRadius: 18,
  alignItems: 'center',
},

confirmRemoveText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},

categoryIconn: {
  width: 50,
  height: 50,
  borderRadius: 16,
  backgroundColor: '#f3f4f6',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
  marginTop: 20,
},

expenseContent: {
  flex: 1,
},

rowBetween: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

expenseTitlee: {
  fontSize: 16,
  fontWeight: '600',
},

expenseAmount: {
  fontSize: 18,
  fontWeight: '700',
},

expenseSubb: {
  fontSize: 13,
  color: '#6a7282',
  marginTop: 4,
},

expenseDate: {
  fontSize: 13,
  color: '#99a1af',
},

expenseDivider: {
  height: 1,
  backgroundColor: '#f3f4f6',
  marginVertical: 10,
},

expenseShare: {
  fontSize: 14,
  fontWeight: '600',
},
});