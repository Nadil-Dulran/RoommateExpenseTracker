import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { RootStackParamList } from '../../types/navigation';
import {
  expenses,
  categories,
  groups,
  currentUser,
} from '../../data/mockData';

import { calculateUserShare } from '../../services/financeService';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export default function ActivityScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  // ----------------------------
  // FILTERED EXPENSES
  // ----------------------------

  const filteredExpenses = useMemo(() => {
    const now = new Date();

    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);

        if (filter === 'week') {
          const weekAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          return expenseDate >= weekAgo;
        }

        if (filter === 'month') {
          const monthAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
          );
          return expenseDate >= monthAgo;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
  }, [filter]);

  // ----------------------------
  // GROUP BY DATE
  // ----------------------------

  const groupedExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const date = new Date(expense.date).toDateString();

      if (!acc[date]) acc[date] = [];
      acc[date].push(expense);

      return acc;
    }, {} as Record<string, typeof expenses>);
  }, [filteredExpenses]);

  // ----------------------------
  // RENDER
  // ----------------------------

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>

          <View style={styles.filterRow}>
            {(['all', 'week', 'month'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilter(type)}
                style={[
                  styles.filterButton,
                  filter === type && styles.filterActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === type && styles.filterTextActive,
                  ]}
                >
                  {type === 'all'
                    ? 'All Time'
                    : type === 'week'
                    ? 'This Week'
                    : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity List */}
        <View style={{ padding: 16 }}>
          {Object.entries(groupedExpenses).map(
            ([date, dateExpenses]) => (
              <View key={date} style={{ marginBottom: 24 }}>
                <Text style={styles.dateHeader}>
                  {date}
                </Text>

                {dateExpenses.map(expense => {
                  const category =
                    categories[expense.category];
                  const group = groups.find(
                    g => g.id === expense.groupId
                  );
                  const share =
                    calculateUserShare(
                      expense,
                      currentUser
                    );

                  return (
                    <View
                      key={expense.id}
                      style={styles.card}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.cardLeft}>
                          <View style={styles.iconBox}>
                            <Text style={styles.icon}>
                              {category.icon}
                            </Text>
                          </View>

                          <View>
                            <Text style={styles.expenseTitle}>
                              {expense.description}
                            </Text>

                            {group && (
                              <Text style={ styles.groupText } >
                                {group.emoji}{' '}
                                {group.name}
                              </Text>
                            )}

                            <Text
                              style={ styles.subText } >
                              {expense.paidBy.name}{' '}
                              paid • Split{' '}
                              { expense.splits .length }{' '}
                              ways
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={styles.amount} >
                          $
                          {expense.amount.toFixed(
                            2
                          )}
                        </Text>
                      </View>

                      {/* Settlement Info */}
                      {expense.description === 'Settlement' ? (
                        <View
                          style={
                            styles.settledBadge
                          }
                        >
                          <Icon
                            name="check-circle"
                            size={14}
                            color="#16a34a"
                          />
                          <Text
                            style={
                              styles.settledText
                            }
                          >
                            Settled
                          </Text>
                        </View>
                      ) : (
                        share && (
                          <View style={styles.shareRow}>
                            <Text
                              style={[
                                styles.shareText,
                                share.type === 'owed' ? { color: '#009966' } : { color: '#ff2056' },
                              ]}
                            >
                              {share.type === 'owed' ? `You're owed $${share.amount.toFixed(
                                    2
                                  )}` : `You owe $${share.amount.toFixed(2)}`}
                            </Text>

                            <TouchableOpacity
                              style={
                                styles.settleBtn
                              }
                              onPress={() =>
                                navigation.navigate(
                                  'SettleUp',
                                  {
                                    mode:
                                      'single',
                                    memberId:
                                      expense
                                        .paidBy
                                        .id === currentUser.id
                                        ? expense.splits.find(
                                            s =>
                                              s.userId !== currentUser.id
                                          )
                                            ?.userId ??
                                          ''
                                        : expense
                                            .paidBy
                                            .id,
                                    amount:
                                      share.amount,
                                  }
                                )
                              }
                            >
                              <Text
                                style={
                                  styles.settleBtnText
                                }
                              >
                                Settle Up
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
                      )}
                    </View>
                  );
                })}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginTop: 10,
    marginBottom: 10,
  },
  filterActive: {
    backgroundColor: '#009966',
  },
  filterText: {
    fontSize: 14,
    color: '#6a7282',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a7282',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  expenseTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#101828',
  },
  groupText: {
    fontSize: 12,
    color: '#99a1af',
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 2,
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
    color: '#101828',
  },
  shareRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settleBtn: {
    backgroundColor: '#009966',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  settledBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settledText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
});