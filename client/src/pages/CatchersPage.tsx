import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train, Phone, X, CheckCircle,
  Cat, Dog, MapPin, Camera, Send, MessageCircle
} from "lucide-react";
import PhoneLink from "@/components/PhoneLink";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Catcher } from "@shared/schema";
import { ThemeToggle } from "@/components/BottomNav";

/* ── Stars component ── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke="#f59e0b"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ── Equipment tags for catcher ── */
function EquipmentTags({ catcher }: { catcher: Catcher }) {
  return (
    <div className="flex flex-wrap gap-1">
      {catcher.hasNet && <span className="tag tag-teal">сочок</span>}
      {catcher.hasTrap && <span className="tag tag-teal">ловушка</span>}
      {catcher.hasCatTrap && <span className="tag tag-teal">котоловка</span>}
      {catcher.worksCats && <span className="tag tag-coral"><Cat size={10} /> кошки</span>}
      {catcher.worksDogs && <span className="tag tag-coral"><Dog size={10} /> собаки</span>}
    </div>
  );
}

/* ── Catch request bottom sheet ── */
function CatchSheet({
  catcher,
  onClose,
}: {
  catcher: Catcher;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [animalType, setAnimalType] = useState<"cat" | "dog">("cat");
  const [form, setForm] = useState({ address: "", clientName: "", clientPhone: "", description: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const photoRef = useState<HTMLInputElement | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const buildTelegramMessage = () => {
    const type = animalType === "cat" ? "Кошка/кот" : "Собака";
    const lines = [
      "🐾 НОВАЯ ЗАЯВКА НА ОТЛОВ — ПоводОК",
      "",
      `📍 Адрес: ${form.address}`,
      `🐱 Животное: ${type}`,
      `👤 Заявитель: ${form.clientName}`,
      `📞 Телефон: ${form.clientPhone}`,
    ];
    if (form.description) lines.push(`📝 Описание: ${form.description}`);
    lines.push("", "Отправлено через приложение ПоводОК");
    return lines.join("\n");
  };

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/catch-requests", data),
    onSuccess: () => setSubmitted(true),
    onError: () => toast({ title: "Ошибка", description: "Попробуйте ещё раз", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address || !form.clientName || !form.clientPhone) {
      toast({ title: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }
    mutation.mutate({
      catcherId: catcher.id,
      animalType,
      address: form.address,
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      description: form.description,
      createdAt: new Date().toISOString(),
    });
  };

  // Открыть Telegram с автосообщением ловцу
  const openTelegramWithMessage = () => {
    const msg = buildTelegramMessage();
    const encoded = encodeURIComponent(msg);
    const catcherPhone = catcher.phone.replace(/[^\d]/g, "");
    // Открываем Telegram с номером ловца и автозаполненным сообщением
    const tgUrl = `https://t.me/+${catcherPhone}?text=${encoded}`;
    window.open(tgUrl, "_blank");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[190]" onClick={onClose} />
      <div className="bottom-sheet" style={{ maxHeight: "90vh", overflowY: "auto" }} data-testid="catch-sheet">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-lg" style={{ color: "hsl(var(--foreground))" }}>Вызвать ловца</h3>
            <p className="text-xs text-muted-foreground">{catcher.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Тип животного */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">Тип животного</p>
              <div className="flex gap-2">
                {(["cat", "dog"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAnimalType(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                      animalType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {t === "cat" ? <><Cat size={16} /> Кошка</> : <><Dog size={16} /> Собака</>}
                  </button>
                ))}
              </div>
            </div>

            <input className="glass-input" placeholder="Адрес *" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <input className="glass-input" placeholder="Ваше имя *" value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
            <input className="glass-input" placeholder="Телефон *" type="tel" value={form.clientPhone}
              onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} />
            <textarea className="glass-input" placeholder="Описание ситуации (необязательно)"
              rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: "none" }} />

            {/* Фото животного */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">Фото животного (необязательно)</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="catch-photo"
                className="hidden"
                onChange={handlePhoto}
              />
              <label
                htmlFor="catch-photo"
                className="photo-upload-box"
                style={{ aspectRatio: "16/7", cursor: "pointer" }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <Camera size={24} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Сфотографировать или выбрать из галереи</span>
                  </>
                )}
              </label>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 pt-1">
              {/* Отправить заявку в БД */}
              <button
                type="submit"
                className="flex-1 gradient-primary text-white font-extrabold py-3 rounded-xl text-sm transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Отправляем..." : <><Send size={15} /> Отправить заявку</>}
              </button>
            </div>

            {/* Написать ловцу напрямую в Telegram */}
            <button
              type="button"
              onClick={openTelegramWithMessage}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-border bg-card transition-opacity hover:opacity-80"
              style={{ color: "hsl(174 70% 42%)" }}
            >
              <MessageCircle size={16} />
              Написать ловцу в Telegram
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Телефон ловца: <PhoneLink phone={catcher.phone} showIcon={true} />
            </p>
          </form>
        ) : (
          <div className="text-center py-6">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
            <p className="font-extrabold text-lg mb-1" style={{ color: "hsl(var(--foreground))" }}>Заявка отправлена!</p>
            <p className="text-sm text-muted-foreground mb-4">
              {catcher.name} получит вашу заявку и свяжется с вами.
            </p>
            {/* Дополнительно написать в Telegram */}
            <button
              onClick={openTelegramWithMessage}
              className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-border bg-card transition-opacity hover:opacity-80"
              style={{ color: "hsl(174 70% 42%)" }}
            >
              <MessageCircle size={16} />
              Написать ловцу в Telegram
            </button>
            <button onClick={onClose} className="gradient-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm">
              Закрыть
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Skeleton card ── */
function CatcherSkeleton() {
  return (
    <div className="service-card p-4">
      <div className="flex gap-3">
        <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ── Catcher card ── */
function CatcherCard({ catcher, onHire }: { catcher: Catcher; onHire: () => void }) {
  const serviceArea = (catcher as any).serviceArea;
  const serviceRadiusKm = (catcher as any).serviceRadiusKm;

  return (
    <div className="service-card p-4" data-testid={`catcher-card-${catcher.id}`}>
      <div className="flex gap-3">
        {/* Photo */}
        <div className="flex-shrink-0">
          {catcher.photoUrl ? (
            <img
              src={catcher.photoUrl}
              alt={catcher.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl gradient-primary flex items-center justify-center text-white text-2xl font-black">
              {catcher.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-extrabold text-white text-base leading-tight truncate">
              {catcher.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Train size={12} style={{ color: "hsl(174 70% 52%)" }} className="flex-shrink-0" />
            <span>{catcher.metro}</span>
          </div>

          {/* Service area */}
          {serviceArea && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <MapPin size={11} className="text-primary flex-shrink-0" />
              <span>
                Зона: {serviceArea}
                {serviceRadiusKm ? `, радиус ${serviceRadiusKm} км` : ""}
              </span>
            </div>
          )}

          <EquipmentTags catcher={catcher} />

          {/* Price badge */}
          <div className="mt-2 mb-2">
            {catcher.priceInMkad > 0 ? (
              <span className="tag tag-amber font-bold">💰 от {catcher.priceInMkad}₽</span>
            ) : (
              <span className="tag tag-green font-bold">💚 Бесплатно</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Stars rating={catcher.rating} />
              <span className="text-xs text-muted-foreground">({catcher.reviewCount})</span>
            </div>
            <button
              onClick={onHire}
              className="gradient-primary text-white font-extrabold text-xs px-4 py-1.5 rounded-full transition-opacity hover:opacity-90"
              data-testid={`btn-hire-${catcher.id}`}
            >
              Вызвать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function CatchersPage() {
  const [, navigate] = useHashLocation();
  const [metro, setMetro] = useState("");
  const [animalFilter, setAnimalFilter] = useState<"all" | "cat" | "dog">("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedCatcher, setSelectedCatcher] = useState<Catcher | null>(null);

  const { data: catchers = [], isLoading } = useQuery<Catcher[]>({
    queryKey: ["/api/catchers", metro, maxPrice],
    queryFn: () => {
      const params = new URLSearchParams();
      if (metro) params.set("metro", metro);
      if (maxPrice) params.set("maxPrice", String(maxPrice));
      return fetch(`${API_BASE}/api/catchers?${params}`).then((r) => r.json());
    },
  });

  const filtered = catchers.filter((c) => {
    if (animalFilter === "cat" && !c.worksCats) return false;
    if (animalFilter === "dog" && !c.worksDogs) return false;
    return true;
  });

  return (
    <div className="page" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      {/* Header */}
      <div className="app-header pr-14">
        <h1 className="text-xl font-black" style={{color:"hsl(var(--foreground))"}}>Ловцы</h1>
        <p className="text-xs" style={{color:"hsl(var(--muted-foreground))"}}>Найти специалиста по отлову</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Explanation card */}
        <div
          className="rounded-xl p-3.5"
          style={{
            background: "hsl(220 12% 14%)",
            border: "1px solid hsl(220 10% 20%)",
            borderLeft: "4px solid hsl(174 70% 42%)",
          }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ловцы — специалисты, которые профессионально помогают поймать бездомных
            кошек и собак для лечения, передержки или передачи в добрые руки.
            Они используют специальное оборудование и знают как не навредить животному.
          </p>
        </div>

        {/* Metro search */}
        <input
          className="glass-input"
          placeholder="🚇 Станция метро"
          value={metro}
          onChange={(e) => setMetro(e.target.value)}
          data-testid="input-metro"
        />

        {/* Filter chips */}
        <div className="filter-chips">
          {(["all", "cat", "dog"] as const).map((key) => (
            <button
              key={key}
              className={`filter-chip ${animalFilter === key ? "active" : ""}`}
              onClick={() => setAnimalFilter(key)}
              data-testid={`chip-animal-${key}`}
            >
              {key === "all" ? "Все" : key === "cat" ? "🐱 Кошки" : "🐶 Собаки"}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3 pb-4">
          {isLoading ? (
            <>
              <CatcherSkeleton />
              <CatcherSkeleton />
              <CatcherSkeleton />
            </>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 float">🪤</div>
              <p className="font-bold text-white mb-1">Ловцы не найдены</p>
              <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            filtered.map((catcher) => (
              <CatcherCard
                key={catcher.id}
                catcher={catcher}
                onHire={() => setSelectedCatcher(catcher)}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {selectedCatcher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CatchSheet
              catcher={selectedCatcher}
              onClose={() => setSelectedCatcher(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
