import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import profileIcon from '../../../assets/ProfileIcon.png';

type SplitMode = 'equal' | 'exact' | 'percentage';

type Participant = {
  id: string;
  name: string;
  avatarUri?: string | null;
};

type Props = {
  visible: boolean;
  description: string;
  amount: string;
  currencySymbol: string;
  splitType: SplitMode;
  participants: Participant[];
  exactSplits: Record<string, string>;
  percentageSplits: Record<string, string>;
  isAmountLocked: boolean;
  saving: boolean;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSplitTypeChange: (mode: SplitMode) => void;
  onExactSplitChange: (userId: string, value: string) => void;
  onPercentageSplitChange: (userId: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  formatCurrency: (value: number) => string;
};

const roundCurrency = (value: number) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const avatarSource = (avatarUri?: string | null) =>
  avatarUri ? { uri: avatarUri } : profileIcon;

export default function EditExpenseModal({
  visible,
  description,
  amount,
  currencySymbol,
  splitType,
  participants,
  exactSplits,
  percentageSplits,
  isAmountLocked,
  saving,
  onDescriptionChange,
  onAmountChange,
  onSplitTypeChange,
  onExactSplitChange,
  onPercentageSplitChange,
  onCancel,
  onSave,
  formatCurrency,
}: Props) {
  const normalizedAmount = Number.parseFloat(amount) || 0;
  const equalShare = participants.length ? normalizedAmount / participants.length : 0;
  const exactTotal = Object.values(exactSplits).reduce(
    (sum, value) => sum + (Number.parseFloat(value) || 0),
    0,
  );
  const percentageTotal = Object.values(percentageSplits).reduce(
    (sum, value) => sum + (Number.parseFloat(value) || 0),
    0,
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Expense</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Icon name="x" size={22} color="#6A7282" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Description</Text>
            <TextInput value={description} onChangeText={onDescriptionChange} style={styles.input} />

            <Text style={styles.label}>Amount</Text>
            <View style={[styles.amountContainer, isAmountLocked && styles.lockedAmountContainer]}>
              <Text style={styles.currency}>{currencySymbol}</Text>
              <TextInput
                value={amount}
                onChangeText={onAmountChange}
                keyboardType="decimal-pad"
                editable={!isAmountLocked}
                style={styles.amountInput}
              />
            </View>
            {isAmountLocked && (
              <Text style={styles.lockedAmountHint}>
                Amount cannot be changed after expense is settled.
              </Text>
            )}

            <Text style={styles.label}>Split</Text>
            <View style={styles.toggleRow}>
              {(['equal', 'exact', 'percentage'] as SplitMode[]).map(mode => (
                <Pressable
                  key={mode}
                  onPress={() => onSplitTypeChange(mode)}
                  style={[styles.toggle, splitType === mode && styles.activeToggle]}
                >
                  <Text style={[styles.toggleText, splitType === mode && styles.activeToggleText]}>
                    {mode === 'equal' ? 'Equal' : mode === 'exact' ? 'Exact' : '%'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.preview}>
              <Text style={styles.previewTitle}>
                {splitType === 'equal'
                  ? 'Split equally:'
                  : splitType === 'exact'
                    ? 'Enter exact amounts:'
                    : 'Enter percentages:'}
              </Text>

              {!participants.length ? (
                <Text style={styles.emptyText}>No participants found for this expense.</Text>
              ) : splitType === 'equal' ? (
                participants.map(member => (
                  <MemberRow key={member.id} member={member}>
                    <Text style={styles.splitAmount}>{currencySymbol}{roundCurrency(equalShare).toFixed(2)}</Text>
                  </MemberRow>
                ))
              ) : splitType === 'exact' ? (
                <>
                  {participants.map(member => (
                    <MemberRow key={member.id} member={member}>
                      <TextInput
                        style={styles.splitInput}
                        keyboardType="decimal-pad"
                        value={exactSplits[member.id] ?? '0'}
                        onChangeText={value => onExactSplitChange(member.id, value)}
                      />
                    </MemberRow>
                  ))}
                  <Summary valid={Math.abs(exactTotal - normalizedAmount) < 0.01}>
                    {formatCurrency(exactTotal)} / {formatCurrency(normalizedAmount)}
                  </Summary>
                </>
              ) : (
                <>
                  {participants.map(member => {
                    const percentage = Number.parseFloat(percentageSplits[member.id] || '0') || 0;
                    return (
                      <MemberRow key={member.id} member={member}>
                        <View style={styles.splitRight}>
                          <View style={styles.percentageGroup}>
                            <TextInput
                              style={styles.percentageInput}
                              keyboardType="decimal-pad"
                              value={percentageSplits[member.id] ?? '0'}
                              onChangeText={value => onPercentageSplitChange(member.id, value)}
                            />
                            <Text style={styles.percentageSuffix}>%</Text>
                          </View>
                          <Text style={styles.splitAmount}>{currencySymbol}{roundCurrency((normalizedAmount * percentage) / 100).toFixed(2)}</Text>
                        </View>
                      </MemberRow>
                    );
                  })}
                  <Summary valid={Math.abs(percentageTotal - 100) < 0.1}>
                    {percentageTotal.toFixed(2)}% / 100%
                  </Summary>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onCancel} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={onSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MemberRow({ member, children }: { member: Participant; children: React.ReactNode }) {
  return (
    <View style={styles.memberRow}>
      <View style={styles.memberLeft}>
        <Image source={avatarSource(member.avatarUri)} style={styles.avatar} />
        <Text style={styles.memberName}>{member.name}</Text>
      </View>
      {children}
    </View>
  );
}

function Summary({ valid, children }: { valid: boolean; children: React.ReactNode }) {
  return <Text style={[styles.summary, valid ? styles.summarySuccess : styles.summaryError]}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  title: { fontSize: 22, fontWeight: '700', color: '#101828' },
  label: { fontSize: 14, fontWeight: '600', color: '#344054', marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 14, fontSize: 15 },
  amountContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 14 },
  lockedAmountContainer: { backgroundColor: '#F2F4F7', borderColor: '#D0D5DD' },
  currency: { marginRight: 6, fontSize: 16 },
  amountInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  lockedAmountHint: { marginTop: 6, fontSize: 12, color: '#667085' },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  toggle: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  activeToggle: { backgroundColor: '#E6F4EC', borderColor: '#009966' },
  toggleText: { color: '#6A7282', fontWeight: '500' },
  activeToggleText: { color: '#009966', fontWeight: '600' },
  preview: { marginTop: 14, backgroundColor: '#F9FAFB', borderRadius: 18, padding: 14 },
  previewTitle: { fontSize: 13, color: '#6A7282', marginBottom: 10 },
  emptyText: { fontSize: 13, color: '#98A2B3' },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  memberName: { fontSize: 14, color: '#101828' },
  splitRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitAmount: { fontSize: 15, fontWeight: '600', color: '#101828' },
  splitInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, minWidth: 90, backgroundColor: '#FFFFFF', textAlign: 'right', fontSize: 14 },
  percentageGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFFFFF', minWidth: 95, justifyContent: 'flex-end' },
  percentageInput: { minWidth: 50, paddingVertical: 4, textAlign: 'right' },
  percentageSuffix: { marginLeft: 4, color: '#6A7282', fontWeight: '600' },
  summary: { marginTop: 6, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  summarySuccess: { color: '#12B76A' },
  summaryError: { color: '#F04438' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelButton: { flex: 1, backgroundColor: '#E5E7EB', padding: 14, borderRadius: 16, alignItems: 'center', marginRight: 10 },
  saveButton: { flex: 1, backgroundColor: '#009966', padding: 14, borderRadius: 16, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  cancelText: { color: '#6A7282', fontWeight: '600' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});
