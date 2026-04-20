export type TransactionType = 'income' | 'expense';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TransactionSource = 'manual' | 'pdf_import' | 'recurring';
export type CategoryType = 'income' | 'expense' | 'both';
export type AllocationPeriod = 'monthly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parent_id: string | null;
  is_system: 0 | 1;
  created_at: number;
}

export interface Person {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: number;
  description: string | null;
  category_id: string | null;
  event_id: string | null;
  is_planned: 0 | 1;
  planned_due_date: number | null;
  recurrence_type: RecurrenceType;
  recurrence_end: number | null;
  source: TransactionSource;
  raw_description: string | null;
  created_at: number;
  updated_at: number;
  category?: Category;
  people?: Person[];
}

export interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}

export interface ParsedRow {
  date: Date | null;
  description: string;
  amount: number;
  suggestedType: TransactionType;
  suggestedCategoryId: string | null;
  raw: string;
}

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  date: number;
  description?: string;
  category_id?: string;
  source?: TransactionSource;
  raw_description?: string;
  peopleIds?: string[];
};
