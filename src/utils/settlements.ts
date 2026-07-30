import { Settlement, SettlementMethod } from '../types';

const EXPENSE_NOTE_PREFIX = '[expense:';

const normalizeMethod = (value: any): SettlementMethod => {
  const method = String(value ?? 'CASH').toUpperCase();

  return method === 'BANK' || method === 'UPI'
    ? method
    : 'CASH';
};

const toIsoString = (value: any): string => {
  const timestamp = Date.parse(String(value ?? ''));

  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
};

export const extractSettlementExpenseId = (raw: any): string => {
  // Keep direct expenseId support for newly-created/local settlement data.
  const directId = raw?.expenseId ?? raw?.expense_id;

  if (directId != null) {
    return String(directId).trim();
  }

  // Backend GET does not return expenseId, so recover it from notes.
  const notes = String(raw?.notes ?? '');
  const match = notes.match(/\[expense:([^\]]+)\]/i);

  return match?.[1]?.trim() ?? '';
};

export const formatSettlementNote = (
  expenseId: string,
  description?: string | null
) => {
  const id = String(expenseId ?? '').trim();
  const text = String(description ?? '').trim();

  if (!id) {
    return text || null;
  }

  return text
    ? `${EXPENSE_NOTE_PREFIX}${id}] Settlement for ${text}`
    : `${EXPENSE_NOTE_PREFIX}${id}] Settlement`;
};

export const extractSettlementsPayload = (data: any): any[] => {
  return Array.isArray(data) ? data : [];
};

export const normalizeSettlement = (raw: any): Settlement => {
  const payerId = String(raw?.payer_id ?? '');
  const receiverId = String(raw?.receiver_id ?? '');
  const expenseId = extractSettlementExpenseId(raw);

  return {
    id: String(raw?.id ?? ''),
    groupId: String(raw?.group_id ?? ''),
    expenseId: expenseId || undefined,
    payerId,
    payerName:
      raw?.payer_name ??
      (payerId ? `Member ${payerId}` : 'Unknown'),
    receiverId,
    receiverName:
      raw?.receiver_name ??
      (receiverId ? `Member ${receiverId}` : 'Unknown'),
    amount: Number(raw?.amount ?? 0),
    currency: raw?.currency ?? 'USD',
    method: normalizeMethod(raw?.method),
    notes: raw?.notes ?? null,
    createdAt: toIsoString(raw?.created_at),
    updatedAt: raw?.updated_at ?? null,
  };
};