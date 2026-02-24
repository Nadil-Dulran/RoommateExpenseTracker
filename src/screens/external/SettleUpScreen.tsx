import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { RootStackParamList } from '../../types/navigation';
import { expenses, currentUser } from '../../data/mockData';
import { calculateMemberBalances } from '../../services/financeService';
import { settleWithMember } from '../../services/financeService';

type RouteProps = RouteProp<RootStackParamList, 'SettleUp'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export default function SettleUpScreen() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps>();

  const { mode } = route.params;

  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    amount: number;
    isYouPaying: boolean;
  } | null>(null);

  // ----------------------------
  // CALCULATE SETTLEMENTS (FROM SERVICE)
  // ----------------------------

  const memberTotals = useMemo(() => {
    if (mode === 'single') {
      return [
        {
          id: route.params.memberId,
          name: 'Member',
          amount: route.params.amount,
          isYouPaying: true,
        },
      ];
    }

    return calculateMemberBalances(expenses, currentUser);
  }, [mode, route.params, expenses]);

  const totalYouOwe = useMemo(() => {
    return memberTotals
      .filter(m => m.isYouPaying)
      .reduce((sum, m) => sum + m.amount, 0);
  }, [memberTotals]);

  // ----------------------------
  // SUCCESS HANDLER
  // ----------------------------

  const handleConfirmSettle = () => {
    if (selectedMember) {
      settleWithMember(
        currentUser,
        selectedMember.id,
        selectedMember.amount,
        selectedMember.isYouPaying
      );
    }
    setSelectedMember(null);
    navigation.goBack();
  };

  // ----------------------------
  // UI
  // ----------------------------

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={26} color="#6a7282" />
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>Settle Up</Text>
            <Text style={styles.subtitle}>
              Simplified settlement plan
            </Text>
          </View>
        </View>

        {/* Total Summary (only in all mode) */}
        {mode === 'all' && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total you owe</Text>
            <Text style={styles.summaryAmount}>
              ${totalYouOwe.toFixed(2)}
            </Text>
            <Text style={styles.summarySub}>
              to {
                memberTotals.filter(m => m.isYouPaying).length
              } people
            </Text>
          </View>
        )}

        {/* Member List */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>
            Balances by Person
          </Text>

          {memberTotals.map(member => (
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
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontWeight: 'bold' }}>
                    {member.name[0]}
                  </Text>
                </View>

                <View>
                  <Text style={styles.memberName}>
                    {member.name}
                  </Text>
                  <Text
                    style={[
                      styles.memberStatus,
                      {
                        color: member.isYouPaying
                          ? '#ff2056'
                          : '#009966',
                      },
                    ]}
                  >
                    {member.isYouPaying
                      ? 'you owe'
                      : 'owes you'}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.memberAmount,
                    {
                      color: member.isYouPaying
                        ? '#ff2056'
                        : '#009966',
                    },
                  ]}
                >
                  ${member.amount.toFixed(2)}
                </Text>

                <TouchableOpacity
                  onPress={() => setSelectedMember(member)}
                  style={[
                    styles.settleButton,
                    {
                      backgroundColor: member.isYouPaying
                        ? '#ff2056'
                        : '#009966',
                    },
                  ]}
                >
                  <Text style={styles.settleText}>
                    Settle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!selectedMember} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Settle with {selectedMember?.name}?
            </Text>

            <Text style={styles.modalDesc}>
              {selectedMember?.isYouPaying
                ? `Mark $${selectedMember?.amount.toFixed(2)} as paid?`
                : `Mark balance as received?`}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setSelectedMember(null)}
                style={styles.cancelBtn}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmSettle}
                style={styles.confirmBtn}
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

  header: {
    padding: 20,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },

  subtitle: {
    fontSize: 14,
    color: '#6a7282',
  },

  summaryCard: {
    backgroundColor: '#ff2056',
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },

  summaryLabel: { color: '#fff', opacity: 0.8 },
  summaryAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  summarySub: { color: '#fff', opacity: 0.8 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 12,
  },

  memberCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  owingCard: {
    backgroundColor: '#fff5f7',
    borderWidth: 1,
    borderColor: '#ffd9e0',
  },

  owedCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },

  memberLeft: { flexDirection: 'row', alignItems: 'center' },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  memberName: { fontSize: 16, fontWeight: '600' },
  memberStatus: { fontSize: 12 },

  memberAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  settleButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },

  settleText: { color: '#fff', fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },

  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalDesc: { fontSize: 14, marginBottom: 20 },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },

  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 10,
  },

  confirmBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#101828',
    borderRadius: 12,
  },
});