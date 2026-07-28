import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { Expense, Settlement } from '../../types';
import { roundCurrency } from '../../utils/activity';
import Icon from 'react-native-vector-icons/Feather';
import { BackendGroup } from '../../types/activity';
import deleteIcon from '../../../assets/delete.png';
import editIcon from '../../../assets/edit.png';


type Props = {
  expense: Expense;
  currentUserId: string;
  getGroupInfo: (groupId: string) => BackendGroup | undefined;
  settlements: Settlement[];
  settlementsByExpenseId: Map<string, Settlement[]>;
  outstandingAmountByPair: Map<string, number>;
  settledAmountByPair: Map<string, number>;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  navigation: any;
  formatCurrency: (amount: number) => string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

export default function ExpenseCard({
  expense,
  currentUserId,
  getGroupInfo,
  settlements,
  settlementsByExpenseId,
  outstandingAmountByPair,
  settledAmountByPair,
  activeMenuId,
  setActiveMenuId,
  navigation,
  formatCurrency,
  onEdit,
  onDelete,
}: Props) {
  const splits = Array.isArray(expense.splits) ? expense.splits : [];
  const paidBy = expense.paidBy ?? { id: '', name: 'Unknown' };
  const group = getGroupInfo(expense.groupId);
  const resolvedCurrentUserId = String(currentUserId || '');
  const resolvedGroupId = String(expense.groupId ?? '');

  const groupMembers = group?.members ?? [];

  const uniqueNonEmpty = (values: string[]) => Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean)));
  const normalizeName = (value?: string | null) => String(value || '').trim().toLowerCase();

  const normalizedSplits = splits
    .map(split => ({
      userId: String(split.userId ?? ''),
      amount: Number(split.amount ?? 0),
    }))
    .filter(split => !!split.userId);

  const paidByName =
    paidBy.name && paidBy.name !== 'Unknown'
      ? paidBy.name
      : group?.members?.find((member: any) => String(member.id) === String(paidBy.id))?.name ?? 'Unknown';

  const normalizedPaidByName = normalizeName(paidByName);
  const payerIdCandidates = uniqueNonEmpty([
    String(paidBy.id ?? ''),
    ...groupMembers
      .filter(member => normalizeName(member.name) === normalizedPaidByName)
      .map(member => String(member.id)),
    ...settlements
      .filter(settlement => String(settlement.groupId || '') === resolvedGroupId)
      .filter(settlement => normalizeName(settlement.payerName) === normalizedPaidByName)
      .map(settlement => String(settlement.payerId || '')),
  ]);

  const currentUserName =
    groupMembers.find(member => String(member.id) === resolvedCurrentUserId)?.name ?? '';
  const normalizedCurrentUserName = normalizeName(currentUserName);
  const currentUserIdCandidates = uniqueNonEmpty([
    resolvedCurrentUserId,
    ...groupMembers
      .filter(member => normalizeName(member.name) === normalizedCurrentUserName)
      .map(member => String(member.id)),
    ...settlements
      .filter(settlement => String(settlement.groupId || '') === resolvedGroupId)
      .filter(settlement => normalizeName(settlement.payerName) === normalizedCurrentUserName)
      .map(settlement => String(settlement.payerId || '')),
    ...settlements
      .filter(settlement => String(settlement.groupId || '') === resolvedGroupId)
      .filter(settlement => normalizeName(settlement.receiverName) === normalizedCurrentUserName)
      .map(settlement => String(settlement.receiverId || '')),
  ]);

  const isMyExpense = payerIdCandidates.some(candidateId => currentUserIdCandidates.includes(candidateId));

  const myShareAmount =
    normalizedSplits.find(split => currentUserIdCandidates.includes(String(split.userId)))?.amount ?? 0;

  const isSettlementEntry = String(expense.description || '').trim().toLowerCase() === 'settlement';
  const expenseSettlements = settlementsByExpenseId.get(String(expense.id)) ?? [];

  const settledAmountForPair = (payerId: string, receiverId: string) => {
    return roundCurrency(
      expenseSettlements
        .filter(settlement => String(settlement.payerId) === payerId && String(settlement.receiverId) === receiverId)
        .reduce((sum, settlement) => sum + Number(settlement.amount ?? 0), 0)
    );
  };

  const settledAmountForReceiverCandidates = (payerId: string, receiverIds: string[]) => {
    return roundCurrency(
      receiverIds.reduce((sum, receiverId) => sum + settledAmountForPair(payerId, receiverId), 0)
    );
  };

  const sumPairMapAcrossCandidates = (
    map: Map<string, number>,
    payerIds: string[],
    receiverIds: string[]
  ) => {
    return roundCurrency(
      payerIds.reduce((sum, payerId) => {
        const receiverTotal = receiverIds.reduce((inner, receiverId) => {
          const key = `${resolvedGroupId}:${payerId}:${receiverId}`;
          return inner + (map.get(key) ?? 0);
        }, 0);

        return sum + receiverTotal;
      }, 0)
    );
  };

  const resolvedPayerId = String(payerIdCandidates[0] ?? paidBy.id ?? '');
  const pairTotalOutstandingCurrentToPayer = roundCurrency(
    payerIdCandidates.reduce((sum, payerId) => {
      const pairOutstandingFromCandidate = currentUserIdCandidates.reduce((inner, currentCandidateId) => {
        const key = `${resolvedGroupId}:${currentCandidateId}:${payerId}`;
        return inner + (outstandingAmountByPair.get(key) ?? 0);
      }, 0);

      return sum + pairOutstandingFromCandidate;
    }, 0)
  );
  const pairTotalSettledCurrentToPayer = roundCurrency(
    payerIdCandidates.reduce((sum, payerId) => {
      const pairSettledFromCandidate = currentUserIdCandidates.reduce((inner, currentCandidateId) => {
        const key = `${resolvedGroupId}:${currentCandidateId}:${payerId}`;
        return inner + (settledAmountByPair.get(key) ?? 0);
      }, 0);

      return sum + pairSettledFromCandidate;
    }, 0)
  );

  const isPairFullySettledCurrentToPayer =
    pairTotalOutstandingCurrentToPayer > 0 &&
    pairTotalSettledCurrentToPayer >= pairTotalOutstandingCurrentToPayer - 0.01;

  const unsettledCounterparties = isMyExpense
    ? normalizedSplits
        .filter(split => !currentUserIdCandidates.includes(String(split.userId)))
        .map(split => {
          const splitMemberName =
            groupMembers.find(member => String(member.id) === String(split.userId))?.name ?? '';
          const normalizedSplitMemberName = normalizeName(splitMemberName);

          const splitMemberPayerCandidates = uniqueNonEmpty([
            String(split.userId),
            ...groupMembers
              .filter(member => normalizeName(member.name) === normalizedSplitMemberName)
              .map(member => String(member.id)),
            ...settlements
              .filter(settlement => String(settlement.groupId || '') === resolvedGroupId)
              .filter(settlement => normalizeName(settlement.payerName) === normalizedSplitMemberName)
              .map(settlement => String(settlement.payerId || '')),
          ]);

          const expenseSpecificSettled = roundCurrency(
            splitMemberPayerCandidates.reduce((sum, splitPayerId) => {
              return sum + settledAmountForReceiverCandidates(splitPayerId, currentUserIdCandidates);
            }, 0)
          );

          const pairOutstandingTotal = sumPairMapAcrossCandidates(
            outstandingAmountByPair,
            splitMemberPayerCandidates,
            currentUserIdCandidates
          );
          const pairSettledTotal = sumPairMapAcrossCandidates(
            settledAmountByPair,
            splitMemberPayerCandidates,
            currentUserIdCandidates
          );

          const isThisPairFullySettled =
            pairOutstandingTotal > 0 && pairSettledTotal >= pairOutstandingTotal - 0.01;

          const settledAmount = isThisPairFullySettled
            ? roundCurrency(split.amount)
            : Math.min(roundCurrency(split.amount), expenseSpecificSettled);

          return {
            userId: String(split.userId),
            amount: roundCurrency(split.amount),
            outstanding: roundCurrency(Math.max(0, split.amount - settledAmount)),
          };
        })
        .filter(split => split.outstanding >= 0.01)
    : null;

  const unsettledCounterparty = isMyExpense
    ? unsettledCounterparties?.[0] ?? null
    : null;

  const counterpartyId = isMyExpense
    ? unsettledCounterparty?.userId ?? ''
    : resolvedPayerId;

  const counterpartyName =
    group?.members?.find((member: any) => String(member.id) === String(counterpartyId))?.name ??
    (isMyExpense ? `User ${counterpartyId}` : paidByName);

  const settledAmount = isMyExpense
    ? 0
    : roundCurrency(
        currentUserIdCandidates.reduce(
          (sum, currentCandidateId) =>
            sum + settledAmountForReceiverCandidates(currentCandidateId, payerIdCandidates),
          0
        )
      );

  const totalOutstandingForPayer = isMyExpense
    ? roundCurrency(
        (unsettledCounterparties ?? []).reduce((sum, split) => sum + split.outstanding, 0)
      )
    : 0;

  const statusAmount = isMyExpense
    ? totalOutstandingForPayer
    : roundCurrency(myShareAmount - settledAmount);

  const effectiveStatusAmount = !isMyExpense && isPairFullySettledCurrentToPayer
    ? 0
    : statusAmount;

  const isSettledWithCounterparty = isMyExpense
    ? (unsettledCounterparties?.length ?? 0) === 0
    : effectiveStatusAmount < 0.01;

  const splitParticipantName = (splitUserId: string) =>
    String(splitUserId) === resolvedCurrentUserId
      ? 'You'
      : String(splitUserId) === String(paidBy.id ?? '')
      ? paidByName || `User ${splitUserId}`
      : groupMembers.find(member => String(member.id) === String(splitUserId))?.name ?? `User ${splitUserId}`;

  const splitParticipantsForSettle = normalizedSplits.map(split => ({
    userId: split.userId,
    amount: roundCurrency(split.amount),
    name: splitParticipantName(String(split.userId)),
    }));



  return (
  <View style={[styles.card, activeMenuId === expense.id && styles.activeCard]}>
    {/* Top Row */}
<View style={styles.topRow}>
  <Text style={styles.title}> {expense.description}</Text>

  <View style={styles.amountRow}>
    <Text style={styles.amount}>
      {formatCurrency(expense.amount)}
    </Text>

    <View style={styles.menuAnchor}>
      <Pressable
        onPress={() =>
          setActiveMenuId(
            activeMenuId === expense.id ? null : expense.id
          )
        }
        style={styles.menuButton}
      >
        <Icon name="more-vertical" size={18} color="#98A2B3" />
      </Pressable>


      {activeMenuId === expense.id && (
        <View style={styles.dropdown}>

           {!isSettlementEntry && !isSettledWithCounterparty && !!counterpartyId && effectiveStatusAmount >= 0.01 ? (
            <Pressable
              onPress={() => {
                setActiveMenuId(null);
                navigation.navigate('SettleUp', {
                  mode: 'single',
                  memberId: String(counterpartyId),
                  amount: effectiveStatusAmount,
                  memberName: counterpartyName,
                  isYouPaying: !isMyExpense,
                  groupId: String(expense.groupId),
                  expenseContext: {
                    expenseId: String(expense.id),
                    description: expense.description,
                    amount: roundCurrency(expense.amount),
                    groupId: String(expense.groupId ?? ''),
                    groupName: group?.name,
                    paidBy: {
                      id: String(paidBy.id ?? ''),
                      name: paidByName,
                    },
                    splits: splitParticipantsForSettle,
                  },
                });
              }}
              style={styles.menuItem}
            >
              <View style={styles.menuRowItem}>
                <Icon name="dollar-sign" size={16} color="#009966" />
                <Text style={[styles.menuText, styles.settleUpMenuText]}>
                  Settle Up
                </Text>
              </View>
            </Pressable>
           ) : (
            <View style={styles.menuItem}>
              <View style={styles.menuRowItem}>
                <Icon name="check-circle" size={16} color="#12B76A" />
                <Text style={[styles.menuText, styles.settledMenuText]}>
                  Settled
                </Text>
              </View>
            </View>
           )}

          <Pressable
            onPress={() => onEdit(expense)}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Image source={editIcon} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => onDelete(expense)}
            style={styles.menuItem}
          >
            <View style={styles.menuRowItem}>
              <Image source={deleteIcon} style={styles.menuIcon} />
              <Text style={[styles.menuText, styles.deleteMenuText]}>
                Delete
              </Text>
            </View>
          </Pressable>


        </View>
      )}
    </View>
  </View>
