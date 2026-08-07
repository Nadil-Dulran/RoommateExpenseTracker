import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../../types/navigation';
import { Expense } from '../../types';
import Icon from 'react-native-vector-icons/Feather';
import { Image } from 'react-native';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { expensesService } from '../../services/expensesService';
import { settlementService } from '../../services/settlementService';
import { calculateGroupBalance } from '../../utils/balance';
import { normalizeExpense, sortRawExpensesByLatest } from '../../utils/expenses';
import { extractSettlementsPayload, normalizeSettlement } from '../../utils/settlements';
import profileIcon from '../../../assets/ProfileIcon.png';
import { useAppCurrency } from '../../context/CurrencyContext';
import { Settlement } from '../../types';
import { emojis } from '../../constants/emojis';
import GroupModal from '../../components/groups/GroupModal';
import { styles } from './styles/Main.styles';

type GroupsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Groups'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const JOIN_GROUP_RESULT_KEY = '@roommate/join-group-result';

export default function GroupsScreen() {
  const navigation = useNavigation<GroupsNavigationProp>();
  const { formatCurrency } = useAppCurrency();

  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0]);

  const toImageUri = useCallback((value?: string | null, mimeType?: string | null) => {
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
  }, []);

  const getAvatarSource = (avatar: any) => {
    if (!avatar) {
      return profileIcon;
    }

    return typeof avatar === 'string' ? { uri: avatar } : avatar;
  };

  const toTimestamp = (value: any) => {
    if (!value) {
      return 0;
    }

    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeMembers = useCallback((membersRaw: any[]) => {
    return (membersRaw || []).map((member: any, index: number) => {
      return {
        id: String(
          member?.id ??
          `member-${index}`
        ),
        name:
          member?.name ??
          'Member',
        avatar: toImageUri(
          member?.avatar_base64,
          null
        ),
      };
    });
  }, [toImageUri]);

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

  const normalizeGroup = useCallback((group: any) => {
    const membersRaw = Array.isArray(group?.members)
      ? group.members
      : Array.isArray(group?.users)
      ? group.users
      : Array.isArray(group?.participants)
      ? group.participants
      : [];

    const members = normalizeMembers(membersRaw);

    return {
      id: String(group.id ),
      name: group.name || 'Untitled Group',
      emoji: group.emoji || '👥',
      members,
      isYouOwing: group.balance?.isYouOwing ?? false,
      amount: group.balance?.amount ?? 0,
      updatedAt: group.created_at ?? null,
    };
  }, [normalizeMembers]);

  const loadGroups = useCallback(async () => {

    try {

      const data = await groupsService.getGroups();

      const normalizedGroups = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.groups)
            ? data.groups
            : [];

      const baseGroups = normalizedGroups.map(normalizeGroup);

      const groupsWithMembers = await Promise.all(
        baseGroups.map(async (group: any) => {
          if (!group?.id) {
            return group;
          }

          try {
            const membersResponse = await groupMembersService.getMembers(group.id);
            const members = normalizeMembers(extractMembersPayload(membersResponse));

            return {
              ...group,
              members: members.length > 0 ? members : group.members,
            };
          } catch {
            return group;
          }
        })
      );

      const sortedGroups = [...groupsWithMembers].sort((left, right) => {
        const rightTimestamp = toTimestamp(
          right?.updatedAt 
        );
        const leftTimestamp = toTimestamp(
          left?.updatedAt 
        );

        return rightTimestamp - leftTimestamp;
      });

      setGroups(sortedGroups);
      return sortedGroups;

    } catch (error) {

      console.log('Failed to load groups', error);

      setGroups([]);
      return [];

    }

  }, [normalizeGroup, normalizeMembers]);

  const consumeJoinGroupResult = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(JOIN_GROUP_RESULT_KEY);

      if (!raw) {
        return null;
      }

      await AsyncStorage.removeItem(JOIN_GROUP_RESULT_KEY);
      const parsed = JSON.parse(raw);
      const joinedGroupId = String(parsed?.groupId ?? '').trim();

      if (!joinedGroupId) {
        return null;
      }

      return {
        groupId: joinedGroupId,
        openGroupDetailsOnSuccess: !!parsed?.openGroupDetailsOnSuccess,
      };
    } catch {
      return null;
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    const loadByGroups = async () => {
      try {
        const groupsResponse = await groupsService.getGroups();
        const groupsRaw = Array.isArray(groupsResponse)
          ? groupsResponse
          : Array.isArray(groupsResponse?.data)
          ? groupsResponse.data
          : Array.isArray(groupsResponse?.groups)
          ? groupsResponse.groups
          : [];

        const groupedExpenses = await Promise.all(
          groupsRaw.map(async (group: any) => {
            const numericGroupId = Number(group?.id);
            if (!Number.isFinite(numericGroupId)) {
              return [];
            }

            try {
              return await expensesService.getExpenses(numericGroupId);
            } catch {
              return [];
            }
          })
        );

        return groupedExpenses.flat();
      } catch (error) {
        console.log('Failed to load groups for expenses', error);
        return [];
      }
    };

    const normalizeList = (rawList: any[]): Expense[] => {
      return sortRawExpensesByLatest(rawList)
        .map(exp => normalizeExpense(exp))
        .filter((expense: Expense) => !!expense.id);
    };

    try {
      const direct = await expensesService.getExpenses();
      const rawList = Array.isArray(direct) && direct.length > 0 ? direct : await loadByGroups();
      setExpenses(normalizeList(rawList));
    } catch (error) {
      console.log('Failed to load expenses directly', error);
      try {
        const fallbackList = await loadByGroups();
        setExpenses(normalizeList(fallbackList));
      } catch (fallbackError) {
        console.log('Failed to load expenses by group', fallbackError);
        setExpenses([]);
      }
    }
  }, []);

  const loadCurrentUserId = useCallback(async () => {
    try {
      const storedIdRaw =
        (await AsyncStorage.getItem('userId')) ||
        (await AsyncStorage.getItem('user_id'));
      const normalizedId = storedIdRaw ? storedIdRaw.trim() : '';
      setCurrentUserId(normalizedId);
    } catch (error) {
      console.log('Failed to load current user id', error);
      setCurrentUserId('');
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
          const numericGroupId = Number(group?.id);
          if (!Number.isFinite(numericGroupId)) {
            return [];
          }

          return fetchForGroup(numericGroupId);
        })
      );

      const normalized = settlementResponses
        .flat()
        .map(item => normalizeSettlement(item))
        .filter(item => !!item.id);

      setSettlements(normalized);
    } catch (error) {
      console.log('Failed to load settlements for groups', error);
      setSettlements([]);
    }
  }, []);

 useEffect(() => {
  void Promise.all([
    loadGroups(),
    loadExpenses(),
    loadCurrentUserId(),
    loadSettlements(),
  ]);
  }, [
    loadGroups,
    loadExpenses,
    loadCurrentUserId,
    loadSettlements,
  ]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshAndHandleJoinResult = async () => {
        const refreshedGroups = await loadGroups();
        await Promise.all([loadExpenses(), loadCurrentUserId(), loadSettlements()]);

        const joinResult = await consumeJoinGroupResult();
        if (!isActive || !joinResult) {
          return;
        }

        if (joinResult.openGroupDetailsOnSuccess) {
          const matchedGroup = (refreshedGroups || []).find(
            (group: any) => String(group?.id ?? '') === String(joinResult.groupId)
          );

          navigation.navigate('GroupDetails', {
            id: String(joinResult.groupId),
            group: matchedGroup,
          });
        }
      };

      refreshAndHandleJoinResult();

      return () => {
        isActive = false;
      };
    }, [
      consumeJoinGroupResult,
      loadGroups,
      loadExpenses,
      loadCurrentUserId,
      loadSettlements,
      navigation,
    ])
  );

  const groupBalances = useMemo(() => {
    const me = String(currentUserId || '');

    return groups.map(group => {
      const groupId = String(group?.id ?? '');

      const groupExpenses = expenses.filter(expense => {
        const expenseGroupId = String(
          expense?.groupId ??
          (expense as any)?.group_id ??
          (expense as any)?.group?.id ??
          ''
        );

        return expenseGroupId === groupId;
      });

      const baseBalance = calculateGroupBalance(groupExpenses, currentUserId);
      let signedBalance = baseBalance.isYouOwing
        ? -Number(baseBalance.amount || 0)
        : Number(baseBalance.amount || 0);

      if (me) {
        settlements
          .filter(settlement => String(settlement.groupId || '') === groupId)
          .forEach(settlement => {
            const payerId = String(settlement.payerId || '');
            const receiverId = String(settlement.receiverId || '');
            const amount = Number(settlement.amount || 0);

            if (payerId === me && receiverId) {
              signedBalance += amount;
            } else if (receiverId === me && payerId) {
              signedBalance -= amount;
            }
          });
      }

      const balance = {
        amount: Math.abs(signedBalance),
        isYouOwing: signedBalance < 0,
      };

      return {
        group,
        balance,
      };
    });
  }, [groups, expenses, currentUserId, settlements]);

  const handleCreateGroup = async () => {
    try {
      await groupsService.createGroup({
        name: groupName,
        description: '',
        emoji: selectedEmoji,
      });
      setGroupName('');
      setShowCreate(false);
      await loadGroups();

    } catch (error) {
      console.log('Create group failed', error);
      
      Alert.alert(
        'Create group failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const extractGroupIdFromLink = useCallback((value: string) => {
    const normalized = String(value || '').trim();

    if (!normalized) {
      return '';
    }

    const linkMatch = normalized.match(/group\/([^/?#]+)/i);
    return linkMatch?.[1] ? linkMatch[1] : normalized;
  }, []);

  const handleJoinGroup = () => {
    const targetGroupId = extractGroupIdFromLink(joinLink);

    if (!targetGroupId) {
      Alert.alert('Invalid link', 'Please paste a valid group invite link.');
      return;
    }

    setJoinLink('');
    setShowJoin(false);
    navigation.navigate('JoinGroup', {
      groupId: targetGroupId,
      openGroupDetailsOnSuccess: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerG}>
          <View>
            <Text style={styles.title}>Your Groups</Text>
            <Text style={styles.subtitleG}>
              Manage your expense groups
            </Text>
          </View>

          <TouchableOpacity
              style={styles.joinHeaderButton}
              onPress={() => setShowJoin(true)}
            >
              <Icon name="link" size={14} color="#fff" />
              <Text style={styles.joinHeaderButtonText}>Join Group</Text>
            </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress = {() => setShowCreate(true)}
          >
            <Icon name="plus" size={17} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        {groupBalances.map(({ group, balance }) => {
          const isOwing = balance.isYouOwing;
          const amount = Number(balance.amount || 0);

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCardG}
              onPress={() =>
                navigation.navigate('GroupDetails', { id: String(group.id), group })
              }
            >
      {/* Top Section */}
      <View style={styles.groupTop}>
        <View style={styles.emojiBoxG}>
          <Text style={styles.emoji}>{group.emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.memberRow}>
            <View style={styles.avatarStack}>
              {(group.members || []).slice(0, 4).map((member: any, index: number) => (
                <Image
                  key={member.id}
                  source={getAvatarSource(member.avatar)}
                  style={[
                    styles.avatarG,
                    { marginLeft: index === 0 ? 0 : -10 },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.memberText}>
              {(group.members || []).length} members
            </Text>
          </View>
        </View>
      </View>

              <View style={styles.divider} />

              {/* Balance Section */}
              <View style={styles.balanceRowG}>
                <Text style={styles.balanceLabel}>
                  Your balance
                </Text>

                <View style={{ alignItems: 'flex-end' }}>
                  {amount === 0 ? (
                    <Text style={styles.settledText}>
                      All settled up
                    </Text>
                  ) : null}

                  {amount !== 0 && (
                    <Text
                      style={[
                        styles.balanceType,
                        { color: isOwing ? '#ff2056' : '#009966' },
                      ]}
                    >
                      {isOwing ? 'you owe' : 'you are owed'}
                    </Text>
                  )}

                  {amount !== 0 && (
                    <Text
                      style={[
                        styles.balanceAmountG,
                        { color: isOwing ? '#ff2056' : '#009966' },
                      ]}
                    >
                      {formatCurrency(amount)}
                    </Text>
                     )}
                 
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

     <GroupModal
       visible={showCreate}
       title="Create Group"
       description="Create a new group to split expenses with friends"
       label="Group Name"
       value={groupName}
       placeholder="e.g., Roommates, Trip to Paris..."
       confirmText="Create Group"
       disabled={!groupName.trim()}
       onChangeText={setGroupName}
       onClose={() => setShowCreate(false)}
       onConfirm={handleCreateGroup}
     >
      <Text style={[styles.labelG, { marginTop: 20 }]}>
       Choose an Emoji
      </Text>

      <View style={styles.emojiGrid}>
       {emojis.map(emoji => {
        const selected = selectedEmoji === emoji;

         return (
            <TouchableOpacity
              key={emoji}
              onPress={() => setSelectedEmoji(emoji)}
              style={[
                  styles.emojiItem,
                  selected && styles.selectedEmoji,
               ]}
             >
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </TouchableOpacity>
         );
      })}
      </View>
     </GroupModal>

     <GroupModal
       visible={showJoin}
       title="Join Group"
       description="Paste a roommate invite link to join a group"
       label="Invite Link"
       value={joinLink}
       placeholder="roommate://group/123"
       confirmText="Join Group"
       disabled={!joinLink.trim()}
       autoCapitalize="none"
       autoCorrect={false}
       onChangeText={setJoinLink}
       onClose={() => setShowJoin(false)}
       onConfirm={handleJoinGroup}
      />

    </View>
  );
}