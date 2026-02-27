import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../../types/navigation';
import Icon from 'react-native-vector-icons/Feather';
import { groups, expenses, currentUser } from '../../data/mockData';
import { calculateGroupBalance } from '../../services/financeService';
import { Dimensions } from 'react-native';
import { Image } from 'react-native';

type GroupsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Groups'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function GroupsScreen() {
  const navigation = useNavigation<GroupsNavigationProp>();

  // Calculate balances for all groups
  const groupBalances = useMemo(() => {
    return groups.map(group => ({
      group,
      balance: calculateGroupBalance(group.id, expenses, currentUser),
    }));
  }, [groups, expenses]);

  const [showCreate, setShowCreate] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');

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
          const amount = balance.amount;

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() =>
                navigation.navigate('GroupDetails', { id: group.id })
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
              {group.members.slice(0, 4).map((member, index) => (
                <Image
                  key={member.id}
                  source={member.avatar}
                  style={[
                    styles.avatar,
                    { marginLeft: index === 0 ? 0 : -10 },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.memberText}>
              {group.members.length} members
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

                  {amount === 0 ? (
                    <Text style={styles.settledText}>
                      Settled up
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.balanceAmount,
                        { color: isOwing ? '#ff2056' : '#009966' },
                      ]}
                    >
                      ${amount.toFixed(2)}
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
    color: '#6A7282',
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
