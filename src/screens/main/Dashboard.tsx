import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { groups, expenses, notifications, categories } from '../../data/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const totalOwed = 340.5;
  const totalOwing = 150.0;
  const totalBalance = totalOwed - totalOwing;

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentExpenses = expenses.slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, You!</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellWrapper}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={22} color="#6a7282" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/100' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#101828', '#1e2939']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Icon name="credit-card" size={16} color="#99A1AF" />
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>

          <Text style={styles.balanceAmount}>
            {totalBalance >= 0 ? '+' : ''}${totalBalance.toFixed(2)}
          </Text>

          <View style={styles.balanceRow}>
            <View style={styles.subCard}>
              <Text style={styles.owedLabel}>You are owed</Text>
              <Text style={styles.owedAmount}>
                ${totalOwed.toFixed(2)}
              </Text>
            </View>

            <View style={styles.subCard}>
              <Text style={styles.oweLabel}>You owe</Text>
              <Text style={styles.oweAmount}>
                ${totalOwing.toFixed(2)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Settle Button */}
        <TouchableOpacity
          style={styles.settleButton}
          onPress={() => navigation.navigate('SettleUp')}
        >
          <Icon name="dollar-sign" size={18} color="#007a55" />
          <Text style={styles.settleText}>Settle All Debts</Text>
        </TouchableOpacity>

        {/* Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {groups.map(group => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetails', { id: group.id })}
          >
            <View style={styles.groupLeft}>
              <View style={styles.emojiBox}>
                <Text style={styles.emoji}>{group.emoji}</Text>
              </View>

              <View>
                <Text style={styles.groupName}>{group.name}</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[
                  styles.balanceType,
                  group.balanceType === 'owing'
                    ? { color: '#ff2056' }
                    : { color: '#009966' },
                ]}
              >
                {group.balanceType === 'owing'
                  ? 'you owe'
                  : 'owes you'}
              </Text>

              <Text
                style={[
                  styles.groupAmount,
                  group.balanceType === 'owing'
                    ? { color: '#ff2056' }
                    : { color: '#009966' },
                ]}
              >
                ${Math.abs(group.balance).toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Recent Activity
        </Text>

        {recentExpenses.map(expense => {
          const category = categories[expense.category];

          return (
            <TouchableOpacity
              key={expense.id}
              style={styles.activityCard}
              onPress={() => navigation.navigate('Activity')}
            >
              <View style={styles.groupLeft}>
                <View style={styles.categoryIcon}>
                  <Text>{category.icon}</Text>
                </View>

                <View>
                  <Text style={styles.groupName}>
                    {expense.description}
                  </Text>
                  <Text style={styles.activitySub}>
                    {expense.paidBy.name} paid
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.activityAmount}>
                  ${expense.amount.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#101828',
  },

  subtitle: {
    fontSize: 14,
    color: '#6a7282',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  bellWrapper: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff2056',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  balanceLabel: {
    color: '#99A1AF',
    fontSize: 14,
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },

  balanceRow: {
    flexDirection: 'row',
    gap: 10,
  },

  subCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 14,
  },

  owedLabel: { color: '#009966', fontSize: 12 },
  oweLabel: { color: '#ff2056', fontSize: 12 },

  owedAmount: {
    color: '#009966',
    fontSize: 18,
    fontWeight: '600',
  },

  oweAmount: {
    color: '#ff2056',
    fontSize: 18,
    fontWeight: '600',
  },

  settleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderColor: '#d0fae5',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },

  settleText: {
    color: '#007a55',
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101828',
  },

  seeAll: {
    color: '#009966',
    fontWeight: '600',
  },

  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emoji: {
    fontSize: 22,
  },

  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },

  balanceType: {
    fontSize: 14,
    fontWeight: '700',
  },

  groupAmount: {
    fontSize: 18,
    fontWeight: '700',
  },

  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activitySub: {
    fontSize: 12,
    color: '#6a7282',
  },

  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101828',
  },
});