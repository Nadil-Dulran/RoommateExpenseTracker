import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:5000/api';
const SETTLEMENTS_API_URL = `${BASE_URL}/settlements`;

const parseJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const parseResponse = async (response: Response) => {
  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(body?.message || body?.error || 'Settlement request failed');
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