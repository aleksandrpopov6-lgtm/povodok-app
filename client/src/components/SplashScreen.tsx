import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

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
          {/* Лого — актуальный логотип из аватарки */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={logoUrl}
              alt="ПоводОК"
              style={{
                width: 180,
                height: 180,
                borderRadius: "2rem",
                objectFit: "cover",
                boxShadow: "0 0 60px rgba(240,72,92,0.3), 0 0 120px rgba(238,95,162,0.15)",
              }}
            />
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
