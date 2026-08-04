import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, BackHandler, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import logoIcon from '../../../assets/Logo.png';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { styles } from './styles/Auth.styles';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Handle back button to exit app on login screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string } = {};


    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Backend login logic

      try {

    const result = await authService.login({
      email,
      password,
    });

    if (result.success) {

      await AsyncStorage.setItem('token', result.token);
      if (result?.user?.id != null) {
        await AsyncStorage.setItem('userId', String(result.user.id));
      }

      navigation.navigate('MainTabs');

    } else {

      if (result.message === 'Invalid credentials') {
     newErrors.password = 'Incorrect password';
     }else if(result.message === 'User not found') {
     newErrors.email = 'No account found with this email';
     } else {
     newErrors.password = 'An unexpected error occurred. Please try again.';
     }
      setErrors(newErrors);

    }

  } catch (error) {
    console.log(error);
    // Determine error type
    if (error instanceof TypeError || (error as any)?.message?.includes('Network')) {
      newErrors.password = 'Network error. Please check your internet connection.';
    } else if ((error as any)?.response?.status >= 500) {
      newErrors.password = 'Server error. Please try again later.';
    } else if ((error as any)?.response?.status >= 400) {
      newErrors.password = 'Backend error. Please try again.';
    } else {
      newErrors.password = 'An unexpected error occurred. Please contact support.';
    }
    setErrors(newErrors);
  }
  };

const handleCopyEmail = async () => {
  try {
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  } catch (error) {
    console.log('Error copying email:', error);
  }
};

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
    <SafeAreaView style={{...styles.container, paddingHorizontal: 20}} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image source={logoIcon} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue splitting expenses
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Icon name="mail" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: undefined });
              }}
            />
          </View>
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          {/* Password */}
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: undefined });
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={18} color="#99A1AF" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgot}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

        </View>
        
        {/* Help */}
                <View style={styles.helpContainer}>
                  <Text style={{ color: '#6a7282', fontSize: 13 }}>
                    Need help? 
                  </Text>
                  <TouchableOpacity onPress={() => setShowContactSupportModal(true)}>
                    <Text style={styles.contactLink}> Contact Support</Text>
                  </TouchableOpacity>
                </View>

      </View>

      {/* Sign Up */}
      <View style={styles.signupContainer}>
        <Text style={{ color: '#6a7282', fontSize: 15 }}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Signup' as never)}
        >
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactSupportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.supportIconCircle}>
                <Icon name="mail" size={24} color="#009966" />
              </View>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowContactSupportModal(false)}
              >
                <Icon name="x" size={24} color="#6a7282" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <Text style={styles.modalSubtitle}>
              We're here to help! Reach out to our support team with any questions.
            </Text>

            <View style={styles.supportInfoBox}>
              <Icon name="mail" size={20} color="#009966" />
              <View style={styles.supportInfoText}>
                <Text style={styles.supportLabel}>Email</Text>
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

            {/* Modal Actions */}
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => setShowContactSupportModal(false)}
            >
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </View>
    </TouchableWithoutFeedback>
  );
}