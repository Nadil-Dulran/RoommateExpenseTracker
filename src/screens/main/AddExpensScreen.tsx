import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { categories } from '../../data/mockData';
import { CategoryType } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { expensesService } from '../../services/expensesService';
import { groupsService } from '../../services/groupsService';
import { groupMembersService } from '../../services/groupMembersService';
import { profileService } from '../../services/profileService';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../../types/navigation';
import profileIcon from '../../../assets/ProfileIcon.png';


type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function AddExpenseScreen() {
 const navigation = useNavigation<DashboardNavigationProp>();

  // ── backend data ──────────────────────────────────────────────────
  const [backendGroups, setBackendGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatarUri, setCurrentUserAvatarUri] = useState<string | null>(null);

  const toImageUri = (value?: string | null, mimeType?: string) => {
    if (!value) {
      return null;
    }

    const normalizedValue = String(value).trim();

    if (normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://')) {
      return normalizedValue;
    }

    if (normalizedValue.startsWith('data:image')) {
      return normalizedValue;
    }

    const compactBase64 = normalizedValue.replace(/\s/g, '');

    return `data:${mimeType || 'image/jpeg'};base64,${compactBase64}`;
  };

  const normalizeMembers = (raw: any[]) =>
    (raw || []).map((m: any, i: number) => ({
      id: String(m.id ?? `member-${i}`),
      name: m.name ?? 'Member',
      avatarUri: toImageUri(
        m.avatar ??
        m.avatarBase64 ??
        m.avatar_base64 ??
        m.avatarbase64 ??
        m.avatar_url ??
        m.avatarUrl ??
        m.profileImage ??
        m.user?.avatarBase64 ??
        m.user?.avatar_base64 ??
        m.profile?.avatarBase64 ??
        m.profile?.avatar_base64 ??
        m.dataValues?.avatarBase64 ??
        m.dataValues?.avatar_base64 ??
        null,
        m.avatarMimeType ?? m.avatar_mime_type ?? 'image/jpeg'
      ),
    }));

  useEffect(() => {
    const loadCurrentUserAvatar = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
          setCurrentUserId(String(storedId));
        }

        const profile = await profileService.getProfile();
        const avatarUri = toImageUri(profile.avatarBase64 ?? null);

        if (avatarUri) {
          setCurrentUserAvatarUri(avatarUri);
        }
      } catch (_error) {
        setCurrentUserAvatarUri(null);
      }
    };

    loadCurrentUserAvatar();
  }, []);

  const extractMembersPayload = (data: any): any[] => {
    if (Array.isArray(data)) { return data; }
    if (Array.isArray(data?.data)) { return data.data; }
    if (Array.isArray(data?.members)) { return data.members; }
    return [];
  };

  const normalizeGroup = (g: any) => ({
    id: String(g.id),
    name: g.name || 'Untitled Group',
    emoji: g.emoji || '👥',
    members: normalizeMembers(
      Array.isArray(g?.members) ? g.members
      : Array.isArray(g?.users) ? g.users
      : []
    ),
  });

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const data = await groupsService.getGroups();
      const raw: any[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.groups) ? data.groups
        : [];

      const base = raw.map(normalizeGroup);

      const withMembers = await Promise.all(
        base.map(async (group: any) => {
          try {
            const membersRes = await groupMembersService.getMembers(group.id);
            const members = normalizeMembers(extractMembersPayload(membersRes)).map((member: any) => {
              if (
                !member.avatarUri &&
                currentUserAvatarUri &&
                currentUserId &&
                String(member.id) === String(currentUserId)
              ) {
                return {
                  ...member,
                  avatarUri: currentUserAvatarUri,
                };
              }

              return member;
            });
            return { ...group, members: members.length > 0 ? members : group.members };
          } catch (_e) {
            return group;
          }
        })
      );

      setBackendGroups(withMembers);

      if (withMembers.length === 0) {
        setSelectedGroup(null);
        setPaidBy(null);
      }
    } catch (e) {
      console.log('Failed to load groups', e);
    } finally {
      setLoadingGroups(false);
    }
  }, [currentUserAvatarUri, currentUserId]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── form state ────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [paidBy, setPaidBy] = useState<any | null>(null);
  const [splitType, setSplitType] =
    useState<'equal' | 'exact' | 'percentage' | null>(null);

  const [exactAmounts, setExactAmounts] =
    useState<Record<string, string>>({});

  const [percentages, setPercentages] =
    useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Equal split
  const splitAmount = useMemo(() => {
    if (!amount || !selectedGroup?.members?.length) { return '0.00'; }
    return (
      parseFloat(amount) /
      selectedGroup.members.length
    ).toFixed(2);
  }, [amount, selectedGroup]);

  // Exact total
  const exactTotal = useMemo(() => {
    return Object.values(exactAmounts)
      .reduce((sum, val) =>
        sum + (parseFloat(val) || 0), 0);
  }, [exactAmounts]);

  // Percentage total
  const percentageTotal = useMemo(() => {
    return Object.values(percentages)
      .reduce((sum, val) =>
        sum + (parseFloat(val) || 0), 0);
  }, [percentages]);

  const getPercentageAmount = (p: string) => {
    if (!amount || !p) return '0.00';
    return (
      (parseFloat(amount) * parseFloat(p)) / 100
    ).toFixed(2);
  };

  const resetFormInputs = useCallback(() => {
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedGroup(null);
    setPaidBy(null);
    setSplitType(null);
    setSelectedDate(new Date());
    setShowPicker(false);
    setExactAmounts({});
    setPercentages({});
    setIsSubmitting(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetFormInputs();
      loadGroups();
    }, [resetFormInputs, loadGroups])
  );

  const renderSplitMember = (member: any) => (
    <View style={styles.splitMemberInfo}>
      <Image
        source={
          member.avatarUri
            ? { uri: member.avatarUri }
            : profileIcon
        }
        style={styles.splitAvatar}
      />
      <Text style={styles.splitMemberName}>{member.name}</Text>
    </View>
  );


  return (
    <View style={styles.container}>

               {/* Header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Add Expense</Text>
                  </View>
                  <TouchableOpacity
                              style={styles.backButton}
                              onPress={() => navigation.navigate('Home')}
                            >
                              <Icon name="x" size={25} color="#958f8f" />
                            </TouchableOpacity>
                  </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={true}
      >

        {/* Amount */}
        <Text style={styles.firstlable}>Amount</Text>

        <View style={styles.amountInput}>
          <Icon name="dollar-sign" size={28} color="#6A7282" />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#99A1AF"
            style={styles.amountText}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What was this for?"
          style={styles.input}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {Object.entries(categories).map(([key, cat]) => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                setSelectedCategory(key as CategoryType)
              }
              style={[
                styles.categoryItem,
                selectedCategory === key &&
                  styles.selectedCategory,
              ]}
            >
              <Text style={{ fontSize: 26 }}>
                {cat.icon}
              </Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === key && {
                    color: '#009966',
                  },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group */}
        <Text style={styles.label}>Group</Text>
        {loadingGroups ? (
          <ActivityIndicator color="#009966" style={{ marginVertical: 12 }} />
        ) : backendGroups.length === 0 ? (
          <Text style={{ color: '#98A2B3', marginBottom: 8 }}>No groups found</Text>
        ) : (
          backendGroups.map(group => (
            <TouchableOpacity
              key={group.id}
              onPress={() => {
                setSelectedGroup(group);
                setPaidBy(null);
              }}
              style={[
                styles.groupCard,
                selectedGroup?.id === group.id &&
                  styles.selectedGroupCard,
              ]}
            >
              <Text style={styles.groupEmoji}>
                {group.emoji}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>
                  {group.name}
                </Text>
                <Text style={styles.groupMembers}>
                  {group.members.length} members
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {/* Select Date */}

        <Text style={styles.label}>Date</Text>

<View style={styles.dateContainer}>
  
  <View style={styles.dateLeft}>
    <Icon name="calendar" size={20} color="#6A7282" />
    <Text style={styles.dateText}>
      {selectedDate.toISOString().split('T')[0]}
    </Text>
  </View>

  <TouchableOpacity onPress={() => setShowPicker(true)}>
    <Icon name="calendar" size={19} color="#101828" />
  </TouchableOpacity>

</View>

{showPicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowPicker(false);
      if (date) setSelectedDate(date);
    }}
  />
)}
 
        {/* Paid By */}
        <Text style={styles.label}>Paid By</Text>
        {(selectedGroup?.members ?? []).map((member: any) => (
          <TouchableOpacity
            key={member.id}
            onPress={() => setPaidBy(member)}
            style={[
              styles.paidItem,
              paidBy?.id === member.id &&
                styles.selectedGroupCard,
            ]}
          >
            <Image
              source={
                member.avatarUri
                  ? { uri: member.avatarUri }
                  : profileIcon
              }
              style={styles.avatar}
            />
            <Text style={styles.memberName}>
              {member.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Split Type */}
        <Text style={styles.label}>Split</Text>
        <View style={styles.splitRow}>
          {['equal', 'exact', 'percentage'].map(type => (
            <TouchableOpacity
              key={type}
              onPress={() =>
                setSplitType(
                  type as 'equal' | 'exact' | 'percentage'
                )
              }
              style={[
                styles.splitBtn,
                splitType === type &&
                  styles.selectedSplit,
              ]}
            >
              <Text
                style={[
                  styles.splitText,
                  splitType === type && {
                    color: '#009966',
                  },
                ]}
              >
                {type === 'percentage'
                  ? '%'
                  : type.charAt(0).toUpperCase() +
                    type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equal */}
        {splitType === 'equal' && (
          <View style={styles.splitBox}>
            <Text style={{ marginBottom: 13, color: '#6A7282' }}>
              Split equally:
            </Text>

            {(selectedGroup?.members ?? []).map((m: any) => (
              <View
                key={m.id}
                style={styles.splitRowItem}
              >
                {renderSplitMember(m)}
                <Text>${splitAmount}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exact */}
        {splitType === 'exact' && (
          <View style={styles.splitBox}>
            <Text style={{ marginBottom: 13, color: '#6A7282' }}>
              Enter exact amounts:
            </Text>
            {(selectedGroup?.members ?? []).map((m: any) => (
              <View
                key={m.id}
                style={styles.splitRowItem}
              >
                {renderSplitMember(m)}
                <TextInput
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.smallInput}
                  value={exactAmounts[m.id]}
                  onChangeText={val =>
                    setExactAmounts({
                      ...exactAmounts,
                      [m.id]: val,
                    })
                  }
                />
              </View>
            ))}

            <Text
              style={{
                marginTop: 10,
                color:
                  exactTotal ===
                  parseFloat(amount || '0')
                    ? '#009966'
                    : '#FF2056',
              }}
            >
              ${exactTotal.toFixed(2)} /
              ${amount || '0.00'}
            </Text>
          </View>
        )}

        {/* Percentage */}
        {splitType === 'percentage' && (
          <View style={styles.splitBox}>
            <Text style={{ marginBottom: 13, color: '#6A7282' }}>
              Enter percentages:
            </Text>
            {(selectedGroup?.members ?? []).map((m: any) => (
              <View
                key={m.id}
                style={styles.splitRowItem}
              >
                {renderSplitMember(m)}
                <TextInput
                  placeholder="0"
                  keyboardType="decimal-pad"
                  style={styles.smallInput}
                  value={percentages[m.id]}
                  onChangeText={val =>
                    setPercentages({
                      ...percentages,
                      [m.id]: val,
                    })
                  }
                />
                <Text>
                  $
                  {getPercentageAmount(
                    percentages[m.id]
                  )}
                </Text>
              </View>
            ))}

            <Text
              style={{
                marginTop: 10,
                color:
                  percentageTotal === 100
                    ? '#009966'
                    : '#FF2056',
              }}
            >
              {percentageTotal.toFixed(1)}% / 100%
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          disabled={!amount || !description || isSubmitting || !selectedCategory || !selectedGroup || !paidBy || !splitType}
          style={[
            styles.submitBtn,
            (!amount || !description || isSubmitting || !selectedCategory || !selectedGroup || !paidBy || !splitType) && {
              backgroundColor: '#99A1AF',
            },
          ]}
          onPress={async () => {
            if (!selectedCategory || !selectedGroup || !paidBy || !splitType) { return; }
            setIsSubmitting(true);
            try {
              const members: any[] = selectedGroup.members ?? [];
              const splits =
                splitType === 'equal'
                  ? members.map((m: any) => ({
                      userId: m.id,
                      amount: parseFloat(splitAmount),
                    }))
                  : splitType === 'exact'
                  ? members.map((m: any) => ({
                      userId: m.id,
                      amount: parseFloat(exactAmounts[m.id] || '0'),
                    }))
                  : members.map((m: any) => ({
                      userId: m.id,
                      percentage: parseFloat(percentages[m.id] || '0'),
                      amount: parseFloat(getPercentageAmount(percentages[m.id])),
                    }));

              await expensesService.createExpense({
                description,
                amount: parseFloat(amount),
                category: categories[selectedCategory].icon,
                groupId: parseInt(selectedGroup.id, 10),
                paidById: paidBy.id,
                date: selectedDate.toISOString().split('T')[0],
                splitType,
                splits,
              });

              navigation.navigate('Expenses');
            } catch (err: any) {
              Alert.alert('Failed to create expense', err?.message ?? 'Unknown error');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Saving...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

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

  backButton: {
    padding: 10,
    borderRadius: 20,
    color:"#6A7282",
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A7282',
    marginTop: 20,
    marginBottom: 10,
  },

  firstlable: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A7282',
    marginBottom: 10,
  },

  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#fff',
  },

  amountText: {
    fontSize: 36,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  categoryItem: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 14,
    alignItems: 'center',
  },

  selectedCategory: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  categoryText: {
    fontSize: 12,
    marginTop: 6,
    color: '#6A7282',
  },

  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },

  selectedGroupCard: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  groupEmoji: { fontSize: 24, marginRight: 10 },
  groupName: { fontWeight: '600' },
  groupMembers: { fontSize: 12, color: '#6A7282' },

  paidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  memberName: { fontWeight: '500' },

  splitRow: {
    flexDirection: 'row',
    gap: 8,
  },

  splitBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  selectedSplit: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  splitText: { fontSize: 14, color: '#6A7282' },

  splitBox: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },

  splitRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  splitMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  splitAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
  },

  splitMemberName: {
    color: '#101828',
  },

  smallInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
    textAlign: 'center',
    marginRight: 30,
  },

  submitBtn: {
    backgroundColor: '#009966',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },

  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

dateContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 14,
},

dateLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

dateText: {
  marginLeft: 10,
  fontSize: 16,
  fontWeight: '400',
  color: '#101828',
},


});
