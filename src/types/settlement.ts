export type SettlementMethod = 'CASH' | 'BANK' | 'UPI';

export interface Settlement {
  id: string;
  groupId: string;
  expenseId?: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  currency: string;
  method: SettlementMethod;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
