import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import profileIcon from '../../../assets/ProfileIcon.png';
import { Image } from 'react-native';
import notificationIcon from '../../../assets/notification.png';
import settingsIcon from '../../../assets/settings.png';
import helpIcon from '../../../assets/help.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from '../../services/profileService';
import {launchImageLibrary} from 'react-native-image-picker';
import { currencies } from '../../constants/currencies';
import { useAppCurrency } from '../../context/CurrencyContext';

const AVATAR_COMPRESSION_QUALITY = 0.5;
const AVATAR_MAX_WIDTH = 720;
const AVATAR_MAX_HEIGHT = 720;
const MAX_AVATAR_BASE64_BYTES = 700 * 1024;
const ACCOUNT_DELETE_CLEANUP_ITEMS = [
  'Your account and profile data with notifications.',
  'Data such as expenses, splits and settlements created by you.',
  'Removal from existing groups and prevention of future group joins.',
  'Groups created by this user and dependent data such as expenses, splits, settlements where there are multiple participants.',
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { currency, setCurrencyCode } = useAppCurrency();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarMimeType, setAvatarMimeType] = useState('image/jpeg');
  const [avatarBase64Payload, setAvatarBase64Payload] = useState<string | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  const estimateBase64Bytes = (base64: string) => {
    const compact = base64.replace(/\s/g, '');
    const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;

    return Math.floor((compact.length * 3) / 4) - padding;
  };

  const toImageUri = (value?: string | null, mimeType?: string) => {
    if (!value) {
      return null;
    }

    const normalizedValue = value.trim();

    if (normalizedValue.startsWith('http://') || normalizedValue.startsWith('https://')) {
      return normalizedValue;
    }

    if (normalizedValue.startsWith('data:image')) {
      return normalizedValue;
    }

    const compactBase64 = normalizedValue.replace(/\s/g, '');

    return `data:${mimeType || 'image/jpeg'};base64,${compactBase64}`;
  };

  const showSuccessMessage = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2200);
  };

  const pickImage = async () => {
    const previousAvatar = avatar;

    const response = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      selectionLimit: 1,
      quality: AVATAR_COMPRESSION_QUALITY,
      maxWidth: AVATAR_MAX_WIDTH,
      maxHeight: AVATAR_MAX_HEIGHT,
    });

    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert('Image selection failed', response.errorMessage || 'Please try again.');
      return;
    }

    const selectedAsset = response.assets?.[0];

    if (!selectedAsset?.base64) {
      Alert.alert('Image selection failed', 'Could not read selected image.');
      return;
    }

    const rawBase64 = selectedAsset.base64;
    const estimatedAvatarBytes = estimateBase64Bytes(rawBase64);

    if (estimatedAvatarBytes > MAX_AVATAR_BASE64_BYTES) {
      Alert.alert(
        'Image is too large',
        'Please pick a smaller image. For best results, use a square photo under 2 MB.',
      );
      return;
    }

    const selectedMimeType = selectedAsset.type || 'image/jpeg';
    const previewUri = toImageUri(rawBase64, selectedMimeType) || '';

    setAvatar(previewUri);
    setAvatarMimeType(selectedMimeType);

    try {
      setIsSaving(true);

      const updated = await profileService.updateProfile({
        name,
        email,
        phone,
        currency: selectedCurrency.code,
        avatarBase64: rawBase64,
      });

      await setCurrencyCode(selectedCurrency.code);

      setAvatar(toImageUri(updated.avatarBase64, selectedMimeType) || previewUri);
      setAvatarBase64Payload(updated.avatarBase64 ?? rawBase64);
      showSuccessMessage();
    } catch (error) {
      console.log('Avatar update failed', error);
      setAvatar(previousAvatar);

      if (error instanceof Error && error.message === 'No auth token found') {
        Alert.alert('Session expired', 'Please login again.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Avatar update failed', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Sign out failed');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      await profileService.deleteAccount();

      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');

      navigation.navigate('Login');
    } catch (error) {
      console.log('Account delete failed', error);

      if (error instanceof Error && error.message === 'No auth token found') {
        Alert.alert('Session expired', 'Please login again.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await profileService.getProfile();

      setAvatar(toImageUri(data.avatarBase64, avatarMimeType));
      setAvatarBase64Payload(data.avatarBase64 ?? undefined);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');

      const currency = currencies.find(c => c.code === data.currency);

      if (currency) {
        setSelectedCurrency(currency);
        await setCurrencyCode(currency.code);
      }
    } catch (error) {
      console.log('Failed to load profile', error);

      if (error instanceof Error && error.message === 'No auth token found') {
        Alert.alert('Session expired', 'Please login again.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Failed to load profile', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload = {
        name,
        email,
        phone,
        currency: selectedCurrency.code,
        ...(avatarBase64Payload ? { avatarBase64: avatarBase64Payload } : {}),
      };

      await profileService.updateProfile(payload);
      await setCurrencyCode(selectedCurrency.code);
      showSuccessMessage();
    } catch (error) {
      console.log('Update failed', error);

      if (error instanceof Error && error.message === 'No auth token found') {
        Alert.alert('Session expired', 'Please login again.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009966" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
         {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Image */}
      <View style={styles.card}>
        <View style={styles.imageSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={avatar ? { uri: avatar } : profileIcon}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => {
                void pickImage();
              }}
              disabled={isSaving}
            >
              <Icon name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>  

        {/* Input Fields */}
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Currency</Text>
          <TouchableOpacity
            style={styles.currencyRow}
            onPress={() => setShowCurrencyModal(true)}
          >
            <Text style={styles.currencyText}>
              {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
            </Text>
            <Icon name="chevron-right" size={20} color="#6a7282" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {showSuccessToast && (
          <View style={styles.successToast}>
            <Icon name="check-circle" size={16} color="#16A34A" />
            <Text style={styles.successToastText}>Profile updated successfully</Text>
          </View>
        )}

      <View style={styles.settingsCard}>
  
       {/* Notifications */}
       <TouchableOpacity style={styles.settingsRow}>
          <View style={styles.iconWrapper}>
         <Image source={notificationIcon} style={{ width: 39.9, height: 39.9 }} />
          </View>

         <Text style={styles.settingsText}>Notifications</Text>

        <Icon name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

      <View style={styles.divider} />

      {/* Preferences */}
       <TouchableOpacity style={styles.settingsRow}>
        <View style={styles.iconWrapper}>
         <Image source={settingsIcon} style={{ width: 39.9, height: 39.9 }} />
        </View>

        <Text style={styles.settingsText}>Preferences</Text>

         <Icon name="chevron-right" size={20} color="#9CA3AF" />
       </TouchableOpacity>

      <View style={styles.divider} />

      {/* Help & Support */}
     <TouchableOpacity style={styles.settingsRow}>
      <View style={styles.iconWrapper}>
        <Image source={helpIcon} style={{ width: 39.9, height: 39.9 }} />
      </View>

      <Text style={styles.settingsText}>Help & Support</Text>

        <Icon name="chevron-right" size={20} color="#9CA3AF" />
     </TouchableOpacity>

    </View>


        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out" size={20} color="#ff2056" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={() => setShowDeleteModal(true)}
          disabled={isDeleting}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Currency</Text>
             <FlatList
                data={currencies}
                keyExtractor={(item) => item.code}
                contentContainerStyle={{ paddingBottom: 10 }}
                renderItem={({ item }) => {
                const isSelected = selectedCurrency.code === item.code;

                 return (
            <TouchableOpacity
                    activeOpacity={0.8}
                     onPress={() => {
                     setSelectedCurrency(item);
                     setShowCurrencyModal(false);
                     }}
                    style={[
                      styles.currencyCardModal,
                      isSelected && styles.selectedCurrencyCardModal,
                      ]}
               >
             {/* Symbol Circle */}
               <View style={styles.symbolWrapperModal}>
                   <Text style={styles.symbolTextModal}>
                        {item.symbol}
                  </Text>
               </View>

             {/* Text */}
                   <Text
                      style={[
                        styles.currencyTextModal,
                        isSelected && styles.selectedCurrencyTextModal,
                      ]}
                     >
                     {item.code} - {item.name}
                  </Text>

              {/* Check */}
                 {isSelected && (
               <View style={styles.checkWrapperModal}>
                   <Icon name="check" size={14} color="#fff" />
              </View>
                  )}
            </TouchableOpacity>
             );
           }}
        />

        
            <TouchableOpacity
              onPress={() => setShowCurrencyModal(false)}
               style={styles.cancelButton}
            > 
              <Text style={{ color: '#6a7282' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <View style={styles.deleteIconCircle}>
                <Icon name="alert-triangle" size={24} color="#DC2626" />
              </View>
              <Text style={styles.deleteModalTitle}>Delete Account</Text>
              <TouchableOpacity
                style={styles.deleteCloseButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Icon name="x" size={22} color="#6a7282" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.deleteModalScroll} showsVerticalScrollIndicator={true}>
              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalText}>
                  This account delete performs a hard delete with cleanup. It is not a logout or soft delete.
                </Text>

                <Text style={styles.deleteSectionTitle}>The following data will be deleted</Text>
                {ACCOUNT_DELETE_CLEANUP_ITEMS.map((item) => (
                  <View key={item} style={styles.deleteListItem}>
                    <Text style={styles.deleteListBullet}>-</Text>
                    <Text style={styles.deleteListText}>{item}</Text>
                  </View>
                ))}

                <Text style={styles.deleteWarningText}>
                  This action is permanent and cannot be undone.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.dangerButtonsRow}>
              <TouchableOpacity
                style={styles.dangerCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={{ color: '#595e68', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dangerConfirmButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Confirm Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
   header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#101828',
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 60,
    borderColor: '#F3F4F6',
    borderWidth: 2,
},
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#009966',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  changePhotoText: {
    marginTop: 10,
    color: '#009966',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 5,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    color: '#6A7282',
    marginTop: 25,
  },
  input: {
    fontSize: 15,
    color: '#1018287b',
    fontWeight: '500',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee7b',
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  currencyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
  },
  saveButton: {
    backgroundColor: '#009966',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: -6,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  successToastText: {
    color: '#166534',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 16,
    elevation: 1,
  },
  logoutText: {
    color: '#ff2056',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  currencyItem: {
    paddingVertical: 14,
  },
  currencyItemText: {
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f9f7f7',
    marginHorizontal: 3,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 16,
    elevation: 2,
  },
settingsCard: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  marginTop: 5,
  borderRadius: 20,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#F3F4F6',
},

settingsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 18,
  paddingHorizontal: 16,
},

iconWrapper: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
},

settingsText: {
  flex: 1,
  fontSize: 16,
  fontWeight: '700',
  color: '#101828',
  fontFamily: 'Inter',
},

divider: {
  height: 1,
  backgroundColor: '#F3F4F6',
},

versionContainer: {
  alignItems: 'center',
  padding: 8,
  marginBottom: 20,
},
versionText: {
  color: '#99A1AF',
  fontSize: 12,
  fontFamily: 'Inter-regular',
},
currencyCardModal: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F3F4F6',
  padding: 16,
  borderRadius: 20,
  marginBottom: 14,
},
selectedCurrencyCardModal: {
  backgroundColor: '#E6F4ED',
  borderWidth: 2,
  borderColor: '#009966',
},
symbolWrapperModal: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#FFFFFF',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 14,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
symbolTextModal: {
  fontSize: 18,
  fontWeight: '600',
  color: '#111827',
},
currencyTextModal: {
  flex: 1,
  fontSize: 16,
  fontWeight: '600',
  color: '#111827',
},

selectedCurrencyTextModal: {
  color: '#009966',
},

checkWrapperModal: {
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: '#009966',
  justifyContent: 'center',
  alignItems: 'center',
},
  deleteButton: {
    backgroundColor: '#FEEAEA',
    marginHorizontal: 20,
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#ff2056',
    fontWeight: '700',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  deleteIconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#FEE2E2',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  deleteCloseButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 8,
  },
  deleteModalScroll: {
    maxHeight: 330,
    marginBottom: 16,
  },
  deleteModalBody: {
    paddingRight: 8,
  },
  deleteModalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
    textAlign: 'center'
  },
  deleteSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 12,
  },
  deleteListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deleteListBullet: {
    color: '#DC2626',
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
    fontWeight: '700',
  },
  deleteListText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  deleteWarningText: {
    marginTop: 8,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
  },
  dangerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dangerCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  dangerConfirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
});
