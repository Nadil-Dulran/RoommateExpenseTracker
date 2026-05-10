import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import  Login  from "../screens/authentication/LoginScreen";
import Signup  from "../screens/authentication/SignupScreen";
import  ForgotPassword  from "../screens/authentication/ForgetPasswordScreen";
import BottomTabs from './BottomTabs';
import SettleUpScreen from '../screens/external/SettleUpScreen';
import NotificationScreen from '../screens/external/NotificationScreen';
import { RootStackParamList } from '../types/navigation';
import GroupDetailsScreen from '../screens/external/GroupDetailsScreen';
import JoinGroupScreen from '../screens/external/JoinGroupScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const insets = useSafeAreaInsets();

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

    const linking = {
    prefixes: ['roommate://'],
    config: {
    screens: {
      JoinGroup: 'group/:groupId',
    },
  },
};

    if (isLoading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          <ActivityIndicator size="large" color="#009966" />
        </View>
      );
    }

    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          }}
        >
          {/* Auth Screens */}

          <Stack.Screen
            name="Login"
            component={Login}
            options={{ contentStyle: { paddingTop: 0, paddingBottom: 0 } }}
          />
          <Stack.Screen
            name="Signup"
            component={Signup}
            options={{ contentStyle: { paddingTop: 0, paddingBottom: 0 } }}
          />
          <Stack.Screen 
           name="ForgotPassword" 
           component={ForgotPassword} 
           options={{ contentStyle: { paddingTop: 0, paddingBottom: 0 } }}
          />

          {/* Main Screens */}
          <Stack.Screen
            name="MainTabs"
            component={BottomTabs}
            options={{ contentStyle: { paddingTop: 0, paddingBottom: 0 } }}
          />

          {/* External Screens */}
          <Stack.Screen name="SettleUp" component={SettleUpScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
          <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
};

export default AppNavigator;