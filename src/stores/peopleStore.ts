import { create } from 'zustand';
import { Person } from '@/types';
import * as repo from '@/db/repositories/people';

interface PeopleState {
  people: Person[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (data: { name: string; phone?: string | null; email?: string | null }) => Promise<Person>;
  update: (id: string, data: Partial<Pick<Person, 'name' | 'phone' | 'email'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Person | undefined;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: [],
  isLoaded: false,

  load: async () => {
    const people = await repo.listPeople();
    set({ people, isLoaded: true });
  },

  add: async (data) => {
    const person = await repo.insertPerson(data);
    set((s) => ({ people: [...s.people, person] }));
    return person;
  },

  update: async (id, data) => {
    const updated = await repo.updatePerson(id, data);
    set((s) => ({
      people: s.people.map((p) => (p.id === id ? updated : p)),
    }));
  },

  remove: async (id) => {
    await repo.deletePerson(id);
    set((s) => ({ people: s.people.filter((p) => p.id !== id) }));
  },

  getById: (id) => get().people.find((p) => p.id === id),
}));
