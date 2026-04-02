import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

const SETTLEMENTS_API_URL = `${API_URL}/settlements`;

const parseJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const parseResponse = async (response: Response) => {
  const body = await parseJson(response);

  if (!response.ok) {
    const serverMessage = body?.message || body?.error;
    const fallback = `Settlement request failed (HTTP ${response.status})`;
    throw new Error(serverMessage || fallback);
  }

  return body;
};

const getTokenOrThrow = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    throw new Error('No auth token');
  }

  return token;
};

export const settlementService = {

  async getSettlements(groupId: number) {
    if (!Number.isFinite(groupId)) {
      throw new Error('groupId is required');
    }

    const token = await getTokenOrThrow();

    const response = await fetch(`${SETTLEMENTS_API_URL}?groupId=${encodeURIComponent(groupId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(response);
  },

  async createSettlement(data: any) {
    const token = await getTokenOrThrow();

    const response = await fetch(SETTLEMENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return parseResponse(response);
  },

};