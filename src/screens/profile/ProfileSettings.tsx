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
import { SafeAreaView } from 'react-native-safe-area-context';
import profileIcon from '../../../assets/ProfileIcon.png';
import { Image } from 'react-native';


const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('you@email.com');
  const [phone, setPhone] = useState('+1 555 123 4567');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  return (
 <SafeAreaView style={styles.container}>
    
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Back */}
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Icon name="arrow-left" size={18} color="#6a7282" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>

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

     {/* Settings Fields */}
        <View style={styles.secondcard}>
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
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Icon name="log-out" size={20} color="#ff2056" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Currency</Text>

            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyItem}
                  onPress={() => {
                    setSelectedCurrency(item);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={styles.currencyItemText}>
                    {item.code} - {item.name}
                  </Text>
                </TouchableOpacity>
              )}
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
        </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 3,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  backText: {
    marginLeft: 6,
    color: '#6a7282',
    fontWeight: '500',
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
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#009966',
    padding: 6,
    borderRadius: 20,
  },
  changePhotoText: {
    marginTop: 10,
    color: '#009966',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 5,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 25,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  },
  saveButton: {
    backgroundColor: '#009966',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 16,
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
    marginTop: 16,
    alignItems: 'center',
  },
   secondcard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 5,
    marginTop: 5,
   },
});
