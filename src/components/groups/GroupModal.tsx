import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

type GroupModalProps = {
  visible: boolean;
  title: string;
  description: string;
  label: string;
  value: string;
  placeholder: string;
  confirmText: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  children?: React.ReactNode;
};

export default function GroupModal({
  visible,
  title,
  description,
  label,
  value,
  placeholder,
  confirmText,
  onChangeText,
  onClose,
  onConfirm,
  disabled = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  children,
}: GroupModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>

          <TouchableOpacity onPress={onClose}>
            <Icon name="x" size={22} color="#6A7282" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalDescription}>
          {description}
        </Text>

        <Text style={styles.label}>{label}</Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#99A1AF"
          style={styles.input}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />

        {children}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={disabled}
            style={[
              styles.createBtn,
              disabled && styles.disabledBtn,
            ]}
            onPress={onConfirm}
          >
            <Icon
              name="check"
              size={16}
              color={disabled ? '#9CA3AF' : '#fff'}
            />

            <Text
              style={[
                styles.createText,
                disabled && { color: '#9CA3AF' },
              ]}
            >
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
  },

  modalDescription: {
    fontSize: 14,
    color: '#6A7282',
    marginTop: 12,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A7282',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#009966',
    borderRadius: 20,
    padding: 14,
    fontSize: 15,
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },

  createBtn: {
    flex: 1,
    backgroundColor: '#009966',
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  disabledBtn: {
    backgroundColor: '#E5E7EB',
  },

  createText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});