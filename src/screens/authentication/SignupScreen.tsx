import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import googleIcon from '../../../assets/google.png';
import facebookIcon from '../../../assets/facebook.png';
import logoIcon from '../../../assets/Logo.png';
import { authService } from '../../services/authService';
import { DEFAULT_CURRENCY_CODE } from '../../constants/currencies';



export default function SignupScreen() {
  const navigation = useNavigation<any>();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<any>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = async () => {
    await Clipboard.setString('nadil.dulran@akvasoft.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: undefined });
    if (statusMessage) {
      setStatusMessage('');
      setStatusType('');
    }
  };

  const handleSignup = async () => {
    const newErrors: any = {};

    if (!formData.name.trim())
      newErrors.name = 'Name is required';

    if (!formData.email)
      newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Enter valid email';

    if (formData.phone &&
      !/^\+?[\d\s-()]+$/.test(formData.phone))
      newErrors.phone = 'Invalid phone number';

    if (!formData.password)
      newErrors.password = 'Password required';
    else if (formData.password.length < 6)
      newErrors.password = 'Min 6 characters';

    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Confirm password';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatusMessage('');
      setStatusType('');
      return;
    }

    // Backend API call
      try {

    const result = await authService.register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      currency: DEFAULT_CURRENCY_CODE,
    });

    const responseMessage = result?.body?.message || '';
    const isDuplicateEmail =
      result?.status === 409 ||
      /already exist/i.test(responseMessage) ||
      /email.*exist/i.test(responseMessage);

    if (result?.ok || responseMessage === 'User created successfully') {
      setStatusMessage('Account created successfully. Please sign in.');
      setStatusType('success');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1200);
    } else if (isDuplicateEmail) {
      setErrors({ email: 'Email already exists, try another one or Sign In' });
      setStatusType('error');
    } else {
      setStatusMessage(responseMessage || 'Signup failed');
      setStatusType('error');
    }

  } catch (error) {
    console.log(error);
    setStatusMessage('Signup failed');
    setStatusType('error');
  }
  };

   const handleGoogleLogin = async () => {
    // Navigate like success
    navigation.navigate('Dashboard');
  };
  
  const handleFacebookLogin = () => {
    Alert.alert('Facebook Signup coming soon...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image source={logoIcon} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join us and start splitting expenses easily
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Name */}
          <Text style={styles.label}>User Name </Text>
          <View style={[
            styles.inputWrapper,
            errors.name && styles.errorBorder,
          ]}>
            <Icon name="user" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter a username for your profile"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={[
            styles.inputWrapper,
            errors.email && styles.errorBorder,
          ]}>
            <Icon name="mail" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
            />
          </View>
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          {/* Phone */}
          <Text style={styles.label}>Phone (Optional)</Text>
          <View style={[
            styles.inputWrapper,
            errors.phone && styles.errorBorder,
          ]}>
            <Icon name="phone" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
            />
          </View>
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={[
            styles.inputWrapper,
            errors.password && styles.errorBorder,
          ]}>
            <Icon name="lock" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder='Enter a strong password'
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye' : 'eye-off'}
                size={18}
                color="#99A1AF"
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={[
            styles.inputWrapper,
            errors.confirmPassword && styles.errorBorder,
          ]}>
            <Icon name="lock" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder='Re enter the password'
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={18}
                color="#99A1AF"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          )}

          {/* Terms Agreement */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up, you agree to our
            </Text>
            <TouchableOpacity 
              style={styles.termsButton}
              onPress={() => setShowTermsModal(true)}
            >
              <Icon name="file-text" size={16} color="#009966" style={{ marginRight: 6 }} />
              <Text style={styles.termsLink}>Terms of Service & Privacy Policy</Text>
              <Icon name="arrow-right" size={16} color="#009966" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignup}
          >
            <Text style={styles.primaryButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>

          {statusMessage ? (
            <Text
              style={[
                styles.statusMessage,
                statusType === 'success'
                  ? styles.statusSuccess
                  : styles.statusError,
              ]}
            >
              {statusMessage}
            </Text>
          ) : null}

          {/* Divider */}
          {/* <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View> */}

         {/* Google */}
          {/* <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
            <Image source={googleIcon} style={styles.socialIcon} />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity> */}

          {/* Facebook */}
          {/* <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
            <Image source={facebookIcon} style={styles.socialIcon} />
            <Text style={styles.socialText}>Continue with Facebook</Text>
          </TouchableOpacity> */}

        </View>
   </ScrollView>
        {/* Login */}
        <View style={styles.bottomRow}>
          <Text style={{ color: '#6a7282', fontSize: 15 }}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Terms Modal */}
        <Modal
          visible={showTermsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTermsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.documentIconCircle}>
                  <Icon name="file-text" size={24} color="#009966" />
                </View>
                <Text style={styles.modalTitle}>Terms of Service & Privacy Policy</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowTermsModal(false)}
                >
                  <Icon name="x" size={24} color="#6a7282" />
                </TouchableOpacity>
              </View>

              {/* Modal Body - Scrollable */}
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                <View style={styles.modalBody}>
                  <Text style={styles.sectionTitle}>Data Access & Storage</Text>
                  
                  <View style={styles.policySection}>
                    <Icon name="wifi" size={18} color="#009966" />
                    <View style={styles.policyText}>
                      <Text style={styles.policyLabel}>Internet Access</Text>
                      <Text style={styles.policyDescription}>
                        Our application requires internet access to connect to our servers and provide real-time updates for expense tracking, group management and settlement calculations.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.policySection}>
                    <Icon name="database" size={18} color="#009966" />
                    <View style={styles.policyText}>
                      <Text style={styles.policyLabel}>Data Storage</Text>
                      <Text style={styles.policyDescription}>
                        Your signup data including name, email, phone number and profile information are securely stored on our encrypted databases to provide you with a seamless experience across devices.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.policySection}>
                    <Icon name="lock" size={18} color="#009966" />
                    <View style={styles.policyText}>
                      <Text style={styles.policyLabel}>Password Security</Text>
                      <Text style={styles.policyDescription}>
                        Your password is encrypted using industry-standard hashing algorithms (bcrypt/SHA-256). We never store plain-text passwords. Our servers employ end-to-end encryption and regular security audits to protect your data.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.policySection}>
                    <Icon name="shield" size={18} color="#009966" />
                    <View style={styles.policyText}>
                      <Text style={styles.policyLabel}>Privacy Commitment</Text>
                      <Text style={styles.policyDescription}>
                        We are committed to protecting your privacy. Your personal data will not be shared with third parties without your explicit consent. We comply with international data protection regulations.
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Questions & Support</Text>
                  
                  <View style={styles.supportInfoBox}>
                    <Icon name="mail" size={20} color="#009966" />
                    <View style={styles.supportInfoText}>
                      <Text style={styles.supportLabel}>For inquiries, contact us at:</Text>
                      <Text style={styles.supportValue}>nadil.dulran@akvasoft.com</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyEmail}
                    >
                      <Icon name={emailCopied ? 'check' : 'copy'} size={18} color={emailCopied ? '#009966' : '#6a7282'} />
                      {emailCopied && <Text style={styles.copiedText}>Copied!</Text>}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.disclaimerText}>
                    By creating an account, you acknowledge that you have read and agree to our Terms of Service and Privacy Policy.
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.modalButtonText}>I Understand & Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center'},

  header: { alignItems: 'center', marginBottom: 30 },
  logo: {
    width: 65,
    height: 65,
    backgroundColor: '#009966',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#101828' },
  subtitle: { fontSize: 14, color: '#6a7282', marginTop: 6 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 1,
  },

  label: { 
    fontSize: 13,
    fontWeight: '500', 
    color: '#676767', 
    marginTop: 12 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
    marginTop: 6,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: '#101828' },
  error: { color: '#ff2056', fontSize: 12, marginTop: 4 },
  errorBorder: { borderColor: '#ff2056' },

  /* Terms Container */
  termsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#6a7282',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF7',
    borderWidth: 1.5,
    borderColor: '#009966',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  termsLink: {
    color: '#009966',
    fontWeight: '600',
    fontSize: 13,
  },

  primaryButton: {
    backgroundColor: '#009966',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  statusMessage: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  statusSuccess: { color: '#009966' },
  statusError: { color: '#ff2056' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  or: { marginHorizontal: 10, color: '#9CA3AF', fontSize: 12 },


  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  socialButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialText: {
    color: '#111827',
    fontWeight: '500',
  },
  socialIcon: {
  width: 20,
  height: 20,
  marginRight: 10,
  },
  loginLink: { 
    color: '#009966',
    fontSize:15, 
    fontWeight: '600' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  documentIconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#ECFDF5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 8,
  },
  modalScroll: {
    maxHeight: 350,
    marginBottom: 16,
  },
  modalBody: {
    paddingRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginTop: 16,
    marginBottom: 12,
  },
  policySection: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  policyText: {
    marginLeft: 12,
    flex: 1,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 13,
    color: '#6a7282',
    lineHeight: 18,
  },
  supportInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#009966',
  },
  supportInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  supportLabel: {
    fontSize: 12,
    color: '#6a7282',
    fontWeight: '500',
    marginBottom: 4,
  },
  supportValue: {
    fontSize: 15,
    color: '#101828',
    fontWeight: '600',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiedText: {
    fontSize: 10,
    color: '#009966',
    fontWeight: '600',
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6a7282',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  modalPrimaryButton: {
    backgroundColor: '#009966',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
