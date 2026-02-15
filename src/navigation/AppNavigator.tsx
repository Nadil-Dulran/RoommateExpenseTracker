import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  Login  from "../screens/authentication/LoginScreen";
import Signup  from "../screens/authentication/SignupScreen";
import  ForgotPassword  from "../screens/authentication/ForgetPasswordScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen
                name="Login"
                component={Login}
            />
            <Stack.Screen
                name="Signup"
                component={Signup}
            />
            <Stack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;