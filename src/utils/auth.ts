import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  exp: number;
};

export const getSessionExpiryTime = async (): Promise<number | null> => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    return null;
  }

  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isSessionExpired = async () => {
  const expiryTime = await getSessionExpiryTime();
  return expiryTime === null || expiryTime <= Date.now();
};

export const clearSession = async () => {
  await Promise.all([
    AsyncStorage.removeItem('token'),
    AsyncStorage.removeItem('userId'),
  ]);
};