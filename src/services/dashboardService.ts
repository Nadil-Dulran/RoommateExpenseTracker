import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

const DASHBOARD_API_URL = `${API_URL}/dashboard`;

const parseJson = async (response: Response) => {
  return response.json().catch(() => null);
};


export const dashboardService = {

  async getDashboard() {

    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch(DASHBOARD_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await parseJson(response);

    if (!response.ok) {
      throw new Error(body?.message || 'Failed to load dashboard');
    }

    return body?.data ?? body;
  }

};