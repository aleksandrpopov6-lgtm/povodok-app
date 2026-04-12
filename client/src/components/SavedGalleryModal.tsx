import { useEffect, useRef } from "react";

const SAVED_CATS = [
  { name: "Лёвушка",        date: "Окт 2024",  location: "Марксистская",  photo: "https://povodok.pro/kotiki/levushka_e.jpg" },
  { name: "Феликс",         date: "Ноя 2024",  location: "Красногорск",   photo: "https://povodok.pro/kotiki/feliks.jpg" },
  { name: "Солнышко",       date: "Ноя 2024",  location: "пр. Жукова",    photo: "https://povodok.pro/kotiki/solnyshko.jpg" },
  { name: "Морковка",       date: "Дек 2024",  location: "Веерная ул.",   photo: "https://povodok.pro/kotiki/morkovka.jpg" },
  { name: "Гитлер",         date: "Ноя 2024",  location: "Марксистская",  photo: "https://povodok.pro/kotiki/gitler.jpg" },
  { name: "Макси",          date: "Дек 2024",  location: "у Магамеда",    photo: "https://povodok.pro/kotiki/maksi.jpg" },
  { name: "Линда",          date: "Дек 2024",  location: "Марьино",       photo: "https://povodok.pro/kotiki/linda.jpg" },
  { name: "Грета",          date: "Янв 2025",  location: "",              photo: "https://povodok.pro/kotiki/greta.jpg" },
  { name: "Линда (Домод.)", date: "Фев 2025",  location: "Домодедово",    photo: "https://povodok.pro/kotiki/linda_dom.jpg" },
  { name: "Малышка",        date: "Мар 2025",  location: "Островитянова", photo: "https://povodok.pro/kotiki/malysb_billie.jpg" },
  { name: "Билли",          date: "14.06.25",  location: "",              photo: "https://povodok.pro/kotiki/djeki_main.jpg" },
  { name: "Джеки",          date: "25.08.25",  location: "Балашиха",      photo: "https://povodok.pro/kotiki/djeki.jpg" },
  { name: "Линда мл.",      date: "05.10.25",  location: "Волгоградка",   photo: "https://povodok.pro/kotiki/linda_mlad.jpg" },
  { name: "Рысь",           date: "03.11.25",  location: "Курская",       photo: "https://povodok.pro/kotiki/rys.jpg" },
  { name: "Рис",            date: "Янв 2026",  location: "",              photo: "https://povodok.pro/kotiki/ris.jpg" },
  { name: "Коша",           date: "Ноя 2025",  location: "Химки",         photo: "https://povodok.pro/kotiki/kosha.jpg" },
  { name: "Чернышевский",   date: "Янв 2026",  location: "Химки",         photo: "https://povodok.pro/kotiki/chernyshevsky.jpg" },
  { name: "Симба",          date: "2025",      location: "",              photo: "https://povodok.pro/kotiki/simba.jpg" },
];

interface SavedGalleryModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SavedGalleryModal({ open, onClose }: SavedGalleryModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Animate slide-up on open
  useEffect(() => {
    if (!sheetRef.current) return;
    if (open) {
      sheetRef.current.style.transform = "translateY(100%)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";
            sheetRef.current.style.transform = "translateY(0%)";
          }
        });
      });
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
        sheetRef.current.style.transform = "translateY(100%)";
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 299,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 300,
          height: "80vh",
          background: "hsl(var(--card))",
          borderRadius: "1.5rem 1.5rem 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: "translateY(100%)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1rem 0.75rem",
          borderBottom: "1px solid hsl(var(--border))",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "hsl(var(--foreground))",
          }}>
            🐾 27 спасённых питомцев
          </span>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              background: "hsl(var(--muted))",
              border: "none",
              borderRadius: "50%",
              width: "2rem",
              height: "2rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "hsl(var(--foreground))",
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable grid */}
        <div style={{
          overflowY: "auto",
          flex: 1,
          padding: "0.75rem",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.5rem",
          }}>
            {SAVED_CATS.map((cat, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <img
                  src={cat.photo}
                  alt={cat.name}
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
                <div style={{ padding: "0.35rem 0.4rem 0.4rem" }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "hsl(var(--foreground))",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {cat.name}
                  </div>
                  <div style={{
                    fontSize: "0.6rem",
                    color: "hsl(var(--muted-foreground))",
                    marginTop: "0.1rem",
                  }}>
                    {cat.date}
                    {cat.location ? ` · ${cat.location}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
