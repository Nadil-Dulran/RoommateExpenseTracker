import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { groupsService } from '../../services/groupsService';

type JoinGroupNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const JOIN_GROUP_RESULT_KEY = '@roommate/join-group-result';

const normalizeGroupIdFromValue = (value: unknown) => {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  const linkMatch = normalized.match(/group\/([^/?#]+)/i);
  return linkMatch?.[1] ? linkMatch[1] : normalized;
};

export default function JoinGroupScreen() {
  const navigation = useNavigation<JoinGroupNavigationProp>();
  const route = useRoute<any>();
  const { groupId, openGroupDetailsOnSuccess } = route.params || {};

  const [isJoining, setIsJoining] = useState(false);
  const [statusText, setStatusText] = useState('Preparing group join...');

  const joinGroup = useCallback(
    async (candidateGroupId: string) => {
      const normalizedGroupId = normalizeGroupIdFromValue(candidateGroupId);

      if (!normalizedGroupId) {
        return;
      }

      setIsJoining(true);
      setStatusText('Joining group...');

      try {
        const storedIdRaw =
          (await AsyncStorage.getItem('userId')) ||
          (await AsyncStorage.getItem('user_id'));
        const currentUserId = storedIdRaw ? storedIdRaw.trim() : '';

        await groupsService.joinGroup(normalizedGroupId, currentUserId || undefined);
        await AsyncStorage.setItem(
          JOIN_GROUP_RESULT_KEY,
          JSON.stringify({
            groupId: normalizedGroupId,
            openGroupDetailsOnSuccess: !!openGroupDetailsOnSuccess,
            joinedAt: Date.now(),
          })
        );
        setStatusText('Joined successfully. Redirecting...');
        navigation.navigate('MainTabs', { screen: 'Groups' });
      } catch (error) {
        Alert.alert(
          'Join group failed',
          error instanceof Error ? error.message : 'Could not join this group.'
        );
        navigation.navigate('MainTabs', { screen: 'Groups' });
      } finally {
        setIsJoining(false);
      }
    },
    [navigation, openGroupDetailsOnSuccess]
  );

  useEffect(() => {
    if (groupId) {
      joinGroup(String(groupId));
    }
  }, [groupId, joinGroup]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#009966" animating={isJoining} />
      <Text style={styles.title}>Join Group</Text>
      <Text style={styles.description}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#6A7282',
    textAlign: 'center',
  },
});
