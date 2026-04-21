import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import  AppNavigator  from './src/navigation/AppNavigator';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { NotificationProvider } from './src/context/NotificationContext';


const App = () => {

  return (
    <SafeAreaProvider>
      <CurrencyProvider>
        <NotificationProvider>
          <NavigationContainer>
            <AppNavigator/>
          </NavigationContainer>
        </NotificationProvider>
      </CurrencyProvider>
    </SafeAreaProvider>
  );
};

export default App;