/**
 * SecureFlow brand marks — 6 variants from brand refresh:
 *  icon-light | icon-dark | wordmark-light | wordmark-dark | lockup-light | lockup-dark
 */
const GLYPH = (
  <path
    d="M17,52 C26,30 34,72 43,50 C50,34 55,64 61,49 L71,64 L90,26"
    stroke="#FFFFFF"
    strokeWidth="12"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />
);

function IconMark({ size = 40, style }) {
  const r = Math.round(size * 0.26);
  return (
    <div
      className="sf-icon-mark"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "linear-gradient(150deg, #0F1B3D 0%, #2952CC 55%, #2FD9C9 100%)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -14px 24px rgba(0,0,0,0.18), 0 12px 28px -12px rgba(41,82,204,0.5)",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <svg viewBox="0 0 100 100" width="58%" height="58%" style={{ position: "relative", zIndex: 1 }}>
        {GLYPH}
      </svg>
    </div>
  );
}

function Wordmark({ onDark = false, size = 28 }) {
  return (
    <span
      className={`sf-wordmark${onDark ? " on-dark" : ""}`}
      style={{
        fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.03em",
        display: "inline-flex",
        alignItems: "baseline",
        lineHeight: 1,
      }}
    >
      <span style={{ color: onDark ? "#FFFFFF" : "#0F1729" }}>secure</span>
      <span
        style={{
          background: onDark
            ? "linear-gradient(100deg, #3B6BE0 10%, #2FD9C9 100%)"
            : "linear-gradient(100deg, #2952CC 10%, #2FD9C9 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        flow
      </span>
    </span>
  );
}

/**
 * @param {'icon-light'|'icon-dark'|'wordmark-light'|'wordmark-dark'|'lockup-light'|'lockup-dark'} variant
 * @param {number} size - icon size in px (for icon/lockup)
 * @param {number} wordSize - wordmark font size
 */
export default function Brand({
  variant = "lockup-dark",
  size = 36,
  wordSize = 22,
  style,
  className = "",
}) {
  const isDark = variant.endsWith("dark");
  const isIcon = variant.startsWith("icon");
  const isWord = variant.startsWith("wordmark");
  const isLockup = variant.startsWith("lockup");

  if (isIcon) {
    // icon-light = mark on light surface (same mark); icon-dark same glyph on dark context
    return (
      <div className={className} style={{ display: "inline-flex", ...style }}>
        <IconMark size={size} />
      </div>
    );
  }

  if (isWord) {
    return (
      <div className={className} style={{ display: "inline-flex", flexDirection: "column", gap: 4, ...style }}>
        <Wordmark onDark={isDark} size={wordSize} />
        <svg width={Math.round(wordSize * 5.2)} height="8" viewBox="0 0 180 10" fill="none" aria-hidden>
          <path
            d="M2,6 C50,2 120,9 178,3"
            stroke={`url(#sfSwoosh-${isDark ? "d" : "l"})`}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id={`sfSwoosh-${isDark ? "d" : "l"}`} x1="0" y1="0" x2="180" y2="0">
              <stop stopColor={isDark ? "#3B6BE0" : "#2952CC"} />
              <stop offset="1" stopColor="#2FD9C9" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // lockup
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(8, Math.round(size * 0.28)),
        ...style,
      }}
    >
      <IconMark size={size} />
      <Wordmark onDark={isDark} size={wordSize} />
    </div>
  );
}

export { IconMark, Wordmark };
