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
  const { theme, toggle } = useTheme();

  return (
    <nav className="bottom-nav">
      {items.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} className={`nav-item ${loc === href ? "active" : ""}`} data-testid={`nav-${label}`}>
          <Icon size={20} strokeWidth={2} />
          <span>{label}</span>
        </Link>
      ))}
      {/* Theme toggle as a floating button above bottom nav */}
    </nav>
  );
}

// Reusable theme toggle button for page headers
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
      style={{
        background: "hsl(var(--secondary))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--muted-foreground))",
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