</View>


    {/* Group + Date */}
    <Text style={styles.meta}>
      {group?.emoji} {group?.name}  •  {new Date(expense.date).toLocaleDateString()}
    </Text>

    {/* Paid + Owed */}
    <View style={styles.paidRow}>
      <Text style={styles.metaLight}>Paid by </Text>
      <Text style={styles.bold}>{paidByName}</Text>

      <Text style={styles.metaLight}>  •  </Text>

      {isSettlementEntry || isSettledWithCounterparty || effectiveStatusAmount < 0.01 ? (
        <Text style={styles.settledText}>Settled</Text>
      ) : (
        <Text style={isMyExpense ? styles.owedText : styles.oweText}>
          {isMyExpense ? 'You are owed: ' : 'You owe: '}
          {formatCurrency(effectiveStatusAmount)}
        </Text>
      )}
    </View>

    {/* Divider */}
    <View style={styles.divider} />

{/* Split Pills (INLINE like screenshot) */}
<View style={styles.splitRow}>
  <Text style={styles.metaLight}>Split:</Text>

  {normalizedSplits.map(split => {
    const memberName = splitParticipantName(String(split.userId));

    return (
      <View key={split.userId} style={styles.splitPill}>
        <Text style={styles.splitText}>
          {memberName} {formatCurrency(split.amount)}
        </Text>
      </View>
    );
  })}
