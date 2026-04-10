import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400); // ждём анимацию ухода
    }, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#1A1A1F",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          {/* Лого — большая лапка */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg width="120" height="120" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <linearGradient id="splashGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EE5FA2"/>
                  <stop offset="1" stopColor="#F0485C"/>
                </linearGradient>
              </defs>
              {/* Glow circle */}
              <circle cx="20" cy="20" r="18" fill="url(#splashGrad)" opacity="0.12" filter="url(#glow)"/>
              {/* 3 пальчиковых подушечки */}
              <ellipse cx="12.5" cy="12.5" rx="3.8" ry="4.6" fill="url(#splashGrad)" opacity="0.9"/>
              <ellipse cx="20" cy="10.5" rx="3.5" ry="4.3" fill="url(#splashGrad)" opacity="0.9"/>
              <ellipse cx="27.5" cy="12.5" rx="3.8" ry="4.6" fill="url(#splashGrad)" opacity="0.9"/>
              {/* Большая подушечка */}
              <path d="M20 18.5C14 18.5 10 22 10 26.5C10 30.5 13.5 33 20 33C26.5 33 30 30.5 30 26.5C30 22 26 18.5 20 18.5Z" fill="url(#splashGrad)" opacity="0.9"/>
              {/* Контур — неоновый эффект */}
              <ellipse cx="12.5" cy="12.5" rx="3.8" ry="4.6" fill="none" stroke="#F0485C" strokeWidth="0.6" opacity="0.6"/>
              <ellipse cx="20" cy="10.5" rx="3.5" ry="4.3" fill="none" stroke="#F0485C" strokeWidth="0.6" opacity="0.6"/>
              <ellipse cx="27.5" cy="12.5" rx="3.8" ry="4.6" fill="none" stroke="#F0485C" strokeWidth="0.6" opacity="0.6"/>
              <path d="M20 18.5C14 18.5 10 22 10 26.5C10 30.5 13.5 33 20 33C26.5 33 30 30.5 30 26.5C30 22 26 18.5 20 18.5Z" fill="none" stroke="#F0485C" strokeWidth="0.6" opacity="0.6"/>
            </svg>
          </motion.div>

          {/* Название */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center" }}
          >
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900,
              fontSize: "2.8rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              <span style={{ color: "white" }}>Повод</span>
              <span style={{
                background: "linear-gradient(135deg, #EE5FA2, #F0485C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>ОК</span>
            </div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "0.85rem",
              color: "#666",
              marginTop: "0.4rem",
              letterSpacing: "0.04em",
            }}>
              Платформа помощи животным
            </div>
          </motion.div>

          {/* Точки загрузки */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: "flex", gap: "6px", marginTop: "1rem" }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#F0485C" }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
