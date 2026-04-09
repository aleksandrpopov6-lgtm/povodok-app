import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, X, MapPin, Cat, Dog, Moon, Sun, RefreshCw, UtensilsCrossed, Home as HomeIcon, Stethoscope, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/ThemeProvider";
import CatPawLogo, { BrandName } from "@/components/CatPawLogo";
import type { Animal } from "@shared/schema";

/* ── Single swipeable card ─────────────────────────────────── */
function SwipeCard({
  animal,
  onSwipe,
  isTop,
  stackIndex,
}: {
  animal: Animal;
  onSwipe: (dir: "left" | "right") => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const [, navigate] = useHashLocation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-22, 22]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);
  const cardOpacity = useTransform(x, [-300, 0, 300], [0, 1, 0]);

  const needs = [
    animal.needsFood && { label: "Корм", icon: UtensilsCrossed },
    animal.needsShelter && { label: "Домик", icon: HomeIcon },
    animal.needsMedical && { label: "Лечение", icon: Stethoscope },
    animal.needsHome && { label: "Дом", icon: Heart },
  ].filter(Boolean) as { label: string; icon: React.ElementType }[];

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 90) onSwipe("right");
    else if (info.offset.x < -90) onSwipe("left");
  };

  // Stack depth visual effect
  const scale = isTop ? 1 : Math.max(0.92 - stackIndex * 0.04, 0.84);
  const yOffset = isTop ? 0 : stackIndex * 10;

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? cardOpacity : 1,
        scale,
        y: yOffset,
        zIndex: 20 - stackIndex,
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        originY: 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={{ scale, y: yOffset }}
      transition={{ type: "spring", damping: 28, stiffness: 200 }}
    >
      <div className="w-full h-full bg-card rounded-2xl overflow-hidden shadow-xl border border-border relative select-none">
        {/* Photo */}
        <img
          src={animal.photoUrl}
          alt={animal.name}
          className="w-full h-full object-cover absolute inset-0"
          draggable={false}
        />

        {/* ПОМОГУ stamp */}
        <motion.div className="stamp-like" style={{ opacity: likeOpacity }}>
          Помогу!
        </motion.div>

        {/* ПРОПУЩУ stamp */}
        <motion.div className="stamp-nope" style={{ opacity: nopeOpacity }}>
          Пропустить
        </motion.div>

        {/* Bottom info overlay */}
        <div className="card-overlay">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-2xl font-black text-white leading-tight">{animal.name}</h2>
                {animal.type === "cat"
                  ? <Cat size={20} className="text-white/80" />
                  : <Dog size={20} className="text-white/80" />}
                <span className="text-sm text-white/75 font-medium">{animal.age}</span>
              </div>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin size={12} />
                <span>{animal.location}</span>
              </div>
            </div>
          </div>

          {/* Needs */}
          {needs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {needs.map(({ label, icon: Icon }) => (
                <span key={label} className="flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/25">
                  <Icon size={11} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Video badge */}
        {animal.videoUrl && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-full pointer-events-none">
            <Video size={12} />
            <span>Видео</span>
          </div>
        )}

        {/* Tap to open details — visible hint */}
        {isTop && (
          <button
            className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full"
            onClick={() => navigate(`/animal/${animal.id}`)}
            data-testid={`btn-open-${animal.id}`}
          >
            Подробнее →
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function HomePage() {
  const { theme, toggle } = useTheme();
  const [, navigate] = useHashLocation();
  const [filter, setFilter] = useState<"all" | "cat" | "dog">("all");
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [likeAnim, setLikeAnim] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);

  const { data: allAnimals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const { data: stats } = useQuery<{ total: number; needsHelp: number; rehomed: number }>({
    queryKey: ["/api/stats"],
  });

  const animals = allAnimals
    .filter(a => a.status === "needs_help")
    .filter(a => filter === "all" || a.type === filter)
    .filter(a => !dismissed.has(a.id));

  const handleSwipe = (dir: "left" | "right", animal: Animal) => {
    if (dir === "right") {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
      // go to animal detail after swipe right
      setTimeout(() => navigate(`/animal/${animal.id}`), 350);
    } else {
      setSkipAnim(true);
      setTimeout(() => setSkipAnim(false), 400);
    }
    setDismissed(d => new Set(Array.from(d).concat(animal.id)));
  };

  const handleReset = () => setDismissed(new Set());

  // Button triggers
  const handleLike = () => {
    if (animals.length === 0) return;
    handleSwipe("right", animals[0]);
  };
  const handleSkip = () => {
    if (animals.length === 0) return;
    handleSwipe("left", animals[0]);
  };

  return (
    <div className="page-content max-w-lg mx-auto flex flex-col h-screen">
      {/* Header */}
      <div className="flex-none px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <CatPawLogo size={36} />
            <div>
              <BrandName size="text-lg" />
              <p className="text-xs text-muted-foreground">Помоги питомцу</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats && (
              <div className="flex items-center gap-1.5 bg-accent/12 px-3 py-1.5 rounded-full">
                <Heart size={13} className="text-accent fill-accent" />
                <span className="text-xs font-bold text-accent">{stats.rehomed} пристроено</span>
              </div>
            )}
            <button onClick={toggle} className="p-2 rounded-full hover:bg-muted transition-colors" data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun size={17} className="text-muted-foreground" /> : <Moon size={17} className="text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-chips">
          {([["all", "Все"], ["cat", "🐱 Кошки"], ["dog", "🐶 Собаки"]] as const).map(([key, label]) => (
            <button
              key={key}
              className={`chip ${filter === key ? "active" : ""}`}
              onClick={() => { setFilter(key); setDismissed(new Set()); }}
              data-testid={`chip-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative px-4 py-2">
        {isLoading ? (
          <div className="w-full h-full rounded-2xl overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        ) : animals.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
            <div className="bounce-paw text-5xl">🐾</div>
            <p className="font-extrabold text-lg text-foreground">Посмотрели всех!</p>
            <p className="text-sm text-muted-foreground">Ты просмотрела всех животных,<br/>которые сейчас ищут помощь</p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-primary/90 transition-colors"
              data-testid="button-reset"
            >
              <RefreshCw size={16} />
              Посмотреть снова
            </button>
          </div>
        ) : (
          <div className="swipe-stack">
            {/* Render up to 3 cards, back to front */}
            {[...animals].reverse().slice(0, 3).reverse().map((animal, i) => (
              <SwipeCard
                key={animal.id}
                animal={animal}
                isTop={i === 0}
                stackIndex={i}
                onSwipe={(dir) => handleSwipe(dir, animal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isLoading && animals.length > 0 && (
        <div className="flex-none flex items-center justify-center gap-8 pb-24 pt-3">
          {/* Skip */}
          <motion.button
            className="action-btn btn-skip"
            onClick={handleSkip}
            animate={skipAnim ? { scale: [1, 0.88, 1.05, 1] } : {}}
            transition={{ duration: 0.35 }}
            aria-label="Пропустить"
            data-testid="button-skip"
          >
            <X size={26} strokeWidth={2.5} />
          </motion.button>

          {/* Like / Помочь */}
          <motion.button
            className="action-btn btn-like"
            onClick={handleLike}
            animate={likeAnim ? { scale: [1, 1.22, 0.95, 1.1, 1] } : {}}
            transition={{ duration: 0.45 }}
            aria-label="Помочь"
            data-testid="button-like"
          >
            <Heart size={32} strokeWidth={2} className={likeAnim ? "fill-white" : ""} />
          </motion.button>
        </div>
      )}

      {/* Tip on first load */}
      {!isLoading && animals.length > 0 && (
        <p className="flex-none text-center text-xs text-muted-foreground pb-20 -mt-1">
          Листай влево, чтобы пропустить · ❤️ чтобы помочь
        </p>
      )}
    </div>
  );
}
