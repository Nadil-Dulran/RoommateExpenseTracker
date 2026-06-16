import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Dashboard from '../screens/main/Dashboard';
import ActivityScreen from '../screens/main/ActivityScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';
import AddExpensScreen from '../screens/main/AddExpensScreen';
import { BottomTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabs = () => {
  const insets = useSafeAreaInsets();
  //const tabBarBottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: {
          paddingTop: insets.top,
        },
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? 8 : 6, 
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
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
        size={23}
        color={focused ? '#15ae7e' : '#9CA3AF'}
      />
      <Text
        allowFontScaling={false}
        numberOfLines={1}
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
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabBarItem: {
     flex: 1,
     paddingHorizontal: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  tabLabel: {
    width: '100%',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
addButtonContainer: {
  top: -24,
  justifyContent: 'center',
  alignItems: 'center',
},

addButton: {
  width: 60,
  height: 60,
  borderRadius: 30,
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
