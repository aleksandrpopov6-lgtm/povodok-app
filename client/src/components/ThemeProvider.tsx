import { createContext, useContext, useEffect, useState } from "react";

// ── Telegram WebApp types ────────────────────────────────────────────────────
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        colorScheme?: "dark" | "light";
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

// ── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext<{ theme: string; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // 1. localStorage (приоритет 1)
    try {
      const saved = localStorage.getItem("povodok_theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    
    // 2. Telegram colorScheme (приоритет 2)
    const tgScheme = window.Telegram?.WebApp?.colorScheme;
    if (tgScheme === "dark" || tgScheme === "light") return tgScheme;
    
    // 3. prefers-color-scheme (приоритет 3)
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    
    return "dark"; // default
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  const toggle = () => setTheme(t => {
    const next = t === "dark" ? "light" : "dark";
    try { localStorage.setItem("povodok_theme", next); } catch {}
    return next;
  });

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
