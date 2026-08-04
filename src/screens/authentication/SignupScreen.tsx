import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView,
Alert, Modal, Clipboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import logoIcon from '../../../assets/Logo.png';
import { authService } from '../../services/authService';
import { DEFAULT_CURRENCY_CODE } from '../../constants/currencies';
import { styles } from './styles/Auth.styles';

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
   Alert.alert(
    'Success',
    'Your account has been created successfully. Sign in to continue.',
    [
      {
        text: 'OK',
        onPress: () => navigation.navigate('Login'),
      },
     ],
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[ styles.scroll, { flexGrow: 1, justifyContent: 'center' } ]} keyboardShouldPersistTaps="handled">
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
        <View style={{...styles.card, marginBottom: 70}}>

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
              textContentType="emailAddress"
              autoComplete="email"
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
              placeholder='Re-enter the password'
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
            <View style={styles.modalContentS}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.documentIconCircle}>
                  <Icon name="file-text" size={24} color="#009966" />
                </View>
                <Text style={styles.modalTitleS}>Terms of Service & Privacy Policy</Text>
                <TouchableOpacity
                  style={styles.closeButtonS}
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