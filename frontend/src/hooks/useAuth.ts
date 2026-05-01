"use client";
import { create } from "zustand";
import type { User } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  initialize: () => {
    const user = authService.getStoredUser();
    set({ user, isLoading: false });
  },

  login: async (email, password) => {
    const tokens = await authService.login(email, password);
    authService.saveTokens(tokens);
    set({ user: tokens.user });
  },

  logout: () => {
    authService.clearTokens();
    set({ user: null });
  },
}));
