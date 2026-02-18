import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Dashboard from '../screens/main/Dashboard';
import ProfileSettings from '../screens/profile/ProfileSettings';
import ActivityScreen from '../screens/main/ActivityScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';
import AddExpensScreen from '../screens/main/AddExpensScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: {
    flex: 1,},
      }}
    >
      <Tab.Screen
        name="Home"
        component={Dashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="home" label="Home" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileSettings}
        options={{
          tabBarItemStyle: { display: 'none' }, 
        }} 
        />

       <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="activity" label="Activity" focused={focused} />
          ),
        }}
      /> 

      <Tab.Screen
        name="Add"
        component={AddExpensScreen} 
        options={{
           tabBarLabel: '',
           tabBarIcon: () => null,
           tabBarButton: (props) => <AddButton {...props} />,
         }}
       />

       <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="users" label="Groups" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="dollar-sign" label="Expenses" focused={focused} />
          ),
        }}
      />

    </Tab.Navigator>
  );
};

export default BottomTabs;

const TabItem = ({ icon, label, focused }: any) => {
  return (
    <View style={styles.tabItem}>
      <Icon
        name={icon}
        size={20}
        color={focused ? '#15ae7e' : '#9CA3AF'}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.tabLabel,
          { color: focused ? '#15ae7e' : '#9CA3AF' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const AddButton = ({ onPress }: any) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.addButtonContainer}
    >
      <View style={styles.addButton}>
        <Icon name="plus" size={26} color="#FFFFFF" />
      </View>

       <Text style={styles.addLabel}>
        Add
      </Text>

    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  tabBar: {
    height: 85,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  tabLabel: {
    fontSize: 11.3,
    marginTop: 4,
    fontWeight: '600',
  },
  tabBarStyle: {
  height: 70,
  paddingBottom: 10,
  paddingTop: 10,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  position: 'absolute',
},
addButtonContainer: {
  top: -30, 
  justifyContent: 'center',
  alignItems: 'center',
},

addButton: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#15ae7e',
  justifyContent: 'center',
  alignItems: 'center',

  // Shadow iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 4,

  // Shadow Android
  elevation: 3,
},
addLabel: {
  marginTop: 7,
  fontSize: 12,
  fontWeight: '600',
  color: '#15ae7e',
},

});
