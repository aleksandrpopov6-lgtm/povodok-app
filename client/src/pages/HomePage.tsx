import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { Heart, MapPin, Cat, Dog, Video, UtensilsCrossed, Home as HomeIcon, Stethoscope, RefreshCw, Plus, X, ArrowLeft, ImagePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CatPawLogo, { BrandName } from "@/components/CatPawLogo";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/components/ThemeProvider";
import type { Animal } from "@shared/schema";
import SavedGalleryModal from "@/components/SavedGalleryModal";

/* ── Animated counter hook ──────────────────────────────────────── */
function useCountUp(from: number, to: number, stepMs: number) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    let current = from;
    setValue(from);
    const id = setInterval(() => {
      current += 1;
      setValue(current);
      if (current >= to) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
  }, [from, to, stepMs]);
  return value;
}

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

/* ── Add Animal Form ──────────────────────────────────────────── */
function AddAnimalForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", type: "cat" as "cat" | "dog" | "other",
    age: "", location: "", description: "", story: "",
    needsFood: false, needsShelter: false, needsMedical: false, needsHome: true,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      toast({ title: "Животное добавлено в ленту!" });
      onClose();
    },
    onError: () => toast({ title: "Ошибка", description: "Не удалось добавить", variant: "destructive" }),
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.slice(0, 3 - photos.length).map(f => URL.createObjectURL(f));
    setPhotos(p => [...p, ...urls]);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.description) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" }); return;
    }
    mutation.mutate({
      name: form.name, type: form.type, age: form.age,
      location: form.location, description: form.description,
      story: form.story || null,
      photoUrl: photos[0] || "https://placekitten.com/400/400",
      status: "needs_help",
      needsFood: form.needsFood, needsShelter: form.needsShelter,
      needsMedical: form.needsMedical, needsHome: form.needsHome,
      foundDate: new Date().toISOString().split("T")[0],
      authorId: user?.id || null,
    });
  };

  const inputStyle = {
    width: "100%", padding: "0.65rem 0.75rem",
    background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem", color: "hsl(var(--foreground))",
    fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
  } as React.CSSProperties;

  const labelStyle = { fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: "0.35rem" } as React.CSSProperties;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "hsl(var(--background))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", borderBottom: "1px solid hsl(var(--border))", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: "0.25rem" }}>
          <ArrowLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "hsl(var(--foreground))", margin: 0 }}>
          Добавить животное в ленту
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "2rem" }}>

        {/* Фото */}
        <div>
          <label style={labelStyle}>Фото (до 3 штук)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
            {photos.map((src, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "0.75rem", overflow: "hidden" }}>
                <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                <button type="button" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: "0.25rem", right: "0.25rem", background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: "20px", height: "20px", color: "white", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
                {i === 0 && <div style={{ position: "absolute", bottom: "0.25rem", left: "0.25rem", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.5rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "9999px" }}>главное</div>}
              </div>
            ))}
            {photos.length < 3 && (
              <label style={{ aspectRatio: "1/1", borderRadius: "0.75rem", border: "2px dashed hsl(var(--border))", background: "hsl(var(--secondary))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.3rem", cursor: "pointer" }}>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} style={{ display: "none" }} />
                <ImagePlus size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{photos.length === 0 ? "Добавить" : "Ещё"}</span>
              </label>
            )}
          </div>
        </div>

        {/* Имя */}
        <div>
          <label style={labelStyle}>Имя животного *</label>
          <input style={inputStyle} placeholder="Мурка, Барсик..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>

        {/* Тип */}
        <div>
          <label style={labelStyle}>Вид</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["cat", "dog", "other"] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                style={{ flex: 1, padding: "0.5rem", borderRadius: "0.75rem", border: `1.5px solid ${form.type === t ? "hsl(var(--primary))" : "hsl(var(--border))"}`, background: form.type === t ? "hsl(var(--primary) / 0.12)" : "hsl(var(--secondary))", color: form.type === t ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                {t === "cat" ? "🐱 Кошка" : t === "dog" ? "🐶 Собака" : "Другое"}
              </button>
            ))}
          </div>
        </div>

        {/* Возраст и район */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Возраст</label>
            <input style={inputStyle} placeholder="котёнок / 2 года" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Район *</label>
            <input style={inputStyle} placeholder="Москва, Бутово" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
        </div>

        {/* Описание */}
        <div>
          <label style={labelStyle}>Описание *</label>
          <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Характер, особенности..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>

        {/* Нужды */}
        <div>
          <label style={labelStyle}>Нужна помощь</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {([
              ["needsHome",    "🏠 Дом"],
              ["needsFood",    "🍽 Корм"],
              ["needsShelter", "🏡 Домик"],
              ["needsMedical", "💊 Лечение"],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
                style={{ padding: "0.35rem 0.85rem", borderRadius: "9999px", border: `1.5px solid ${(form as any)[key] ? "hsl(var(--primary))" : "hsl(var(--border))"}`, background: (form as any)[key] ? "hsl(var(--primary) / 0.12)" : "hsl(var(--secondary))", color: (form as any)[key] ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка */}
        <button type="submit" disabled={mutation.isPending}
          style={{ width: "100%", padding: "0.85rem", borderRadius: "0.875rem", border: "none", background: "linear-gradient(135deg, #EE5FA2, #F0485C)", color: "white", fontWeight: 800, fontSize: "1rem", cursor: "pointer", opacity: mutation.isPending ? 0.6 : 1 }}>
          {mutation.isPending ? "Публикуем..." : "Опубликовать в ленте"}
        </button>
      </form>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function HomePage() {
  const [filter, setFilter] = useState<"all" | "cat" | "dog" | "needs_help">("all");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { user } = useUser();
  const savedCount = useCountUp(10, 27, 80);
  const canAdd = user?.role === "admin" || user?.role === "volunteer";

  const { data: allAnimals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const { data: stats } = useQuery<{ total: number; needsHelp: number; rehomed: number; saved: number }>({
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
      {/* Keyframe для пульсации рамки */}
      <style>{`
        @keyframes savedPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(240,72,92,0.35); border-color: #F0485C; }
          50% { box-shadow: 0 0 0 5px rgba(240,72,92,0); border-color: #ff6b7a; }
        }
      `}</style>

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
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {canAdd && (
              <button
                onClick={() => setAddOpen(true)}
                data-testid="fab-add-animal"
                style={{
                  display: "flex", alignItems: "center", gap: "0.3rem",
                  background: "linear-gradient(135deg, #EE5FA2, #F0485C)",
                  border: "none", borderRadius: "9999px",
                  padding: "0.3rem 0.75rem 0.3rem 0.5rem",
                  color: "white", fontWeight: 800, fontSize: "0.78rem",
                  cursor: "pointer", boxShadow: "0 2px 10px rgba(240,72,92,0.35)",
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
                Добавить
              </button>
            )}
          </div>
        </div>

        {/* Статистика */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.75rem" }}>
            {/* Кликабельная плитка "Спасено" с анимированным счётчиком */}
            <div
              onClick={() => setGalleryOpen(true)}
              style={{
                background: "hsl(var(--card))",
                border: "2px solid #F0485C",
                borderRadius: "0.75rem",
                padding: "0.4rem 0.5rem",
                textAlign: "center",
                cursor: "pointer",
                animation: "savedPulse 1.8s ease-in-out infinite",
                userSelect: "none",
              }}
            >
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#F0485C", lineHeight: 1 }}>{savedCount}</div>
              <div style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>Спасено</div>
            </div>

            {/* Остальные плитки */}
            {[
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

      {/* Галерея пристроенных питомцев */}
      <SavedGalleryModal open={galleryOpen} onClose={() => setGalleryOpen(false)} />

      {/* Форма добавления животного */}
      {addOpen && <AddAnimalForm onClose={() => setAddOpen(false)} />}
    </div>
  );
}
