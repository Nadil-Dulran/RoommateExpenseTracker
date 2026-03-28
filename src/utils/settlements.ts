import { Settlement, SettlementMethod } from '../types';

const normalizeMethod = (value: any): SettlementMethod => {
  const normalized = String(value ?? 'CASH').toUpperCase();
  if (normalized === 'BANK' || normalized === 'UPI') {
    return normalized;
  }
  return 'CASH';
};

const toIsoString = (value: any) => {
  if (!value) {
    return new Date().toISOString();
  }

  const timestamp = Date.parse(String(value));
  if (!Number.isFinite(timestamp)) {
    return new Date().toISOString();
  }

  return new Date(timestamp).toISOString();
};

const toId = (value: any) => {
  return String(value ?? '');
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

  return {
    id: toId(raw?.id ?? raw?.settlementId ?? raw?.settlement_id ?? raw?.uuid),
    groupId,
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
