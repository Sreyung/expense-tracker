import { create } from 'zustand';
import { Category, CategoryType } from '@/types';
import * as repo from '@/db/repositories/categories';

interface CategoryState {
  categories: Category[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (data: { name: string; type: CategoryType; color: string; icon: string }) => Promise<Category>;
  update: (id: string, data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'type'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byType: (type: 'income' | 'expense') => Category[];
  getById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoaded: false,

  load: async () => {
    const categories = await repo.listCategories();
    set({ categories, isLoaded: true });
  },

  add: async (data) => {
    const cat = await repo.insertCategory(data);
    set((s) => ({ categories: [...s.categories, cat] }));
    return cat;
  },

  update: async (id, data) => {
    const updated = await repo.updateCategory(id, data);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? updated : c)),
    }));
  },

  remove: async (id) => {
    await repo.deleteCategory(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  byType: (type) => {
    return get().categories.filter((c) => c.type === type || c.type === 'both');
  },

  getById: (id) => get().categories.find((c) => c.id === id),
}));
