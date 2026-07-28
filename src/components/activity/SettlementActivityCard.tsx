import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BackendGroup, TimelineEntry } from '../../types/activity';
import { Expense } from '../../types';
import { getCategoryEmoji } from '../../utils/activity';
import Icon from 'react-native-vector-icons/Feather';

type Props = {
    entry: TimelineEntry;
    expenses: Expense[];
    groupMap: Map<string, BackendGroup>;
    formatParticipantName: (userId: string, fallback: string) => string;
    formatCurrency: (value:number)=>string;
};

export default function SettlementActivityCard({
    entry,
    expenses,
    groupMap,
    formatParticipantName,
    formatCurrency,
}: Props) {  
        if (!entry.settlement) {
          return null;
        }

    const settlement = entry.settlement;
    const group = groupMap.get(String(settlement.groupId));
    const payerName = formatParticipantName(settlement.payerId, settlement.payerName);
    const receiverName = formatParticipantName(settlement.receiverId, settlement.receiverName);
    const methodLabel =
      settlement.method === 'BANK'
        ? 'Bank'
        : settlement.method === 'UPI'
        ? 'UPI'
        : 'Cash';
    const notes = settlement.notes?.trim();
    const notesForDisplay = notes
      ?.replace(/^\[expense:[^\]]+\]\s*/i, '')
      .trim();

    const relatedExpenseById = settlement.expenseId
      ? expenses.find(expense => String(expense.id) === String(settlement.expenseId))
      : undefined;

    const relatedDescription = notesForDisplay
      ? notesForDisplay
          .replace(/^settlement\s+for\s+/i, '')
          .trim()
          .toLowerCase()
      : undefined;

    const relatedExpenseByDescription = relatedDescription
      ? expenses.find(expense => {
          if (String(expense.groupId) !== String(settlement.groupId)) {
            return false;
          }

          return String(expense.description || '').trim().toLowerCase() === relatedDescription;
        })
      : undefined;

    const relatedExpense = relatedExpenseById ?? relatedExpenseByDescription;

    const settlementEmoji = getCategoryEmoji(relatedExpense?.category);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconBox, styles.settlementIconBox]}>
              <Text style={styles.icon}>{settlementEmoji}</Text>
            </View>

            <View>
              <Text style={styles.expenseTitle}>Settlement recorded</Text>
              {group && (
                <Text style={styles.groupText}>
                  {group.emoji} {group.name}
                </Text>
              )}
              <Text style={styles.subText}>
                {payerName} paid {receiverName}
              </Text>
            </View>
          </View>

          <Text style={[styles.amount, styles.settlementAmount]}>
            {formatCurrency(settlement.amount)}
          </Text>
        </View>

        <View style={styles.participantRow}>
          <Text style={styles.participantText}>{payerName}</Text>
          <Icon name="arrow-right" size={16} color="#6a7282" />
          <Text style={styles.participantText}>{receiverName}</Text>
        </View>

        <View style={styles.settlementMetaRow}>
          <View style={styles.methodPill}>
            <Text style={styles.methodText}>{methodLabel}</Text>
          </View>
          {notesForDisplay ? <Text style={styles.notesText}>{notesForDisplay}</Text> : null}
        </View>
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
    settlementAmount: {
    color: '#16a34a',
  },
    participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  participantText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
  },
  settlementMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  methodPill: {
    borderRadius: 999,
    backgroundColor: '#ecfdf3',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  methodText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 12,
    color: '#6a7282',
    flex: 1,
  },
});