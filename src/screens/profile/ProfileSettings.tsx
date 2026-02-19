import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import profileIcon from '../../../assets/ProfileIcon.png';
import { Image } from 'react-native';
import notificationIcon from '../../../assets/notification.png';
import settingsIcon from '../../../assets/settings.png';
import helpIcon from '../../../assets/help.png';


const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('Enter your name');
  const [email, setEmail] = useState('you@email.com');
  const [phone, setPhone] = useState('Enter your phone number');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[2]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

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
              source={profileIcon}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowImageModal(true)}
            >
              <Icon name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

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
          onPress={() => navigation.navigate('Login')}
        >
          <Icon name="log-out" size={20} color="#ff2056" />
          <Text style={styles.logoutText}>Sign Out</Text>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
});
