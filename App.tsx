import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import  AppNavigator  from './src/navigation/AppNavigator';


const App = () => {

  return (
    <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator/>
        </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;