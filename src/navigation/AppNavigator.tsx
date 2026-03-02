import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  Login  from "../screens/authentication/LoginScreen";
import Signup  from "../screens/authentication/SignupScreen";
import  ForgotPassword  from "../screens/authentication/ForgetPasswordScreen";
import BottomTabs from './BottomTabs';
import SettleUpScreen from '../screens/external/SettleUpScreen';
import NotificationScreen from '../screens/external/NotificationScreen';
import { RootStackParamList } from '../types/navigation';
import GroupDetailsScreen from '../screens/external/GroupDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
     
      <Stack.Navigator
        initialRouteName="Login"
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