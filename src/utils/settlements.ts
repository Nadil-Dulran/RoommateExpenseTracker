import { Settlement, SettlementMethod } from '../types';

const EXPENSE_NOTE_PREFIX = '[expense:';

const normalizeMethod = (value: any): SettlementMethod => {
  const normalized = String(value ?? 'CASH').toUpperCase();
  if (normalized === 'BANK' || normalized === 'UPI') {
    return normalized;
  }
  return 'CASH';
};

const toIsoString = (value: any) => {
  if (!value) {
    return new Date(0).toISOString();
  }

  const timestamp = Date.parse(String(value));
  if (!Number.isFinite(timestamp)) {
    return new Date(0).toISOString();
  }

  return new Date(timestamp).toISOString();
};

const toId = (value: any) => {
  return String(value ?? '');
};

export const extractSettlementExpenseId = (raw: any): string => {
  const direct = toId(
    raw?.expenseId ??
      raw?.expense_id ??
      raw?.expense?.id ??
      raw?.relatedExpenseId ??
      raw?.related_expense_id
  ).trim();

  if (direct) {
    return direct;
  }

  const notes = String(raw?.notes ?? '').trim();
  const prefixIndex = notes.indexOf(EXPENSE_NOTE_PREFIX);

  if (prefixIndex === -1) {
    return '';
  }

  const start = prefixIndex + EXPENSE_NOTE_PREFIX.length;
  const end = notes.indexOf(']', start);

  if (end === -1) {
    return '';
  }

  return notes.slice(start, end).trim();
};

export const formatSettlementNote = (expenseId: string, description?: string | null) => {
  const cleanedExpenseId = String(expenseId ?? '').trim();
  const cleanedDescription = String(description ?? '').trim();

  if (!cleanedExpenseId) {
    return cleanedDescription || null;
  }

  if (cleanedDescription) {
    return `${EXPENSE_NOTE_PREFIX}${cleanedExpenseId}] Settlement for ${cleanedDescription}`;
  }

  return `${EXPENSE_NOTE_PREFIX}${cleanedExpenseId}] Settlement`;
};

export const extractSettlementsPayload = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.settlements)) {
    return data.settlements;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

export const normalizeSettlement = (raw: any): Settlement => {
  const payerId = toId(raw?.payer_id ?? raw?.payerId ?? raw?.payer?.id ?? raw?.paid_by);
  const receiverId = toId(raw?.receiver_id ?? raw?.receiverId ?? raw?.receiver?.id);
  const groupId = toId(raw?.group_id ?? raw?.groupId ?? raw?.group?.id ?? raw?.groupID);
  const expenseId = extractSettlementExpenseId(raw);

  return {
    id: toId(raw?.id ?? raw?.settlementId ?? raw?.settlement_id ?? raw?.uuid),
    groupId,
    expenseId: expenseId || undefined,
    payerId,
    payerName:
      raw?.payer_name ??
      raw?.payerName ??
      raw?.payer?.name ??
      (payerId ? `Member ${payerId}` : 'Unknown'),
    receiverId,
    receiverName:
      raw?.receiver_name ??
      raw?.receiverName ??
      raw?.receiver?.name ??
      (receiverId ? `Member ${receiverId}` : 'Unknown'),
    amount: Number(raw?.amount ?? 0),
    currency: raw?.currency ?? 'USD',
    method: normalizeMethod(raw?.method),
    notes: raw?.notes ?? null,
    createdAt: toIsoString(raw?.createdAt ?? raw?.created_at ?? raw?.created ?? raw?.createdDate),
    updatedAt:
      raw?.updatedAt ??
      raw?.updated_at ??
      raw?.updated ??
      raw?.updatedDate ??
      null,
  };
};
