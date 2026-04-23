import { create } from "zustand";

const AUTH_STORAGE_KEY = "hm_auth";

const readStoredAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredAuth = (state) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
};

const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

const stored = readStoredAuth();

export const useAuthStore = create((set, get) => ({
  user: stored?.user || null,
  token: stored?.token || null,
  refreshToken: stored?.refreshToken || null,
  isAuthenticated: Boolean(stored?.token),
  login: ({ user, token, refreshToken }) => {
    const nextState = {
      user: user || null,
      token: token || null,
      refreshToken: refreshToken || null,
      isAuthenticated: Boolean(token)
    };

    writeStoredAuth(nextState);
    set(nextState);
  },
  logout: () => {
    clearStoredAuth();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false
    });
  },
  setUser: (user) => {
    const current = get();
    const nextState = {
      ...current,
      user
    };

    writeStoredAuth({
      user: nextState.user,
      token: nextState.token,
      refreshToken: nextState.refreshToken,
      isAuthenticated: nextState.isAuthenticated
    });

    set({ user });
  }
}));
