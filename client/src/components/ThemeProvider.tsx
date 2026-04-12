import { createContext, useContext, useEffect, useState } from "react";

// ── Telegram WebApp types ────────────────────────────────────────────────────
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

// ── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext<{ theme: string; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

// ── User ─────────────────────────────────────────────────────────────────────
export type AppUser = {
  id: number;
  name: string;
  phone: string;
  role: string;
  isSubscribed: boolean;
  avatarUrl?: string | null;
  city?: string;
  tgUser?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  } | null;
} | null;

const UserCtx = createContext<{ user: AppUser; setUser: (u: AppUser) => void }>({
  user: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser>(null);
  return <UserCtx.Provider value={{ user, setUser }}>{children}</UserCtx.Provider>;
}

export const useUser = () => useContext(UserCtx);

/** Helper to read Telegram WebApp user */
export function getTelegramUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
}
