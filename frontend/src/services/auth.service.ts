import api from "@/lib/api";
import type { AuthTokens, User } from "@/types";

export const authService = {
  async register(data: {
    email: string; username: string; full_name: string; password: string; role?: string;
  }): Promise<AuthTokens> {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  async me(): Promise<User> {
    const res = await api.get("/auth/me");
    return res.data;
  },

  saveTokens(tokens: AuthTokens) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("user", JSON.stringify(tokens.user));
  },

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
};
