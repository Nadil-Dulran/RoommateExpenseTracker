import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

const GROUPS_API_URL = `${API_URL}/groups`;

const parseJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const parseResponse = async (response: Response) => {
  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(body?.message || 'Request failed');
  }

  return body;
};

const getTokenOrThrow = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    throw new Error('No auth token found');
  }

  return token;
};

export const groupMembersService = {

  async getMembers(groupId: string | number) {

    const token = await getTokenOrThrow();

    const response = await fetch(`${GROUPS_API_URL}/${groupId}/members`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(response);
  },

  async addMember(groupId: string | number, userId: string | number) {

    const token = await getTokenOrThrow();

    const response = await fetch(`${GROUPS_API_URL}/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    return parseResponse(response);
  }, 

  async removeMember(groupId: string | number, userId: string | number) {

    const token = await getTokenOrThrow();

    const response = await fetch(`${GROUPS_API_URL}/${groupId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(response);
  },

};