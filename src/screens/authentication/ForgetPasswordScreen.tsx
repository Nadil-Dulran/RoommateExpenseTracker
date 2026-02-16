import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setIsSubmitted(true);
  };

  // SUCCESS STATE
  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.card}>
            <View style={styles.successCircle}>
              <Icon name="check" size={30} color="#009966" />
            </View>

            <Text style={styles.successTitle}>Check Your Email</Text>

            <Text style={styles.subtitle}>
              We've sent password reset instructions to
            </Text>

            <View style={styles.emailBox}>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <Text style={styles.helperText}>
              Didn’t receive the email? Check spam or try again.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
            >
              <Text style={styles.primaryButtonText}>Try Another Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
    );
  }

  // FORM STATE
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.navigate('Login')}
        >
          <Icon name="arrow-left" size={18} color="#6a7282" />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={{ fontSize: 26 }}>💰</Text>
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries, we'll send reset instructions
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
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
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryButtonText}>
              Send Reset Link
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={styles.helpContainer}>
          <Text style={{ color: '#6a7282' }}>Need help? </Text>
          <TouchableOpacity onPress={() => Alert.alert('Please contact support at nadil.dulran@akvasoft.com')}>
            <Text style={styles.contactLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scroll: {
    padding: 20,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: '#009966',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#101828',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7282',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#6a7282',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: '#111827',
  },
  errorBorder: {
    borderColor: '#ff2056',
  },
  errorText: {
    color: '#ff2056',
    fontSize: 12,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#009966',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#101828',
    fontWeight: '500',
  },
  emailBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
  },
  emailText: {
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    color: '#6a7282',
    textAlign: 'center',
    marginBottom: 16,
  },
  successCircle: {
    width: 70,
    height: 70,
    backgroundColor: '#ECFDF5',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  contactLink: {
    color: '#009966',
    fontWeight: '600',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    marginLeft: 6,
    color: '#6a7282',
    fontWeight: '500',
  },
  successTitle: {
  fontSize: 22,
  fontWeight: '700',
  color: '#101828',
  textAlign: 'center',
  marginBottom: 8,
},
});
