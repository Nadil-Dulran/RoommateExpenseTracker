import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Clipboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import logoIcon from '../../../assets/Logo.png';
import { authService } from '../../services/authService';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { styles } from './styles/Auth.styles';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = async () => {
    await Clipboard.setString('nadil.dulran@akvasoft.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  // stages: 'enter' -> enter email, 'verify' -> enter code, 'reset' -> set new password
  const [stage, setStage] = useState<'enter' | 'verify' | 'reset'>('enter');

  const [codeInput, setCodeInput] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => {
        navigation.navigate('Login');
      }, 2000); // 2 seconds before auto-navigate
      return () => clearTimeout(timer);
    }
  }, [resetSuccess, navigation]);

  const startResendCooldown = (seconds: number) => {
    setResendDisabled(true);
    setResendCountdown(seconds);
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');

    try {
      const res = await authService.requestPasswordReset({ email });
      if (res.ok) {
        startResendCooldown(30);
        setStage('verify');
      } else if (res.status === 404) {
        setError(res.body?.message || 'Email not found');
      } else {
        setError(res.body?.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (!codeInput || codeInput.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');

    try {
      const res = await authService.verifyResetCode({ email, code: codeInput });
      if (res.ok) {
        // backend verifies code and creates a verified session for this email
        setStage('reset');
      } else {
        setError(res.body?.message || 'Invalid or expired code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');

    try {
      const res = await authService.resetPassword({ email, newPassword, confirmPassword });
      if (res.ok) {
        setResetSuccess(true);
      } else {
        setError(res.body?.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleResend = async () => {
    if (resendDisabled) return;
    await handleSendCode();
  };

  // Stage: verify and reset handled below

  // FORM STATE
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

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitleF}>
              No worries, we'll send you a password reset code
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
          {stage === 'enter' && (
            <>
              <Text style={styles.label}>Email Address</Text>

              <View
                style={[
                  styles.inputWrapper,
                  error ? styles.errorBorder : null,
                ]}
              >
                <Icon name="mail" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.primaryButtonF}
                onPress={handleSendCode}
              >
                <Text style={styles.primaryButtonText}>
                  Send Password Reset Code
                </Text>
              </TouchableOpacity>
            </>
          )}

          {stage === 'verify' && (
            <>
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitleF}>
                We've sent a six digit code to your email.
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  error ? styles.errorBorder : null,
                  { marginTop: 12 },
                ]}
              >
                <Icon name="key" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9CA3AF"
                  value={codeInput}
                  onChangeText={(text) => {
                    setCodeInput(text.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.primaryButtonF}
                onPress={handleVerifyCode}
              >
                <Text style={styles.primaryButtonText}>Verify Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, resendDisabled ? { opacity: 0.6 } : null]}
                onPress={handleResend}
                disabled={resendDisabled}
              >
                <Text style={styles.secondaryButtonText}>
                  {resendDisabled ? `Resend (${resendCountdown}s)` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {stage === 'reset' && (
            <>
              <Text style={styles.title}>Set New Password</Text>

              <Text style={[styles.label, { marginTop: 8 }]}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    setError('');
                  }}
                />
              </View>

              <Text style={[styles.label, { marginTop: 8 }]}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setError('');
                  }}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.primaryButtonF}
                onPress={handleSavePassword}
              >
                <Text style={styles.primaryButtonText}>Save Password</Text>
              </TouchableOpacity>

              {resetSuccess && (
                <Text style={styles.successMessage}>
                  Password updated successfully. Redirecting to Login...
                </Text>
              )}
            </>
          )}
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

        <TouchableOpacity
            style={styles.goToSignInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{ color: '#6a7282', fontSize: 15, marginBottom: 25 }}>
              Go back to <Text style={styles.goToSignInAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        {/* Contact Support Modal */}
        <Modal
          visible={showContactSupportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowContactSupportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentF}>
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