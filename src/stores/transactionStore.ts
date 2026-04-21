import { create } from 'zustand';
import { Transaction, TransactionInput, MonthlySummary } from '@/types';
import * as repo from '@/db/repositories/transactions';
import { currentYearMonth } from '@/utils/dateHelpers';

interface TransactionState {
  transactions: Transaction[];
  summary: MonthlySummary;
  selectedYear: number;
  selectedMonth: number;
  isLoading: boolean;

  loadMonth: (year: number, month: number) => Promise<void>;
  refreshCurrentMonth: () => Promise<void>;
  addTransaction: (data: TransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<TransactionInput>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkInsert: (items: TransactionInput[]) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => {
  const { year, month } = currentYearMonth();
  return {
  transactions: [],
  summary: { income: 0, expense: 0, net: 0 },
  selectedYear: year,
  selectedMonth: month,
  isLoading: false,

  loadMonth: async (yr, mo) => {
    set({ isLoading: true, selectedYear: yr, selectedMonth: mo });
    const [transactions, summary] = await Promise.all([
      repo.listByMonth(yr, mo),
      repo.sumByMonth(yr, mo),
    ]);
    set({ transactions, summary, isLoading: false });
  },

  refreshCurrentMonth: async () => {
    const { selectedYear, selectedMonth } = get();
    await get().loadMonth(selectedYear, selectedMonth);
  },

  addTransaction: async (data) => {
    const tx = await repo.insertTransaction(data);
    await get().refreshCurrentMonth();
    return tx;
  },

  updateTransaction: async (id, data) => {
    const tx = await repo.updateTransaction(id, data);
    await get().refreshCurrentMonth();
    return tx;
  },

  deleteTransaction: async (id) => {
    await repo.deleteTransaction(id);
    await get().refreshCurrentMonth();
  },

  bulkInsert: async (items) => {
    await repo.bulkInsert(items);
    await get().refreshCurrentMonth();
  },
  };
});
