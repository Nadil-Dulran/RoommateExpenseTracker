import { expenses } from '../data/mockData';

let localExpenses = [...expenses];

export const expenseService = {
  getExpenses: async () => {
    return localExpenses;
  },

  addExpense: async (expense: any) => {
    localExpenses.push(expense);
    return expense;
  },

  deleteExpense: async (id: string) => {
    localExpenses = localExpenses.filter(e => e.id !== id);
  },
};
