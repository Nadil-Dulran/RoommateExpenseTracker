import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

export interface ProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  currency?: string;
}

const PROFILE_ENDPOINTS = [`${API_URL}/profile`, `${API_URL}/auth/profile`];

const parseJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const normalizeProfile = (body: any): ProfilePayload => {
  const source = body?.data ?? body?.profile ?? body?.user ?? body ?? {};

  return {
    name: source?.name,
    email: source?.email,
    phone: source?.phone ?? source?.mobile,
    currency: source?.currency ?? source?.preferredCurrency,
  };
};

const getTokenOrThrow = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    throw new Error('No auth token found');
  }

  return token;
};

export const profileService = {

  async getProfile() {
    const token = await getTokenOrThrow();

    for (const endpoint of PROFILE_ENDPOINTS) {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await parseJson(response);

      if (response.ok) {
        return normalizeProfile(body);
      }

      if (response.status === 404) {
        continue;
      }

      throw new Error(body?.message || 'Failed to load profile');
    }

    throw new Error('Profile endpoint not found');
  },

  async updateProfile(data: ProfilePayload) {
    const token = await getTokenOrThrow();
    const methods: Array<'PATCH' | 'PUT'> = ['PATCH', 'PUT'];

    for (const endpoint of PROFILE_ENDPOINTS) {
      for (const method of methods) {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const body = await parseJson(response);

        if (response.ok) {
          return normalizeProfile(body);
        }

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        throw new Error(body?.message || 'Failed to update profile');
      }
    }

    throw new Error('Profile update route/method not found');
  }

};
