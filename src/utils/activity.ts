import { BackendGroup, TimelineEntry, GroupMember } from '../types/activity';
import { CategoryType } from '../types';
import { CATEGORY_EMOJI_BY_TYPE } from '../constants/emojis';

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const EARLIEST_ISO = new Date(0).toISOString();

export const ensureDateValue = (value: any): string | undefined => {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(String(value));
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
};

export const roundCurrency = (value: number) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

export const safeTimestamp = (value?: string) => {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : Date.parse(EARLIEST_ISO);
};

export const extractNumericOrderFromId = (value?: string) => {
  if (!value) {
    return 0;
  }

  const matches = String(value).match(/\d+/g);
  if (!matches || matches.length === 0) {
    return 0;
  }

  const parsed = Number(matches[matches.length - 1]);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getCategoryEmoji = (categoryValue?: string) => {
  const normalized = String(categoryValue ?? 'other').toLowerCase() as CategoryType;
  return CATEGORY_EMOJI_BY_TYPE[normalized] ?? CATEGORY_EMOJI_BY_TYPE.other;
};

export const compareTimelineEntries = (a: TimelineEntry, b: TimelineEntry) => {
  const timeDiff = b.sortTime - a.sortTime;
  if (timeDiff !== 0) {
    return timeDiff;
  }

  const idDiff = b.orderId - a.orderId;
  if (idDiff !== 0) {
    return idDiff;
  }

  return b.id.localeCompare(a.id);
};

export const extractMembersPayload = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.members)) {
    return data.members;
  }

  return [];
};

export const normalizeMember = (member: any): GroupMember => ({
  id: String(member?.id ?? member?.user_id ?? member?.userId ?? ''),
  name:
    member?.name ??
    member?.user?.name ??
    member?.full_name ??
    'Member',
});

export const normalizeGroupInfo = (group: any): BackendGroup => ({
  id: String(group?.id ?? ''),
  name: group?.name || 'Untitled Group',
  emoji: group?.emoji || '👥',
  createdAt: group?.created_at,
  members: Array.isArray(group?.members)
    ? group.members.map(normalizeMember)
    : Array.isArray(group?.users)
    ? group.users.map(normalizeMember)
    : [],
});
