import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Layers, Scissors, Home, MessageSquare, User, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const items = [
  { href: "/", icon: Layers, label: "Лента" },
  { href: "/catchers", icon: Scissors, label: "Ловцы" },
  { href: "/services", icon: Home, label: "Сервисы" },
  { href: "/ads", icon: MessageSquare, label: "Помощь" },
  { href: "/profile", icon: User, label: "Профиль" },
];

export default function BottomNav() {
  const [loc] = useHashLocation();
  // Treat empty hash as home
  const activeLoc = loc === "" || loc === "#" ? "/" : loc;

  return (
    /* Обёртка — фиксированная, по центру */
    <div style={{
      position: "fixed",
      bottom: "calc(1rem + env(safe-area-inset-bottom))",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      width: "calc(100% - 2rem)",
      maxWidth: "420px",
    }}>
      {/* Сама таблетка */}
      <div style={{
        background: "var(--nav-bg, white)",
        borderRadius: "9999px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0.45rem 0.5rem",
        border: "1px solid var(--nav-border, rgba(0,0,0,0.07))",
      }}>
        {items.map(({ href, icon: Icon, label }) => {
          const active = activeLoc === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.15rem",
                padding: "0.4rem 0.7rem",
                borderRadius: "9999px",
                textDecoration: "none",
                background: active ? "linear-gradient(135deg, #EE5FA2, #F0485C)" : "transparent",
                transition: "all 0.18s",
                minWidth: "52px",
              }}
              data-testid={`nav-${label}`}
            >
              <Icon
                size={active ? 20 : 21}
                strokeWidth={2}
                style={{ color: active ? "white" : "var(--nav-icon, #888)" }}
              />
              <span style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                letterSpacing: "0.03em",
                color: active ? "white" : "var(--nav-icon, #888)",
                textTransform: "uppercase",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Theme toggle button
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      style={{
        width: "2.25rem",
        height: "2.25rem",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(var(--secondary))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--muted-foreground))",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      aria-label="Сменить тему"
      data-testid="button-theme-toggle"
    >
      {theme === "dark"
        ? <Sun size={16} strokeWidth={2} />
        : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}
