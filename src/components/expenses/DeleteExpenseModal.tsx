import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Expense } from '../../types';

type Props = {
  visible: boolean;
  expense: Expense | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteExpenseModal({
  visible,
  expense,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.deleteOverlay}>
        <View style={styles.deleteCard}>
          <View style={styles.deleteIconWrapper}>
            <Icon name="trash-2" size={24} color="#FF2056" />
          </View>

          <Text style={styles.deleteTitle}>Delete Expense?</Text>

          <Text style={styles.deleteMessage}>
            Are you sure you want to delete "{expense?.description}"?
            {'\n'}This action cannot be undone.
          </Text>

          <View style={styles.deleteActions}>
            <Pressable
              style={styles.cancelDeleteBtn}
              onPress={onCancel}
            >
              <Text style={styles.cancelDeleteText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={styles.confirmDeleteBtn}
              onPress={onConfirm}
            >
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  deleteCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },

  deleteIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 35,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  deleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 10,
  },

  deleteMessage: {
    fontSize: 14,
    color: '#6A7282',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },

  deleteActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },

  cancelDeleteBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 10,
  },

  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#FF2056',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  cancelDeleteText: {
    fontWeight: '800',
    color: '#101828',
    fontFamily: 'Inter',
    fontSize: 16,
  },

  confirmDeleteText: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 16,
  },
  
});