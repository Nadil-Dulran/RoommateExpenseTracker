import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import googleIcon from '../../../assets/google.png';
import facebookIcon from '../../../assets/facebook.png';


export default function LoginScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = () => {
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

    navigation.navigate('Dashboard');
  };

 const handleGoogleLogin = async () => {
  // Navigate like success
  navigation.navigate('Dashboard');
};

const handleFacebookLogin = () => {
  Alert.alert('Facebook Login coming soon...');
};


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>💰</Text>
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
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: undefined });
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye' : 'eye-off'} size={18} color="#000000" />
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

           {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
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

      {/* Sign Up */}
      <View style={styles.signupContainer}>
        <Text style={{ color: '#6a7282' }}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Signup' as never)}
        >
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: '#009966',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#101828',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7282',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
        shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 8,
  },
  error: {
    color: '#ff2056',
    fontSize: 12,
    marginTop: 4,
  },
  forgot: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    color: '#009966',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#009966',
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  signupText: {
    color: '#009966',
    fontWeight: '600',
  },
    divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
    line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
    orText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
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
});

