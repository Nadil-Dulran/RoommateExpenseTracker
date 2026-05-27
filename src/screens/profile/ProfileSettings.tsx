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
  Clipboard,
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [supportEmailCopied, setSupportEmailCopied] = useState(false);

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

  const handleCopySupportEmail = async () => {
    await Clipboard.setString('nadil.dulran@akvasoft.com');
    setSupportEmailCopied(true);

    setTimeout(() => {
      setSupportEmailCopied(false);
    }, 2000);
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
       <TouchableOpacity
         style={styles.settingsRow}
         onPress={() => setShowNotificationModal(true)}
       >
          <View style={styles.iconWrapper}>
         <Image source={notificationIcon} style={{ width: 39.9, height: 39.9 }} />
          </View>

         <Text style={styles.settingsText}>Notifications</Text>

        <Icon name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

      <View style={styles.divider} />

      {/* Preferences */}
       <TouchableOpacity
         style={styles.settingsRow}
         onPress={() => setShowPreferencesModal(true)}
       >
        <View style={styles.iconWrapper}>
         <Image source={settingsIcon} style={{ width: 39.9, height: 39.9 }} />
        </View>

        <Text style={styles.settingsText}>Preferences</Text>

         <Icon name="chevron-right" size={20} color="#9CA3AF" />
       </TouchableOpacity>

      <View style={styles.divider} />

      {/* Help & Support */}
     <TouchableOpacity
       style={styles.settingsRow}
       onPress={() => setShowHelpModal(true)}
     >
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
            <View style={styles.currencyModalHeader}>
              <View style={styles.currencyModalIconCircle}>
                <Icon name="dollar-sign" size={22} color="#009966" />
              </View>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <Text style={styles.currencyModalSubtitle}>
                Choose the currency you want to use across the app.
              </Text>

              <View style={styles.currencyModalCurrentBadge}>
                <Text style={styles.currencyModalCurrentBadgeLabel}>Current</Text>
                <Text style={styles.currencyModalCurrentBadgeValue}>
                  {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
                </Text>
              </View>
            </View>

            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.currencyModalList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedCurrency.code === item.code;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedCurrency(item);
                      setShowCurrencyModal(false);
                    }}
                    style={[
                      styles.currencyCardModal,
                      isSelected && styles.selectedCurrencyCardModal,
                    ]}
                  >
                    <View style={styles.symbolWrapperModal}>
                      <Text style={styles.symbolTextModal}>{item.symbol}</Text>
                    </View>

                    <View style={styles.currencyModalItemMeta}>
                      <Text
                        style={[
                          styles.currencyTextModal,
                          isSelected && styles.selectedCurrencyTextModal,
                        ]}
                      >
                        {item.code}
                      </Text>
                      <Text style={styles.currencyModalItemName}>{item.name}</Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.currencyModalSelectedPill}>
                        <Icon name="check" size={13} color="#fff" />
                        <Text style={styles.currencyModalSelectedPillText}>Selected</Text>
                      </View>
                    ) : (
                      <Icon name="chevron-right" size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              onPress={() => setShowCurrencyModal(false)}
              style={styles.currencyModalDoneButton}
            >
              <Text style={styles.currencyModalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preferences Info Modal */}
      <Modal
        visible={showPreferencesModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPreferencesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.preferencesModalContent}>
            <View style={styles.preferencesModalHeader}>
              <View style={styles.preferencesIconCircle}>
                <Icon name="settings" size={24} color="#047857" />
              </View>
              <Text style={styles.preferencesModalTitle}>Preferences</Text>
              <TouchableOpacity
                style={styles.preferencesCloseButton}
                onPress={() => setShowPreferencesModal(false)}
              >
                <Icon name="x" size={22} color="#6a7282" />
              </TouchableOpacity>
            </View>

            <View style={styles.preferencesModalBody}>
              <Text style={styles.preferencesModalText}>
                This feature is currently being developed.
              </Text>

              <View style={styles.preferencesFeatureCard}>
                <View style={styles.preferencesFeatureDot} />
                <View style={styles.preferencesFeatureTextWrap}>
                  <Text style={styles.preferencesFeatureTitle}>Custom app preferences</Text>
                  <Text style={styles.preferencesFeatureText}>
                    We are building options to personalize the app experience.
                  </Text>
                </View>
              </View>

              <View style={styles.preferencesFeatureCard}>
                <View style={[styles.preferencesFeatureDot, styles.preferencesFeatureDotSoon]} />
                <View style={styles.preferencesFeatureTextWrap}>
                  <Text style={styles.preferencesFeatureTitle}>Smart controls</Text>
                  <Text style={styles.preferencesFeatureText}>
                    More settings and tuning options will be added in a future release.
                  </Text>
                </View>
              </View>

              <Text style={styles.preferencesFooterText}>
                Thanks for your patience while we prepare this update.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.preferencesDoneButton}
              onPress={() => setShowPreferencesModal(false)}
            >
              <Text style={styles.preferencesDoneButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModalContent}>
            <View style={styles.helpModalHeader}>
              <View style={styles.helpIconCircle}>
                <Icon name="help-circle" size={24} color="#059669" />
              </View>
              <Text style={styles.helpModalTitle}>Help & Support</Text>
              <TouchableOpacity
                style={styles.helpCloseButton}
                onPress={() => setShowHelpModal(false)}
              >
                <Icon name="x" size={22} color="#6a7282" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpModalScroll} showsVerticalScrollIndicator={true}>
              <View style={styles.helpModalBody}>
                <Text style={styles.helpModalText}>
                  Need help with your account, app usage or a bug report? Reach out using the contact details below.
                </Text>

                <View style={styles.helpInfoBox}>
                  <Icon name="mail" size={20} color="#059669" />
                  <View style={styles.helpInfoText}>
                    <Text style={styles.helpLabel}>Contact email</Text>
                    <Text style={styles.helpValue}>nadil.dulran@akvasoft.com</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.helpCopyButton}
                    onPress={handleCopySupportEmail}
                  >
                    <Icon
                      name={supportEmailCopied ? 'check' : 'copy'}
                      size={18}
                      color={supportEmailCopied ? '#059669' : '#6a7282'}
                    />
                    {supportEmailCopied && <Text style={styles.helpCopiedText}>Copied!</Text>}
                  </TouchableOpacity>
                </View>

                <Text style={styles.helpSectionTitle}>What we can help with</Text>

                <View style={styles.helpFeatureCard}>
                  <View style={styles.helpFeatureDot} />
                  <View style={styles.helpFeatureTextWrap}>
                    <Text style={styles.helpFeatureTitle}>Account support</Text>
                    <Text style={styles.helpFeatureText}>
                      Login issues, signup questions, profile updates and account access problems.
                    </Text>
                  </View>
                </View>

                <View style={styles.helpFeatureCard}>
                  <View style={[styles.helpFeatureDot, styles.helpFeatureDotAccent]} />
                  <View style={styles.helpFeatureTextWrap}>
                    <Text style={styles.helpFeatureTitle}>App feedback</Text>
                    <Text style={styles.helpFeatureText}>
                      Share feature requests, usability feedback or anything that would improve your experience.
                    </Text>
                  </View>
                </View>

                <View style={styles.helpFeatureCard}>
                  <View style={[styles.helpFeatureDot, styles.helpFeatureDotSoon]} />
                  <View style={styles.helpFeatureTextWrap}>
                    <Text style={styles.helpFeatureTitle}>Issue reporting</Text>
                    <Text style={styles.helpFeatureText}>
                      Send bug details, screenshots and the steps to reproduce the problem if possible.
                    </Text>
                  </View>
                </View>

                <Text style={styles.helpFooterText}>
                  For best results, include your account email and a short description of the issue.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.helpDoneButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.helpDoneButtonText}>Got it</Text>
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

      {/* Notification Info Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModalContent}>
            <View style={styles.notificationModalHeader}>
              <View style={styles.notificationIconCircle}>
                <Icon name="bell" size={24} color="#0F766E" />
              </View>
              <Text style={styles.notificationModalTitle}>Notifications</Text>
              <TouchableOpacity
                style={styles.notificationCloseButton}
                onPress={() => setShowNotificationModal(false)}
              >
                <Icon name="x" size={22} color="#6a7282" />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationModalBody}>
              <Text style={styles.notificationModalText}>
                You can already see in-app notifications in the app.
              </Text>

              <View style={styles.notificationFeatureCard}>
                <View style={styles.notificationFeatureDot} />
                <View style={styles.notificationFeatureTextWrap}>
                  <Text style={styles.notificationFeatureTitle}>In-app notifications</Text>
                  <Text style={styles.notificationFeatureText}>
                    Stay updated with activity, reminders, and group events inside the app.
                  </Text>
                </View>
              </View>

              <View style={styles.notificationFeatureCard}>
                <View style={[styles.notificationFeatureDot, styles.notificationFeatureDotSoon]} />
                <View style={styles.notificationFeatureTextWrap}>
                  <Text style={styles.notificationFeatureTitle}>Device notifications</Text>
                  <Text style={styles.notificationFeatureText}>
                    Device-wise notifications are coming soon.
                  </Text>
                </View>
              </View>

              <Text style={styles.notificationFooterText}>
                We are polishing the experience and will enable it in a future update.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.notificationDoneButton}
              onPress={() => setShowNotificationModal(false)}
            >
              <Text style={styles.notificationDoneButtonText}>Got it</Text>
            </TouchableOpacity>
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
currencyModalHeader: {
  alignItems: 'center',
  marginBottom: 16,
},
currencyModalIconCircle: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#ECFDF5',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#D1FAE5',
},
currencyModalSubtitle: {
  marginTop: 6,
  fontSize: 13,
  lineHeight: 18,
  color: '#6B7280',
  textAlign: 'center',
},
currencyModalCurrentBadge: {
  marginTop: 14,
  width: '100%',
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  paddingVertical: 12,
  paddingHorizontal: 14,
  alignItems: 'center',
},
currencyModalCurrentBadgeLabel: {
  fontSize: 11,
  fontWeight: '700',
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  marginBottom: 4,
},
currencyModalCurrentBadgeValue: {
  fontSize: 14,
  fontWeight: '700',
  color: '#101828',
  textAlign: 'center',
},
currencyModalList: {
  paddingBottom: 12,
},
currencyCardModal: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F9FAFB',
  padding: 14,
  borderRadius: 18,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
selectedCurrencyCardModal: {
  backgroundColor: '#ECFDF5',
  borderWidth: 1.5,
  borderColor: '#009966',
  shadowColor: '#009966',
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 12,
  elevation: 2,
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
  fontSize: 15,
  fontWeight: '700',
  color: '#111827',
},

currencyModalItemMeta: {
  flex: 1,
},

currencyModalItemName: {
  marginTop: 2,
  fontSize: 13,
  color: '#6B7280',
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
currencyModalSelectedPill: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: '#009966',
  paddingVertical: 8,
  paddingHorizontal: 10,
  borderRadius: 999,
},
currencyModalSelectedPillText: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: '700',
},
currencyModalDoneButton: {
  backgroundColor: '#009966',
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 4,
  elevation: 1,
},
currencyModalDoneButtonText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 15,
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
  notificationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  notificationModalHeader: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  notificationIconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#CCFBF1',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  notificationCloseButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 8,
  },
  notificationModalBody: {
    paddingRight: 8,
    paddingLeft: 2,
  },
  notificationModalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  notificationFeatureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  notificationFeatureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F766E',
    marginTop: 5,
    marginRight: 12,
  },
  notificationFeatureDotSoon: {
    backgroundColor: '#F59E0B',
  },
  notificationFeatureTextWrap: {
    flex: 1,
  },
  notificationFeatureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 4,
  },
  notificationFeatureText: {
    fontSize: 13,
    color: '#475467',
    lineHeight: 19,
  },
  notificationFooterText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  notificationDoneButton: {
    marginTop: 6,
    backgroundColor: '#0F766E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  notificationDoneButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  helpModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  helpModalHeader: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  helpIconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#D1FAE5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  helpCloseButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 8,
  },
  helpModalScroll: {
    maxHeight: 340,
    marginBottom: 8,
  },
  helpModalBody: {
    paddingRight: 8,
    paddingLeft: 2,
  },
  helpModalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  helpInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  helpInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  helpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  helpValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  helpCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  helpCopiedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 12,
  },
  helpFeatureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  helpFeatureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    marginTop: 5,
    marginRight: 12,
  },
  helpFeatureDotAccent: {
    backgroundColor: '#0F766E',
  },
  helpFeatureDotSoon: {
    backgroundColor: '#10B981',
  },
  helpFeatureTextWrap: {
    flex: 1,
  },
  helpFeatureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 4,
  },
  helpFeatureText: {
    fontSize: 13,
    color: '#475467',
    lineHeight: 19,
  },
  helpFooterText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  helpDoneButton: {
    marginTop: 6,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  helpDoneButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  preferencesModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  preferencesModalHeader: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  preferencesIconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#D1FAE5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  preferencesModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  preferencesCloseButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 8,
  },
  preferencesModalBody: {
    paddingRight: 8,
    paddingLeft: 2,
  },
  preferencesModalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  preferencesFeatureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  preferencesFeatureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#047857',
    marginTop: 5,
    marginRight: 12,
  },
  preferencesFeatureDotSoon: {
    backgroundColor: '#10B981',
  },
  preferencesFeatureTextWrap: {
    flex: 1,
  },
  preferencesFeatureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 4,
  },
  preferencesFeatureText: {
    fontSize: 13,
    color: '#475467',
    lineHeight: 19,
  },
  preferencesFooterText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  preferencesDoneButton: {
    marginTop: 6,
    backgroundColor: '#047857',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  preferencesDoneButtonText: {
    color: '#fff',
    fontWeight: '700',
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
