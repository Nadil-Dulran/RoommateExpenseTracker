import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  Login  from "../screens/authentication/LoginScreen";
import Signup  from "../screens/authentication/SignupScreen";
import  ForgotPassword  from "../screens/authentication/ForgetPasswordScreen";
import BottomTabs from './BottomTabs';
import SettleUpScreen from '../screens/external/SettleUpScreen';
import NotificationScreen from '../screens/external/NotificationScreen';
import { RootStackParamList } from '../types/navigation';
import GroupDetailsScreen from '../screens/external/GroupDetailsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

    useEffect(() => {
      const checkToken = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          setInitialRoute(token ? 'MainTabs' : 'Login');
        } catch (error) {
          setInitialRoute('Login');
        } finally {
          setIsLoading(false);
        }
      };

      checkToken();
    }, []);

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009966" />
        </View>
      );
    }

    return (
     
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
      {/* Auth Screens */}

      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

      {/* Main Screens */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* External Screens */}
      <Stack.Screen name="SettleUp" component={SettleUpScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />

    </Stack.Navigator>
  );
};

export default AppNavigator;