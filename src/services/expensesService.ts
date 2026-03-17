import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

const EXPENSES_API_URL = `${API_URL}/expenses`;

const getToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) { throw new Error('No auth token'); }
  return token;
};

const parseResponse = async (res: Response) => {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message || body?.error || `Request failed (HTTP ${res.status})`);
  }
  return body;
};

const unwrapList = (body: any): any[] => {
  if (Array.isArray(body)) { return body; }
  if (Array.isArray(body?.data)) { return body.data; }
  if (Array.isArray(body?.data?.expenses)) { return body.data.expenses; }
  if (Array.isArray(body?.data?.items)) { return body.data.items; }
  if (Array.isArray(body?.expenses)) { return body.expenses; }
  if (Array.isArray(body?.items)) { return body.items; }
  return [];
};

export const expensesService = {

  async createExpense(data: any) {
    const token = await getToken();
    const res = await fetch(EXPENSES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return parseResponse(res);
  },

  async getExpenses(groupId?: number) {
    const token = await getToken();
    const url = groupId != null
      ? `${EXPENSES_API_URL}?groupId=${groupId}`
      : EXPENSES_API_URL;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await parseResponse(res);
    return unwrapList(body);
  },

  async updateExpense(id: number, data: any) {
    const token = await getToken();
    const res = await fetch(`${EXPENSES_API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return parseResponse(res);
  },

  async deleteExpense(id: number) {
    const token = await getToken();
    const res = await fetch(`${EXPENSES_API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseResponse(res);
  },

};