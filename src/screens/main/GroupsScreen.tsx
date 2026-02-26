import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { groups as initialGroups } from '../../data/mockData';

const emojis = [
  '🏠','✈️','📄','🎉','🍕','🎬','⚽','🎵',
  '🏖️','🎮','🍺','🛒','💼','🎓','🏋️','🎸'
];

const GroupsScreen = () => {
  const [groups, setGroups] = useState(initialGroups);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;

    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      emoji: selectedEmoji,
      members: [
        {
          id: '1',
          name: 'You',
          avatar: 'https://i.pravatar.cc/150?img=3',
        },
      ],
      balance: 0,
      balanceType: 'settled',
    };

    setGroups([newGroup, ...groups]);
    setShowModal(false);
    setGroupName('');
    setSelectedEmoji('🏠');
  };

  const renderGroup = ({ item }: any) => {
    const isOwing = item.balance < 0;
    const isOwed = item.balance > 0;

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.row}>
          <View style={styles.emojiBox}>
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{item.name}</Text>

            <View style={styles.memberRow}>
              <View style={styles.avatarStack}>
                {item.members.slice(0, 4).map((m: any, i: number) => (
                  <Image
                    key={i}
                    source={{ uri: m.avatar }}
                    style={[
                      styles.avatar,
                      { marginLeft: i === 0 ? 0 : -8 },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.memberText}>
                {item.members.length} members
              </Text>
            </View>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.divider} />

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Your balance</Text>

          <View style={{ alignItems: 'flex-end' }}>
            {item.balance !== 0 && (
              <Text
                style={[
                  styles.balanceType,
                  isOwing && { color: '#FF2056' },
                  isOwed && { color: '#009966' },
                ]}
              >
                {isOwing ? 'you owe' : 'you are owed'}
              </Text>
            )}

            {item.balance === 0 ? (
              <Text style={styles.settled}>Settled up</Text>
            ) : (
              <Text
                style={[
                  styles.balanceAmount,
                  isOwing && { color: '#FF2056' },
                  isOwed && { color: '#009966' },
                ]}
              >
                ${Math.abs(item.balance).toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Your Groups</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Manage your expense groups
        </Text>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Create Group Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Group</Text>

            <TextInput
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
            />

            <View style={styles.emojiGrid}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiItem,
                    selectedEmoji === emoji && styles.selectedEmoji,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createBtn,
                  !groupName.trim() && { opacity: 0.5 },
                ]}
                onPress={handleCreateGroup}
              >
                <Text style={{ color: '#fff' }}>
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#101828' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#6A7282' },

  addButton: {
    backgroundColor: '#009966',
    padding: 10,
    borderRadius: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  row: { flexDirection: 'row', marginBottom: 12 },
  emojiBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupName: { fontSize: 16, fontWeight: '700', color: '#101828' },

  memberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avatarStack: { flexDirection: 'row', marginRight: 8 },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberText: { fontSize: 12, color: '#6A7282' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, color: '#6A7282' },
  balanceType: { fontSize: 12, fontWeight: '600' },
  balanceAmount: { fontSize: 20, fontWeight: '700' },
  settled: { fontSize: 14, color: '#6A7282' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  selectedEmoji: {
    borderColor: '#009966',
    backgroundColor: '#ECFDF5',
  },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  createBtn: {
    flex: 1,
    backgroundColor: '#009966',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
