import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import  AppNavigator  from './src/navigation/AppNavigator';
import { CurrencyProvider } from './src/context/CurrencyContext';


const App = () => {

  return (
    <SafeAreaProvider>
      <CurrencyProvider>
        <NavigationContainer>
          <AppNavigator/>
        </NavigationContainer>
      </CurrencyProvider>
    </SafeAreaProvider>
  );
};

export default App;