import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { Heart, MapPin, Cat, Dog, Video, UtensilsCrossed, Home as HomeIcon, Stethoscope, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CatPawLogo, { BrandName } from "@/components/CatPawLogo";
import type { Animal } from "@shared/schema";

/* ── Animal card — шахматная сетка ─────────────────────────── */
function AnimalCard({ animal }: { animal: Animal }) {
  const [, navigate] = useHashLocation();

  const needIcons = [
    animal.needsFood    && { icon: UtensilsCrossed, label: "Корм" },
    animal.needsShelter && { icon: HomeIcon,         label: "Домик" },
    animal.needsMedical && { icon: Stethoscope,      label: "Лечение" },
    animal.needsHome    && { icon: Heart,             label: "Дом" },
  ].filter(Boolean) as { icon: React.ElementType; label: string }[];

  return (
    <div
      onClick={() => navigate(`/animal/${animal.id}`)}
      data-testid={`card-animal-${animal.id}`}
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "1.25rem",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.18)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Фото */}
      <div style={{ position: "relative" }}>
        <img
          src={animal.photoUrl}
          alt={animal.name}
          loading="lazy"
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
        />
        {/* Статус бейдж */}
        <div style={{
          position: "absolute", top: "0.5rem", left: "0.5rem",
          background: animal.status === "rehomed" ? "hsl(142 50% 38% / 0.9)" : "hsl(var(--primary) / 0.9)",
          color: "white", fontSize: "0.65rem", fontWeight: 800,
          padding: "0.2rem 0.55rem", borderRadius: "9999px",
          backdropFilter: "blur(4px)",
        }}>
          {animal.status === "rehomed" ? "✓ Пристроен" : "Ищет дом"}
        </div>
        {/* Видео бейдж */}
        {animal.videoUrl && (
          <div style={{
            position: "absolute", top: "0.5rem", right: "0.5rem",
            background: "rgba(0,0,0,0.55)", color: "white",
            fontSize: "0.6rem", fontWeight: 700,
            padding: "0.2rem 0.5rem", borderRadius: "9999px",
            display: "flex", alignItems: "center", gap: "0.25rem",
          }}>
            <Video size={10} />Видео
          </div>
        )}
        {/* Тип животного */}
        <div style={{
          position: "absolute", bottom: "0.5rem", right: "0.5rem",
          background: "rgba(0,0,0,0.45)", color: "white",
          borderRadius: "50%", padding: "0.3rem",
          backdropFilter: "blur(4px)",
        }}>
          {animal.type === "cat"
            ? <Cat size={14} strokeWidth={2} />
            : <Dog size={14} strokeWidth={2} />}
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding: "0.65rem 0.75rem 0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: "0.95rem",
            color: "hsl(var(--foreground))",
          }}>{animal.name}</span>
          <span style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>{animal.age}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}>
          <MapPin size={11} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {animal.location}
          </span>
        </div>

        {/* Потребности */}
        {needIcons.length > 0 && animal.status !== "rehomed" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {needIcons.slice(0, 3).map(({ icon: Icon, label }) => (
              <span key={label} style={{
                display: "inline-flex", alignItems: "center", gap: "0.2rem",
                background: "hsl(var(--primary) / 0.1)",
                color: "hsl(var(--primary))",
                fontSize: "0.65rem", fontWeight: 700,
                padding: "0.18rem 0.5rem", borderRadius: "9999px",
              }}>
                <Icon size={10} />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton card ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: "1.25rem", overflow: "hidden", border: "1px solid hsl(var(--border))" }}>
      <div className="skeleton" style={{ width: "100%", aspectRatio: "1/1" }} />
      <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton" style={{ height: "1rem", borderRadius: "0.5rem", width: "60%" }} />
        <div className="skeleton" style={{ height: "0.75rem", borderRadius: "0.5rem", width: "80%" }} />
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function HomePage() {
  const [filter, setFilter] = useState<"all" | "cat" | "dog" | "needs_help">("all");

  const { data: allAnimals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const { data: stats } = useQuery<{ total: number; needsHelp: number; rehomed: number }>({
    queryKey: ["/api/stats"],
  });

  const animals = allAnimals.filter(a => {
    if (filter === "cat") return a.type === "cat";
    if (filter === "dog") return a.type === "dog";
    if (filter === "needs_help") return a.status === "needs_help";
    return true;
  });

  return (
    <div className="page" style={{ paddingBottom: "6rem" }}>
      {/* Header */}
      <div className="app-header" style={{ paddingRight: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <CatPawLogo size={32} />
          <div>
            <BrandName size="text-base" />
            <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", margin: 0 }}>
              Помоги питомцу
            </p>
          </div>
          {stats && (
            <div style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: "0.3rem",
              background: "hsl(142 50% 38% / 0.12)",
              borderRadius: "9999px", padding: "0.25rem 0.7rem",
            }}>
              <Heart size={13} style={{ color: "hsl(142 50% 45%)", fill: "hsl(142 50% 45%)" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "hsl(142 50% 45%)" }}>
                {stats.rehomed} пристроено
              </span>
            </div>
          )}
        </div>

        {/* Статистика */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.75rem" }}>
            {[
              { label: "Спасено", value: stats.total, color: "hsl(var(--foreground))" },
              { label: "Ждут дом", value: stats.needsHelp, color: "hsl(var(--primary))" },
              { label: "Пристроены", value: stats.rehomed, color: "hsl(142 50% 45%)" },
            ].map(s => (
              <div key={s.label} style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                padding: "0.4rem 0.5rem",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Фильтры */}
        <div className="filter-chips">
          {([
            ["all",        "Все"],
            ["needs_help", "Ждут помощи"],
            ["cat",        "🐱 Кошки"],
            ["dog",        "🐶 Собаки"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              className={`filter-chip ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
              data-testid={`chip-filter-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Шахматная сетка */}
      <div style={{ padding: "0.75rem 0.875rem 0" }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : animals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "hsl(var(--muted-foreground))" }}>
            <div className="float" style={{ fontSize: "3rem", marginBottom: "1rem" }}>🐾</div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "hsl(var(--foreground))" }}>Нет животных</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Попробуй другой фильтр</p>
            <button
              onClick={() => setFilter("all")}
              style={{
                marginTop: "1.5rem",
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "hsl(var(--primary))", color: "white",
                border: "none", borderRadius: "9999px",
                padding: "0.65rem 1.5rem", fontWeight: 700, cursor: "pointer",
              }}
            >
              <RefreshCw size={16} /> Показать всех
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {animals.map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
