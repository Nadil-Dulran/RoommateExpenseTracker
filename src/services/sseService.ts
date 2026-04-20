import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';

const NOTIFICATION_API_URL = `${API_URL}/notifications`;

let eventSource: any = null;
let activeConnectionId = 0;

type ConnectHandlers = {
  onOpen?: () => void;
  onError?: (error: any) => void;
};

const safeParse = (value: any) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return null;
};

export const sseService = {

  async connect(onMessage: (data: any) => void, handlers?: ConnectHandlers) {
    activeConnectionId += 1;
    const connectionId = activeConnectionId;

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('No auth token');
    }

    eventSource = new EventSource(
      `${NOTIFICATION_API_URL}/subscribe`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const handleEvent = (event: any) => {
      if (connectionId !== activeConnectionId) {
        return;
      }

      const payload = safeParse(event?.data);

      if (!payload) {
        return;
      }

      onMessage(payload);
    };

    eventSource.addEventListener('message', handleEvent);
    eventSource.addEventListener('notification', handleEvent);
    eventSource.addEventListener('open', () => {
      if (connectionId !== activeConnectionId) {
        return;
      }
      handlers?.onOpen?.();
    });

    eventSource.onopen = () => {
      if (connectionId !== activeConnectionId) {
        return;
      }
      handlers?.onOpen?.();
    };

    eventSource.onerror = (error: any) => {
      if (connectionId !== activeConnectionId) {
        return;
      }
      console.log('SSE error', error);
      handlers?.onError?.(error);
    };

    eventSource.addEventListener('error', (error: any) => {
      if (connectionId !== activeConnectionId) {
        return;
      }
      handlers?.onError?.(error);
    });

  },

  disconnect() {
    activeConnectionId += 1;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

};