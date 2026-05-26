import API_URL from './api';

export const authService = {

  register: async (data: any) => {

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, body };
  },

  login: async (data: any) => {

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  requestPasswordReset: async (data: { email: string }) => {
    const response = await fetch(`${API_URL}/auth/forgot-password/request-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, body };
  },

  verifyResetCode: async (data: { email: string; code: string }) => {
    const response = await fetch(`${API_URL}/auth/forgot-password/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, body };
  },

  resetPassword: async (data: { email: string; newPassword: string; confirmPassword: string }) => {
    const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, body };
  },

};

