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

export const groupsService = {

  async getGroups() {

    const token = await getTokenOrThrow();

    const response = await fetch(GROUPS_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(response);
  },

  async createGroup(data: any) {

    const token = await getTokenOrThrow();

    const response = await fetch(GROUPS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return parseResponse(response);
  },

  async updateGroup(id: string | number, data: any) {

    const token = await getTokenOrThrow();
    const methods: Array<'PATCH' | 'PUT'> = ['PATCH', 'PUT'];

    for (const method of methods) {
      const response = await fetch(`${GROUPS_API_URL}/${id}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const body = await parseJson(response);

      if (response.ok) {
        return body;
      }

      if (response.status === 404 || response.status === 405) {
        continue;
      }

      throw new Error(body?.message || 'Failed to update group');
    }

    throw new Error('Group update route/method not found');
  },

  async deleteGroup(id: string | number) {

    const token = await getTokenOrThrow();

    const response = await fetch(`${GROUPS_API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(response);
  }

};
