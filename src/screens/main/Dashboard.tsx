import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../../types/navigation';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { groups, expenses, notifications, categories, currentUser } from '../../data/mockData';
import { Image } from 'react-native';
import profileIcon from '../../../assets/ProfileIcon.png';
import { calculateGroupBalance } from '../../services/financeService';

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen() {


const navigation = useNavigation<DashboardNavigationProp>();
  
  const { totalOwed, totalOwing } = useMemo(() => {
  let owed = 0;   // others owe you
  let owing = 0;  // you owe others

  expenses.forEach(expense => {
    const yourSplit = expense.splits.find(
      split => split.userId === currentUser.id
    );

    // If YOU paid
    if (expense.paidBy.id === currentUser.id) {
      expense.splits.forEach(split => {
        if (split.userId !== currentUser.id) {
          owed += split.amount;
        }
      });
    }

    // If someone else paid and you owe
    else if (yourSplit) {
      owing += yourSplit.amount;
    }
  });

  return {
    totalOwed: owed,
    totalOwing: owing,
  };
}, [expenses]);

  const totalBalance = totalOwed - totalOwing;

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentExpenses = expenses.slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {currentUser.name}!</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellWrapper}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={24} color="#6a7282" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={profileIcon}
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
          onPress={() => navigation.navigate('SettleUp', { mode: 'all' })}
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

       {groups.map(group => {
  const groupBalance = calculateGroupBalance(
    group.id,
    expenses,
    currentUser
  );

  return (
    <TouchableOpacity
      key={group.id}
      style={styles.groupCard}
      onPress={() =>
        navigation.navigate('GroupDetails', { id: group.id })
      }
    >
      <View style={styles.groupLeft}>
        <View style={styles.emojiBox}>
          <Text style={styles.emoji}>{group.emoji}</Text>
        </View>

        <Text style={styles.groupName}>{group.name}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={[
            styles.balanceType,
            {
              color: groupBalance.isYouOwing
                ? '#ff2056'
                : '#009966',
            },
          ]}
        >
          {groupBalance.isYouOwing
            ? 'you owe'
            : 'owes you'}
        </Text>

        <Text
          style={[
            styles.groupAmount,
            {
              color: groupBalance.isYouOwing
                ? '#ff2056'
                : '#009966',
            },
          ]}
        >
          ${groupBalance.amount.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
})}
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
                <Text style={styles.activitySub}>
                  {new Date(expense.date).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    borderColor: '#F3F4F6',
    borderWidth: 1,
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
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderColor: '#d0fae5',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },

  settleText: {
    color: '#007a55',
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#101828',
  },

  seeAll: {
    color: '#009966',
    fontWeight: '500',
  },

  groupCard: {
    marginRight: 1,
    marginLeft: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 2,
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
    marginRight: 1,
    marginLeft: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    elevation: 2,
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
    color: '#99A1AF',
  },

  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101828',
  },
});