</View>
  </View>
)
}

const styles = StyleSheet.create({

card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 15,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  elevation: 3,
  shadowRadius: 8,
  overflow: 'visible',  
},

activeCard: {
  zIndex: 999,
},

menuAnchor: {
  position: 'relative',
},

topRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

amountContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

menuRowItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

menuIcon: {
  width: 16,
  height: 16,
},

title: {
  fontSize: 16,
  fontWeight: '600',
  color: '#101828',
},
amountRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

amount: {
  fontSize: 17,
  fontWeight: '700',
  color: '#101828',
  marginRight: 8,
},
menuButton: {
  padding: 4,
},

meta: {
  fontSize: 13,
  color: '#6A7282',
  marginTop: 6,
},
splitRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 7,
  marginTop: 1,
},
splitPill: {
  backgroundColor: '#F2F4F7',
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 14,
},
splitText: {
  fontSize: 12,
  color: '#344054',
},
metaLight: {
  fontSize: 13,
  color: '#98A2B3',
},
divider: {
  height: 1,
  backgroundColor: '#F2F4F7',
  marginVertical: 12,
},
paidRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
  flexWrap: 'wrap',
},
owedText: {
  color: '#12B76A',
  fontWeight: '600',
},

settledText: {
  color: '#12B76A',
  fontWeight: '700',
},

oweText: {
  color: '#F04438',
  fontWeight: '600',
},

bold: {
   fontWeight: '600',
},


menuItem: {
  paddingVertical: 12,
  paddingHorizontal: 16,
},

menuText: {
  fontSize: 14,
  fontWeight: '400',
  color: '#101828',
},

settleUpMenuText: {
  color: '#009966',
},

settledMenuText: {
  color: '#12B76A',
},

deleteMenuText: {
  color: '#FF2056',
},

dropdown: {
  position: 'absolute',
  top: 28,
  right: 0,
  width: 180,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  paddingVertical: 8,
  zIndex: 1000,
  elevation: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
},
});
