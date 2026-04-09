/**
 * CatPawLogo — иконка лапки + двухцветный логотип «ПоводОК»
 * «Повод» — белый/тёмный, «ОК» — коралловый/розовый акцент
 */

/** Только иконка (квадрат с лапкой) */
export default function CatPawLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="ПоводОК"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="11" fill="url(#pawGrad2)" />
      <defs>
        <linearGradient id="pawGrad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EE5FA2" />
          <stop offset="1" stopColor="#F0485C" />
        </linearGradient>
      </defs>
      {/* 3 пальчиковых подушечки */}
      <ellipse cx="12.5" cy="12.5" rx="3.8" ry="4.6" fill="white" opacity="0.95" />
      <ellipse cx="20"   cy="10.5" rx="3.5" ry="4.3" fill="white" opacity="0.95" />
      <ellipse cx="27.5" cy="12.5" rx="3.8" ry="4.6" fill="white" opacity="0.95" />
      {/* Большая центральная подушечка */}
      <path
        d="M20 18.5C14 18.5 10 22 10 26.5C10 30.5 13.5 33 20 33C26.5 33 30 30.5 30 26.5C30 22 26 18.5 20 18.5Z"
        fill="white"
        opacity="0.95"
      />
      {/* Три маленьких пятнышка */}
      <ellipse cx="15.5" cy="26.5" rx="2.1" ry="2.5" fill="url(#pawGrad2)" opacity="0.4" />
      <ellipse cx="20"   cy="24.8" rx="2.1" ry="2.5" fill="url(#pawGrad2)" opacity="0.4" />
      <ellipse cx="24.5" cy="26.5" rx="2.1" ry="2.5" fill="url(#pawGrad2)" opacity="0.4" />
    </svg>
  );
}

/**
 * Двухцветный текстовый логотип «ПоводОК»
 * «Повод» — цвет foreground, «ОК» — градиент coral/pink
 */
export function BrandName({
  size = "text-lg",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <span className={`font-black leading-none ${size} ${className}`} aria-label="ПоводОК">
      <span style={{ color: "hsl(var(--foreground))" }}>Повод</span>
      <span
        style={{
          background: "linear-gradient(135deg, #EE5FA2, #F0485C)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        ОК
      </span>
    </span>
  );
}
