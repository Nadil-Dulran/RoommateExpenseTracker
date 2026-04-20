import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './api';
import { Notification } from '../types/notification';
import { CategoryType } from '../types/expense';

const NOTIFICATION_API_URL = `${API_URL}/notifications`;

const getToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('No auth token');
  }
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
  if (Array.isArray(body?.data?.notifications)) { return body.data.notifications; }
  if (Array.isArray(body?.data?.items)) { return body.data.items; }
  if (Array.isArray(body?.notifications)) { return body.notifications; }
  if (Array.isArray(body?.items)) { return body.items; }
  return [];
};

const toSafeNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toSafeString = (value: any, fallback = '') => {
  if (value == null) {
    return fallback;
  }
  const parsed = String(value).trim();
  return parsed || fallback;
};

const parseNotificationData = (rawData: any) => {
  if (rawData?.data && typeof rawData.data === 'object') {
    return rawData.data;
  }

  if (rawData && typeof rawData === 'object') {
    return rawData;
  }

  if (typeof rawData === 'string') {
    try {
      return JSON.parse(rawData);
    } catch {
      return {};
    }
  }

  return {};
};

const normalizeType = (type: string): Notification['type'] => {
  const normalizedType = toSafeString(type, 'expense_added').toLowerCase();

  if (normalizedType === 'expense_settled' || normalizedType === 'settlement_done') {
    return 'expense_settled';
  }

  return 'expense_added';
};

const normalizeCategory = (rawCategory: any): CategoryType => {
  const value = toSafeString(rawCategory, 'other').toLowerCase();

  if (value === 'travel') {
    return 'transport';
  }

  if (value === 'utilities' || value === 'utility' || value === 'bill' || value === 'bills') {
    return 'bills';
  }

  if (
    value === 'food' ||
    value === 'transport' ||
    value === 'shopping' ||
    value === 'entertainment' ||
    value === 'other'
  ) {
    return value as CategoryType;
  }

  return 'other';
};

const extractAmount = (raw: any, data: any): number | undefined => {
  const directAmount = raw?.userShareAmount ?? raw?.user_share_amount ?? data?.userShareAmount ?? data?.user_share_amount;
  if (directAmount != null) {
    return toSafeNumber(directAmount);
  }

  const expenseAmount = raw?.expense?.amount ?? data?.expense?.amount ?? data?.amount;
  if (expenseAmount != null) {
    return toSafeNumber(expenseAmount);
  }

  return undefined;
};

export const normalizeNotification = (raw: any): Notification => {
  const source = raw?.notification ?? raw?.data?.notification ?? raw?.payload?.notification ?? raw;
  const data = parseNotificationData(source?.data ?? raw?.data ?? raw?.payload);
  const type = normalizeType(source?.type ?? raw?.type);
  const amount = extractAmount(source, data);
  const createdAt =
    source?.created_at ??
    source?.createdAt ??
    source?.date ??
    raw?.created_at ??
    raw?.createdAt ??
    raw?.date;
  const title = toSafeString(source?.title ?? raw?.title, 'Notification');
  const message = toSafeString(source?.message ?? raw?.message, title);
  
  // DEBUG: Log the full payload structure
  if (__DEV__) {
    console.log('[Notification] Raw payload:', JSON.stringify(raw, null, 2));
    console.log('[Notification] Parsed data:', JSON.stringify(data, null, 2));
  }
  
  const groupName = toSafeString(
    data?.groupName ??
    data?.group_name ??
    data?.group_title ??
    data?.group?.name ??
    data?.expense?.groupName ??
    data?.expense?.group_name ??
    source?.groupName ??
    source?.group_name ??
    source?.group?.name ??
    source?.group_title ??
    raw?.groupName ??
    raw?.group_name ??
    raw?.group?.name ??
    raw?.group_title,
    'Group'
  );
  const groupEmoji = toSafeString(
    data?.groupEmoji ??
    data?.group_emoji ??
    data?.groupIcon ??
    data?.group_icon ??
    data?.group?.emoji ??
    data?.group?.icon ??
    data?.expense?.groupEmoji ??
    data?.expense?.group_emoji ??
    data?.emoji ??
    source?.groupEmoji ??
    source?.group_emoji ??
    source?.groupIcon ??
    source?.group_icon ??
    source?.emoji ??
    source?.group?.emoji ??
    source?.group?.icon ??
    raw?.groupEmoji ??
    raw?.group_emoji ??
    raw?.groupIcon ??
    raw?.group_icon ??
    raw?.emoji ??
    raw?.group?.emoji ??
    raw?.group?.icon,
    '👥'
  );
  const category = normalizeCategory(
    data?.expense?.category ??
    data?.category ??
    source?.expense?.category ??
    source?.category ??
    raw?.expense?.category ??
    raw?.category
  );
  
  if (__DEV__) {
    console.log(`[Notification] Normalized - type: ${type}, groupName: ${groupName}, groupEmoji: ${groupEmoji}, category: ${category}`);
  }

  return {
    id: toSafeString(source?.id ?? source?.notificationId ?? source?.notification_id ?? raw?.id),
    read: Boolean(source?.read ?? source?.is_read ?? raw?.read ?? raw?.is_read),
    type,
    title,
    date: toSafeString(createdAt, new Date().toISOString()),
    message,
    data: data ?? {},
    readAt: source?.read_at ?? source?.readAt ?? raw?.read_at ?? raw?.readAt ?? null,
    groupName,
    groupEmoji,
    relatedUser: {
      id: toSafeString(
        data?.relatedUser?.id ??
        data?.actorId ??
        data?.actor_id ??
        data?.userId ??
        data?.user_id ??
        source?.relatedUser?.id ??
        source?.actorId ??
        source?.actor_id,
        '0'
      ),
      name: toSafeString(
        data?.relatedUser?.name ??
        data?.actorName ??
        data?.actor_name ??
        data?.userName ??
        data?.user_name ??
        source?.relatedUser?.name ??
        source?.actorName ??
        source?.actor_name,
        'User'
      ),
      avatar: require('../../assets/ProfileIcon.png'),
    },
    expense: {
      category,
      splits: amount != null
        ? [{ userId: 'me', amount }]
        : [],
    },
  };
};

export const notificationService = {

  normalizeNotification,

  async getNotifications(unreadOnly = true): Promise<Notification[]> {
    const token = await getToken();
    const suffix = unreadOnly ? '?unreadOnly=true' : '';
    const res = await fetch(`${NOTIFICATION_API_URL}${suffix}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await parseResponse(res);
    
    if (__DEV__) {
      console.log('[Notifications API] Response body:', JSON.stringify(body, null, 2));
    }
    
    const items = unwrapList(body);
    
    if (__DEV__) {
      console.log('[Notifications API] Unwrapped items:', JSON.stringify(items, null, 2));
    }
    
    const notifications = items
      .map(normalizeNotification)
      .filter(item => (unreadOnly ? !item.read : true));

    return notifications;
  },

  async markAsRead(notificationId: string) {
    const token = await getToken();
    const res = await fetch(`${NOTIFICATION_API_URL}/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(res);
  },

  async markAllAsRead() {
    const token = await getToken();
    const res = await fetch(`${NOTIFICATION_API_URL}/read-all`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(res);
  },

  async purgeReadOlderThan(days = 2) {
    const token = await getToken();
    const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 2;
    const res = await fetch(`${NOTIFICATION_API_URL}/purge-read?olderThanDays=${safeDays}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseResponse(res);
  },

};