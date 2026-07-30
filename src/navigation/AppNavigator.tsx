import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
import ProfileSettings from '../screens/profile/ProfileSettings';
import { clearSession, getSessionExpiryTime, isSessionExpired } from '../utils/auth';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AUTH_ROUTES: string[] = ['Login', 'Signup', 'ForgotPassword'];

const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
    const navigationRef = useNavigationContainerRef<RootStackParamList>();
    const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const checkTokenRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const insets = useSafeAreaInsets();

    const clearExpiryTimer = useCallback(() => {
      if (expiryTimer.current) {
        clearTimeout(expiryTimer.current);
        expiryTimer.current = null;
      }
    }, []);

    const signOutExpiredUser = useCallback(async () => {
      clearExpiryTimer();
      await clearSession();

      if (!navigationRef.isReady()) {
        return;
      }

      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute && !AUTH_ROUTES.includes(currentRoute)) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }, [clearExpiryTimer, navigationRef]);

    const checkToken = useCallback(async () => {
      if (await isSessionExpired()) {
        await signOutExpiredUser();
        return;
      }

      const expiryTime = await getSessionExpiryTime();
      if (!expiryTime) {
        await signOutExpiredUser();
        return;
      }

      clearExpiryTimer();
      expiryTimer.current = setTimeout(() => {
        void checkTokenRef.current();
      }, Math.max(expiryTime - Date.now(), 0));
    }, [clearExpiryTimer, signOutExpiredUser]);

    useEffect(() => {
      checkTokenRef.current = checkToken;
    }, [checkToken]);

    useEffect(() => {
      const bootstrapSession = async () => {
        try {
          const sessionExpired = await isSessionExpired();
          if (sessionExpired) {
            await clearSession();
            setInitialRoute('Login');
          } else {
            setInitialRoute('MainTabs');
          }
        } catch (error) {
          setInitialRoute('Login');
        } finally {
          setIsLoading(false);
        }
      };

      void bootstrapSession();
      void checkToken();

      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          void checkToken();
        }
      });

      return () => {
        clearExpiryTimer();
        appStateSubscription.remove();
      };
    }, [checkToken, clearExpiryTimer]);

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
      <NavigationContainer
        linking={linking}
        ref={navigationRef}
        onStateChange={() => {
          void checkToken();
        }}
      >
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
          <Stack.Screen name="ProfileSettings" component={ProfileSettings} />
          <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
          <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
};

export default AppNavigator;
