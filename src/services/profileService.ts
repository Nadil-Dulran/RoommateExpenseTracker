import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

export interface ProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  currency?: string;
  avatarBase64?: string;
}

const PROFILE_ENDPOINTS = [`${API_URL}/profile`, `${API_URL}/auth/profile`];

const parseJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const formatErrorMessage = (body: any, fallback: string, response?: Response) => {
  const message =
    body?.message ||
    body?.error ||
    (typeof body === 'string' ? body : null) ||
    fallback;

  if (!response) {
    return message;
  }

  return `${message} (HTTP ${response.status})`;
};

const toDataUriIfNeeded = (value?: string) => {
  if (!value) {
    return value;
  }

  if (value.startsWith('data:image')) {
    return value;
  }

  return `data:image/jpeg;base64,${value}`;
};

const normalizeProfile = (body: any): ProfilePayload => {
  const source =
    body?.data?.dataValues ??
    body?.profile?.dataValues ??
    body?.user?.dataValues ??
    body?.data ??
    body?.profile ??
    body?.user ??
    body ?? {};

  return {
    name: source?.name,
    email: source?.email,
    phone: source?.phone ?? source?.mobile,
    currency: source?.currency ?? source?.preferredCurrency,
    avatarBase64:
      source?.avatar_base64 ??
      undefined,
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
    const payloads: ProfilePayload[] = [data];

    if (data.avatarBase64 && !data.avatarBase64.startsWith('data:image')) {
      payloads.push({
        ...data,
        avatarBase64: toDataUriIfNeeded(data.avatarBase64),
      });
    }

    let lastError: Error | null = null;

    for (const endpoint of PROFILE_ENDPOINTS) {
      for (const method of methods) {
        for (const payload of payloads) {
          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const body = await parseJson(response);

          if (response.ok) {
            return normalizeProfile(body);
          }

          if (response.status === 404 || response.status === 405) {
            continue;
          }

          lastError = new Error(formatErrorMessage(body, 'Failed to update profile', response));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error('Profile update route/method not found');
  }

};
