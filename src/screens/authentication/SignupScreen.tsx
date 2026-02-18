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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import googleIcon from '../../../assets/google.png';
import facebookIcon from '../../../assets/facebook.png';
import logoIcon from '../../../assets/Logo.png';


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

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  const handleSignup = () => {
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
      return;
    }

    // Later connect to backend
    navigation.navigate('Dashboard');
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
          <Text style={styles.label}>Full Name</Text>
          <View style={[
            styles.inputWrapper,
            errors.name && styles.errorBorder,
          ]}>
            <Icon name="user" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
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
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye' : 'eye-off'}
                size={18}
                color="#000000"
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
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={18}
                color="#000000"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          )}

          {/* Terms */}
          <Text style={styles.terms}>
            By signing up, you agree to our
            <Text style={styles.link}> Terms of Service </Text>
            and
            <Text style={styles.link}> Privacy Policy</Text>
          </Text>

          {/* Create Account */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignup}
          >
            <Text style={styles.primaryButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View>

         {/* Google */}
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
            <Image source={googleIcon} style={styles.socialIcon} />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Facebook */}
          <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
            <Image source={facebookIcon} style={styles.socialIcon} />
            <Text style={styles.socialText}>Continue with Facebook</Text>
          </TouchableOpacity>

        </View>

        {/* Login */}
        <View style={styles.bottomRow}>
          <Text style={{ color: '#6a7282' }}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 24, flexGrow: 1 },

  header: { alignItems: 'center', marginBottom: 30 },
  logo: {
    width: 60,
    height: 60,
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

  label: { fontSize: 13, color: '#000000', marginTop: 12 },
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
  input: { flex: 1, marginLeft: 8 },
  error: { color: '#ff2056', fontSize: 12, marginTop: 4 },
  errorBorder: { borderColor: '#ff2056' },

  terms: {
    fontSize: 12,
    color: '#6a7282',
    textAlign: 'center',
    marginTop: 16,
  },
  link: { color: '#009966', fontWeight: '600' },

  primaryButton: {
    backgroundColor: '#009966',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },

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
    marginTop: 24,
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
    fontWeight: '600' 
  },
});
