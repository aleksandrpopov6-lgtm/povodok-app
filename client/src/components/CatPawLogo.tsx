/**
 * CatPawLogo — иконка лапки + двухцветный логотип «ПоводОК»
 * «Повод» — белый/тёмный, «ОК» — коралловый/розовый акцент
 */
const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

/** Только иконка — актуальный логотип из PNG */
export default function CatPawLogo({ size = 36 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      alt="ПоводОК"
      width={size}
      height={size}
      style={{ borderRadius: "0.55rem", objectFit: "cover", display: "block", flexShrink: 0 }}
    />
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
      <span style={{ color: "#F0485C" }}>ОК</span>
    </span>
  );
}
