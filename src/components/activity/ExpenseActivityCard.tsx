import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BackendGroup, TimelineEntry } from '../../types/activity';
import type { Expense } from '../../types';
import { getCategoryEmoji, roundCurrency } from '../../utils/activity';

type Props = {
  entry: TimelineEntry;
  navigation: any; 
  groupMap: Map<string, BackendGroup>;
  currentUserId: string;
  settledExpenseIds: Set<string>;
  formatCurrency: (value: number) => string;
  getShareForExpense: (expense: Expense) => {
    type: 'owed' | 'owing';
    amount: number;
  } | null;
};

export default function ExpenseActivityCard({
  entry,
  navigation,
  groupMap,
  currentUserId,
  settledExpenseIds,
  formatCurrency,
  getShareForExpense,
}: Props) {
        if (!entry.expense) {
          return null;
        }
    
        const expense = entry.expense;
        const group = groupMap.get(String(expense.groupId));
        const categoryEmoji = getCategoryEmoji(expense.category);
        const share = getShareForExpense(expense);
    
        const splits = Array.isArray(expense.splits) ? expense.splits : [];
        const normalizedSplits = splits
          .map(split => ({
            userId: String(split.userId ?? ''),
            amount: Number(split.amount ?? 0),
          }))
          .filter(split => !!split.userId);
    
        const payerName =
          expense.paidBy?.name && expense.paidBy.name !== 'Unknown'
            ? expense.paidBy.name
            : group?.members.find(member => member.id === String(expense.paidBy?.id))?.name ||
              `Member ${expense.paidBy?.id}`;
    
        const isMyExpense = String(expense.paidBy?.id) === String(currentUserId);
        const counterpartyId = isMyExpense
          ? normalizedSplits.find(split => split.userId !== String(currentUserId))?.userId ?? ''
          : String(expense.paidBy?.id ?? '');
    
        const counterpartyName =
          group?.members.find(member => member.id === counterpartyId)?.name ??
          (isMyExpense && counterpartyId ? `Member ${counterpartyId}` : payerName);
    
        const splitParticipantsForSettle = normalizedSplits.map(split => ({
          userId: split.userId,
          amount: roundCurrency(split.amount),
          name:
            split.userId === String(currentUserId)
              ? 'You'
              : split.userId === String(expense.paidBy?.id)
              ? payerName
              : group?.members.find(member => member.id === split.userId)?.name ??
                `Member ${split.userId}`,
        }));
    
        const isExpenseSettled = settledExpenseIds.has(String(expense.id));
    
        const canSettle =
          !!share &&
          entry.kind !== 'settlement' &&
          !isExpenseSettled &&
          share.amount >= 0.01 &&
          !!counterpartyId &&
          !!expense.groupId;
    
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{categoryEmoji}</Text>
                </View>
    
                <View>
                  <Text style={styles.expenseTitle}>{expense.description}</Text>
    
                  {group && (
                    <Text style={styles.groupText}>
                      {group.emoji} {group.name}
                    </Text>
                  )}
    
                  <Text style={styles.subText}>
                    {payerName} paid • Split {normalizedSplits.length || 1}{' '}
                    {normalizedSplits.length === 1 ? 'way' : 'ways'}
                  </Text>
                </View>
              </View>
    
              <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
            </View>
    
            {share && (
              <View style={styles.shareRow}>
                <Text
                  style={[
                    styles.shareText,
                    share.type === 'owed' ? styles.shareTextOwed : styles.shareTextOwing,
                  ]}
                >
                  {isExpenseSettled
                    ? 'Settled'
                    : share.type === 'owed'
                    ? `You're owed ${formatCurrency(share.amount)}`
                    : `You owe ${formatCurrency(share.amount)}`}
                </Text>
    
                {canSettle && (
                  <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={() =>
                      navigation.navigate('SettleUp', {
                        mode: 'single',
                        memberId: counterpartyId,
                        amount: share.amount,
                        memberName: counterpartyName,
                        isYouPaying: share.type === 'owing',
                        groupId: String(expense.groupId),
                        expenseContext: {
                          expenseId: String(expense.id),
                          description: expense.description,
                          amount: roundCurrency(expense.amount),
                          groupId: String(expense.groupId),
                          groupName: group?.name,
                          paidBy: { id: String(expense.paidBy?.id ?? ''), name: payerName },
                          splits: splitParticipantsForSettle,
                        },
                      })
                    }
                  >
                    <Text style={styles.settleBtnText}>Settle Up</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
    };
    
const styles = StyleSheet.create({
 card: {
   backgroundColor: '#fff',
   padding: 14,
   borderRadius: 12,
   marginBottom: 12,
   shadowColor: '#000',
   shadowOpacity: 0.05, 
   shadowRadius: 8,
   elevation: 3,
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
  settlementIconBox: {
    backgroundColor: '#ecfdf3',
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
  shareTextOwed: {
    color: '#009966',
  },
  shareTextOwing: {
    color: '#ff2056',
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
});