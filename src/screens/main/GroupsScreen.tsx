import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
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

type GroupsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Groups'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function GroupsScreen() {
  const navigation = useNavigation<GroupsNavigationProp>();
  const { formatCurrency } = useAppCurrency();

  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');

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

      setGroups(groupsWithMembers);

    } catch (error) {

      console.log('Failed to load groups', error);

      setGroups([]);

    }

  }, [normalizeGroup, normalizeMembers]);

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
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadCurrentUserId();
  }, [loadCurrentUserId]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
      loadExpenses();
      loadCurrentUserId();
      loadSettlements();
    }, [loadGroups, loadExpenses, loadCurrentUserId, loadSettlements])
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

  const emojis: string[] = [
  '🏠','✈️','📄','🎉','🍕','🎬','⚽','🎵',
  '🏖️','🎮','🍺','🛒','💼','🎓','🏋','🎸'
];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Groups</Text>
            <Text style={styles.subtitle}>
              Manage your expense groups
            </Text>
          </View>

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
              style={styles.groupCard}
              onPress={() =>
                navigation.navigate('GroupDetails', { id: String(group.id), group })
              }
            >
      {/* Top Section */}
      <View style={styles.groupTop}>
        <View style={styles.emojiBox}>
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
                    styles.avatar,
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
              <View style={styles.balanceRow}>
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
                        styles.balanceAmount,
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

      {showCreate && (
  <View style={styles.overlay}>
    <View style={styles.modalCard}>

      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Create Group</Text>
        <TouchableOpacity onPress={() => setShowCreate(false)}>
          <Icon name="x" size={22} color="#6A7282" />
        </TouchableOpacity>
      </View>

      <Text style={styles.modalDescription}>
        Create a new group to split expenses with friends
      </Text>

      {/* Group Name */}
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        value={groupName}
        onChangeText={setGroupName}
        placeholder="e.g., Roommates, Trip to Paris..."
        placeholderTextColor="#99A1AF"
        style={styles.input}
      />

      {/* Emoji */}
      <Text style={[styles.label, { marginTop: 20 }]}>
        Choose an Emoji
      </Text>

      <View style={styles.emojiGrid}>
        {emojis.map((emoji: string) => {
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

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setShowCreate(false)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!groupName.trim()}
          style={[
            styles.createBtn,
            !groupName.trim() && styles.disabledBtn,
          ]}
          onPress={handleCreateGroup}
        >
          <Icon
            name="check"
            size={16}
            color={groupName.trim() ? '#fff' : '#9CA3AF'}
          />
          <Text
            style={[
              styles.createText,
              !groupName.trim() && { color: '#9CA3AF' },
            ]}
          >
            Create Group
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
)}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },

  subtitle: {
    fontSize: 14,
    color: '#6A7282',
    marginTop: 4,
  },

  addButton: {
    backgroundColor: '#009966',
    padding: 10,
    borderRadius: 20,
    bottom: 5,
  },

  groupCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  groupTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emojiBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  emoji: {
    fontSize: 24,
  },

  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },

  memberText: {
    fontSize: 12,
    color: '#6A7282',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  balanceLabel: {
    fontSize: 14,
    color: '#6A7282',
  },

  balanceType: {
    fontSize: 12,
    fontWeight: '600',
  },

  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },

  settledText: {
    fontSize: 14,
    color: '#009966',
    fontWeight: '600',
  },

  overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

modalCard: {
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 24,
},

modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

modalTitle: {
  fontSize: 22,
  fontWeight: '700',
  color: '#101828',
},

modalDescription: {
  fontSize: 14,
  color: '#6A7282',
  marginTop: 12,
  marginBottom: 20,
},

label: {
  fontSize: 13,
  fontWeight: '600',
  color: '#6A7282',
  marginBottom: 8,
},

input: {
  borderWidth: 1,
  borderColor: '#009966',
  borderRadius: 20,
  padding: 14,
  fontSize: 15,
},

emojiGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

emojiItem: {
  width: 40,
  height: 40,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: '#E5E7EB',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
},

selectedEmoji: {
  borderColor: '#009966',
  backgroundColor: '#ECFDF5',
},

buttonRow: {
  flexDirection: 'row',
  marginTop: 24,
  gap: 12,
},

cancelBtn: {
  flex: 1,
  backgroundColor: '#F3F4F6',
  paddingVertical: 16,
  borderRadius: 20,
  alignItems: 'center',
},

cancelText: {
  fontSize: 15,
  fontWeight: '600',
},

createBtn: {
  flex: 1,
  backgroundColor: '#009966',
  paddingVertical: 16,
  borderRadius: 20,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 6,
},

disabledBtn: {
  backgroundColor: '#E5E7EB',
},

createText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#fff',
},
memberRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
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

});
