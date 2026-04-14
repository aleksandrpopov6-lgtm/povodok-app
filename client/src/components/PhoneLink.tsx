import { Phone } from "lucide-react";
import { usePlatform } from "@/hooks/usePlatform";

/**
 * Кликабельный телефонный номер.
 * Открывает звонилку при нажатии (tel:).
 */
export default function PhoneLink({
  phone,
  showIcon = true,
  className = "",
  style = {},
}: {
  phone: string;
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Очищаем номер для tel: ссылки
  const clean = phone.replace(/[^\d+]/g, "");

  return (
    <a
      href={`tel:${clean}`}
      className={className}
      style={{
        color: "hsl(var(--primary))",
        fontWeight: 700,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        ...style,
      }}
      onClick={e => e.stopPropagation()}
    >
      {showIcon && <Phone size={14} strokeWidth={2} />}
      {phone}
    </a>
  );
}

/**
 * Кнопка "Написать в Telegram"
 * Открывает чат по номеру телефона через t.me
 * Если есть @username — использует его, иначе — phone link
 */
export function TelegramLink({
  phone,
  username,
  label = "Написать",
  className = "",
}: {
  phone: string;
  username?: string;
  label?: string;
  className?: string;
}) {
  // Формируем ссылку: если есть username — t.me/username, иначе tel:
  const href = username
    ? `https://t.me/${username.replace("@", "")}`
    : `https://t.me/+${phone.replace(/[^\d]/g, "")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ textDecoration: "none" }}
      onClick={e => e.stopPropagation()}
    >
      {label}
    </a>
  );
}

/**
 * Platform-aware кнопка связи.
 * Telegram → t.me ссылка
 * MAX → max.ru ссылка (или deep link)
 * НЕ ломает существующий TelegramLink
 */
export function ContactLink({
  phone,
  username,
  maxUsername,
  label = "Написать",
  className = "",
  style = {},
}: {
  phone: string;
  username?: string;        // telegram @username
  maxUsername?: string;     // MAX username (если есть)
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const plat = usePlatform();
  
  let href: string;
  
  if (plat === "max") {
    // MAX deep link
    if (maxUsername) {
      href = `https://max.ru/${maxUsername}`;
    } else if (username) {
      // Если нет MAX username — показываем телефон
      href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    } else {
      href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    }
  } else {
    // Telegram (default)
    href = username
      ? `https://t.me/${username.replace("@", "")}`
      : `https://t.me/+${phone.replace(/[^\d]/g, "")}`;
  }
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ textDecoration: "none", ...style }}
      onClick={e => e.stopPropagation()}
    >
      {label}
    </a>
  );
}
