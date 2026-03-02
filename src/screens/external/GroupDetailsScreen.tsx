import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { RootStackParamList } from '../../types/navigation';
import { groups, expenses, categories, currentUser } from '../../data/mockData';
import {
  calculateGroupBalance,
  calculateMemberBalances,
  calculateUserShare,
} from '../../services/financeService';

type RouteProps = RouteProp<RootStackParamList, 'GroupDetails'>;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

export default function GroupDetailsScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();

  const { id } = route.params;

  const group = groups.find(g => g.id === id);
  const groupExpenses = expenses.filter(e => e.groupId === id);

  const [settleMember, setSettleMember] = useState<null | {
    id: string;
    name: string;
    amount: number;
    isYouPaying: boolean;
  }>(null);

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
    () => calculateGroupBalance(id, expenses, currentUser),
    [id]
  );

  const memberBalances = useMemo(
    () => calculateMemberBalances(groupExpenses, currentUser),
    [groupExpenses]
  );

  // ---------------------------
  // UI
  // ---------------------------

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#6a7282" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon name="more-vertical" size={22} color="#6a7282" />
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.emojiBox}>
            <Text style={{ fontSize: 28 }}>{group.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{group.name}</Text>

            <View style={styles.memberAvatars}>
              {group.members.map(member => (
                <View key={member.id} style={styles.avatarCircle}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {member.name[0]}
                  </Text>
                </View>
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
            ${groupBalance.amount.toFixed(2)}
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
              <View style={styles.avatarCircle}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {member.name[0]}
                </Text>
              </View>

              <View>
                <Text style={styles.memberName}>
                  {member.name}
                </Text>
                <Text
                  style={{
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

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: member.isYouPaying
                    ? '#ff2056'
                    : '#009966',
                }}
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
                onPress={() => setSettleMember(member)}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  Settle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Recent Expenses */}
        <View style={styles.expenseHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SettleUp', { mode: 'all' })
            }
          >
            <Text style={{ color: '#009966' }}>Settle up</Text>
          </TouchableOpacity>
        </View>

        {groupExpenses.slice(0, 3).map(expense => {
          const category = categories[expense.category];
          const share = calculateUserShare(expense, currentUser);

          return (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseLeft}>
                <View style={styles.categoryIcon}>
                  <Text>{category.icon}</Text>
                </View>

                <View>
                  <Text style={styles.expenseTitle}>
                    {expense.description}
                  </Text>
                  <Text style={styles.expenseSub}>
                    {expense.paidBy.name} paid
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: 'bold' }}>
                  ${expense.amount.toFixed(2)}
                </Text>

                {share && (
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        share.type === 'owed'
                          ? '#009966'
                          : '#ff2056',
                    }}
                  >
                    {share.type === 'owed'
                      ? `You're owed $${share.amount.toFixed(
                          2
                        )}`
                      : `You owe $${share.amount.toFixed(
                          2
                        )}`}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Settle Modal */}
      <Modal visible={!!settleMember} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Settle with {settleMember?.name}?
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSettleMember(null)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => setSettleMember(null)}
              >
                <Text style={{ color: '#fff' }}>Confirm</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },

  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  emojiBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  memberAvatars: {
    flexDirection: 'row',
  },

  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#009966',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
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
    fontSize: 28,
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

  memberCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '600',
  },

  settleBtn: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
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
  },

  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  expenseTitle: {
    fontWeight: '600',
  },

  expenseSub: {
    fontSize: 12,
    color: '#6a7282',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 20,
  },

  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelBtn: {
    padding: 12,
  },

  confirmBtn: {
    backgroundColor: '#009966',
    padding: 12,
    borderRadius: 10,
  },
});