/**
 * Определяет платформу запуска: telegram | max | web
 * НЕ ломает существующую логику.
 * 
 * MAX определяем по:
 * - window.max?.WebApp (будущее)
 * - User-Agent содержит "Max/" или "MaxMessenger"
 * - URL параметр ?platform=max
 * - referrer содержит max.ru
 */
export type Platform = "telegram" | "max" | "web";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  
  // Telegram
  if (window.Telegram?.WebApp?.initData) return "telegram";
  
  // MAX — по User-Agent
  const ua = navigator.userAgent || "";
  if (/Max\/|MaxMessenger|max\.ru/i.test(ua)) return "max";
  
  // MAX — по URL параметру (fallback для разработки)
  const params = new URLSearchParams(window.location.search);
  if (params.get("platform") === "max") return "max";
  
  // MAX — по referrer
  if (document.referrer && /max\.ru/i.test(document.referrer)) return "max";
  
  // Telegram (проверяем initDataUnsafe даже без initData)
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) return "telegram";
  
  return "web";
}

let _platform: Platform | null = null;

export function usePlatform(): Platform {
  if (!_platform) _platform = detectPlatform();
  return _platform;
}

// Экспортируем для использования вне React
export const platform = typeof window !== "undefined" ? detectPlatform() : "web";
