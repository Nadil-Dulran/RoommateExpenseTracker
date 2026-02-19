import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function GroupsScreen() {
  const navigation = useNavigation<any>();

  return (
        <View style={styles.container}>
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Welcome to the Groups Screen!</Text>
      <View style={{ marginTop: 20 }}>
           <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.buttonText}>View Profile</Text>
              </TouchableOpacity>
              </View>
    </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#009966',
    borderRadius: 8,
  },
  buttonText: {
    color: '#a91313',
    fontSize: 16,
  },
};