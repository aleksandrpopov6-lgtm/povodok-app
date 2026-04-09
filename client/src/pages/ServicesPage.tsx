import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train, Star, Phone, Clock, ArrowLeft, MapPin,
  Globe, Navigation, ChevronRight, X, CheckCircle
} from "lucide-react";
import { apiRequest, queryClient, API_BASE } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Boarding, Clinic } from "@shared/schema";
import { ThemeToggle } from "@/components/BottomNav";

/* ── Stars ── */
function Stars({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="stars flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={s <= (interactive ? hovered || rating : Math.round(rating)) ? "#f59e0b" : "none"}
          stroke="#f59e0b"
          strokeWidth="2"
          className={interactive ? "cursor-pointer" : ""}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(s)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ── Skeleton ── */
function CardSkeleton() {
  return (
    <div className="service-card">
      <div className="skeleton w-full h-20 rounded-t-xl" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-8 w-24 rounded" />
      </div>
    </div>
  );
}

/* ── Boarding type label ── */
function boardingTypeLabel(type: string) {
  if (type === "shelter") return { label: "Приют", cls: "tag-purple" };
  if (type === "hospital_ward") return { label: "Стационар", cls: "tag-teal" };
  return { label: "Передержка", cls: "tag-teal" };
}

/* ── Safe JSON parse helper ── */
function safeParseJSON<T>(value: any): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(value); } catch { return null; }
}

/* ── Review form ── */
function ReviewForm({ entityType, entityId, onDone }: { entityType: "boarding" | "clinic"; entityId: number; onDone: () => void }) {
  const { toast } = useToast();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boardings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({ title: "Отзыв отправлен!" });
      onDone();
    },
    onError: () => toast({ title: "Ошибка", description: "Не удалось отправить отзыв", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) { toast({ title: "Выберите оценку", variant: "destructive" }); return; }
    if (!reviewerName) { toast({ title: "Укажите имя", variant: "destructive" }); return; }
    mutation.mutate({ entityType, entityId, rating: stars, comment, reviewerName, createdAt: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-xl border border-border space-y-3" style={{ background: "hsl(220 12% 10%)" }}>
      <h4 className="font-bold text-sm text-white">Оставить отзыв</h4>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Ваша оценка</p>
        <Stars rating={stars} interactive onRate={setStars} />
      </div>
      <input
        className="glass-input"
        placeholder="Ваше имя *"
        value={reviewerName}
        onChange={e => setReviewerName(e.target.value)}
        data-testid="input-reviewer-name"
      />
      <textarea
        className="glass-input"
        placeholder="Комментарий (необязательно)"
        rows={2}
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ resize: "none" }}
        data-testid="input-review-comment"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 py-2 rounded-xl border border-border text-muted-foreground text-sm font-semibold"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="flex-1 gradient-primary text-white font-bold py-2 rounded-xl text-sm"
          disabled={mutation.isPending}
          data-testid="btn-submit-review"
        >
          {mutation.isPending ? "Отправляем..." : "Отправить"}
        </button>
      </div>
    </form>
  );
}

/* ── Photo carousel ── */
function PhotoCarousel({ photos, singleUrl, name }: { photos: string[] | null; singleUrl?: string; name: string }) {
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const list = photos && photos.length > 0 ? photos : singleUrl ? [singleUrl] : [];
  if (list.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto flex gap-2 pb-1 -mx-4 px-4 mb-4" style={{ scrollbarWidth: "none" }}>
        {list.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${name} фото ${i + 1}`}
            className="flex-shrink-0 w-64 aspect-video object-cover rounded-xl cursor-pointer"
            onClick={() => setFullscreen(url)}
          />
        ))}
      </div>
      {fullscreen && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          onClick={() => setFullscreen(null)}
        >
          <img src={fullscreen} alt="fullscreen" className="max-w-full max-h-full rounded-xl" />
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white"
            onClick={() => setFullscreen(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  );
}

/* ── Boarding detail ── */
function BoardingDetail({ boarding, onBack }: { boarding: Boarding; onBack: () => void }) {
  const [showReview, setShowReview] = useState(false);
  const typeInfo = boardingTypeLabel(boarding.type);
  const photos = safeParseJSON<string[]>((boarding as any).photos);
  const services = safeParseJSON<{ name: string; price: number }[]>((boarding as any).services);
  const paymentMethods = safeParseJSON<string[]>((boarding as any).paymentMethods);

  const mapsUrl = (boarding as any).yandexMapsLink ||
    `https://yandex.ru/maps/?text=${encodeURIComponent(boarding.address || boarding.name)}`;

  return (
    <div className="page">
      {/* Header */}
      <div className="app-header flex items-center gap-3 pr-14">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" data-testid="btn-back-detail">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-base font-black text-white truncate flex-1">{boarding.name}</h1>
      </div>

      <div className="px-4 pt-2 pb-8 space-y-5">
        {/* Photo carousel */}
        <PhotoCarousel photos={photos} singleUrl={boarding.photoUrl ?? undefined} name={boarding.name} />

        {/* Name + badges */}
        <div>
          <h1 className="text-2xl font-black text-white mb-1.5">{boarding.name}</h1>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={`tag ${typeInfo.cls}`}>{typeInfo.label}</span>
            {boarding.acceptsWild && <span className="tag tag-coral">Дикие ✓</span>}
            {boarding.hasIsolationBox && <span className="tag tag-amber">Бокс для инфекц.</span>}
            {boarding.acceptsCats && <span className="tag tag-muted">🐱 Кошки</span>}
            {boarding.acceptsDogs && <span className="tag tag-muted">🐶 Собаки</span>}
          </div>
          {boarding.metro && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Train size={14} style={{ color: "hsl(174 70% 52%)" }} />
              <span>{boarding.metro}</span>
            </div>
          )}
        </div>

        {/* Rating + review */}
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Stars rating={boarding.rating} />
            <span className="text-sm text-muted-foreground">({boarding.reviewCount} отзывов)</span>
          </div>
          <button
            onClick={() => setShowReview(!showReview)}
            className="text-xs font-bold text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
            data-testid="btn-leave-review"
          >
            Оставить отзыв
          </button>
        </div>
        {showReview && (
          <ReviewForm entityType="boarding" entityId={boarding.id} onDone={() => setShowReview(false)} />
        )}

        {/* Description */}
        {boarding.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{boarding.description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {boarding.address && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-xl p-3 flex items-start gap-2 hover:bg-white/5 transition-colors col-span-2"
              data-testid="link-boarding-address"
            >
              <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Адрес</p>
                <p className="text-sm font-semibold text-white">{boarding.address}</p>
              </div>
            </a>
          )}
          {boarding.metro && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Train size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Метро</p>
                <p className="text-sm font-semibold text-white">{boarding.metro}</p>
              </div>
            </div>
          )}
          {boarding.workingHours && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Clock size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Режим работы</p>
                <p className="text-sm font-semibold text-white">{boarding.workingHours}</p>
              </div>
            </div>
          )}
          {(boarding as any).website && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Globe size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Сайт</p>
                <a href={(boarding as any).website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline">
                  Открыть
                </a>
              </div>
            </div>
          )}
          {boarding.phone && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Phone size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Телефон</p>
                <a href={`tel:${boarding.phone}`} className="text-sm font-semibold text-primary">
                  {boarding.phone}
                </a>
              </div>
            </div>
          )}
          {(boarding as any).inn && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">ИНН</p>
                <p className="text-sm font-semibold text-white">{(boarding as any).inn}</p>
              </div>
            </div>
          )}
          {/* Capacity / slots */}
          {boarding.availableSlots !== null && boarding.availableSlots !== undefined && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Свободных мест</p>
                <p className="text-sm font-semibold text-green-400">{boarding.availableSlots}</p>
              </div>
            </div>
          )}
          {/* Price */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
            <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Цена / сут</p>
              <p className="text-sm font-extrabold gradient-primary-text">{boarding.pricePerDay.toLocaleString("ru-RU")}₽</p>
            </div>
          </div>
        </div>

        {/* Build route button */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full gradient-primary text-white font-extrabold py-3.5 rounded-xl transition-opacity hover:opacity-90"
          data-testid="btn-route-boarding"
        >
          <Navigation size={16} />
          Построить маршрут
        </a>

        {/* Services table */}
        {services && services.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2">Услуги</h3>
            <div className="rounded-xl overflow-hidden border border-border">
              {services.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-card" : "bg-card/50"}`}
                >
                  <span className="text-white">{s.name}</span>
                  <span className="font-bold text-primary">{s.price.toLocaleString("ru-RU")}₽</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment methods */}
        {paymentMethods && paymentMethods.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2">Способы оплаты</h3>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.map((pm, i) => (
                <span key={i} className="tag tag-teal">{pm}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Clinic detail ── */
function ClinicDetail({ clinic, onBack }: { clinic: Clinic; onBack: () => void }) {
  const [showReview, setShowReview] = useState(false);
  const photos = safeParseJSON<string[]>((clinic as any).photos);
  const services = safeParseJSON<{ name: string; price: number }[]>((clinic as any).services);
  const paymentMethods = safeParseJSON<string[]>((clinic as any).paymentMethods);

  const mapsUrl = (clinic as any).yandexMapsLink ||
    `https://yandex.ru/maps/?text=${encodeURIComponent((clinic as any).address || clinic.name)}`;

  return (
    <div className="page">
      <div className="app-header flex items-center gap-3 pr-14">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" data-testid="btn-back-clinic-detail">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-base font-black text-white truncate flex-1">{clinic.name}</h1>
      </div>

      <div className="px-4 pt-2 pb-8 space-y-5">
        {/* Photo carousel */}
        <PhotoCarousel photos={photos} singleUrl={clinic.photoUrl ?? undefined} name={clinic.name} />

        {/* Name + badges */}
        <div>
          <h1 className="text-2xl font-black text-white mb-1.5">{clinic.name}</h1>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {clinic.worksWithWild && <span className="tag tag-coral">Дикие ✓</span>}
            {clinic.isRoundClock && <span className="tag tag-green">24/7</span>}
            {clinic.hasEmergency && <span className="tag tag-amber">Экстренная помощь</span>}
            {clinic.hasSurgery && <span className="tag tag-teal">Хирургия</span>}
            {(clinic as any).subscriptionPlan && (
              <span className="tag tag-amber">⭐ {(clinic as any).subscriptionPlan}</span>
            )}
          </div>
          {clinic.metro && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Train size={14} style={{ color: "hsl(174 70% 52%)" }} />
              <span>{clinic.metro}</span>
            </div>
          )}
        </div>

        {/* Rating + review */}
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Stars rating={clinic.rating} />
            <span className="text-sm text-muted-foreground">({clinic.reviewCount} отзывов)</span>
          </div>
          <button
            onClick={() => setShowReview(!showReview)}
            className="text-xs font-bold text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
            data-testid="btn-leave-review-clinic"
          >
            Оставить отзыв
          </button>
        </div>
        {showReview && (
          <ReviewForm entityType="clinic" entityId={clinic.id} onDone={() => setShowReview(false)} />
        )}

        {/* Description */}
        {clinic.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{clinic.description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {(clinic as any).address && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-xl p-3 flex items-start gap-2 hover:bg-white/5 transition-colors col-span-2"
              data-testid="link-clinic-address"
            >
              <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Адрес</p>
                <p className="text-sm font-semibold text-white">{(clinic as any).address}</p>
              </div>
            </a>
          )}
          {clinic.metro && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Train size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Метро</p>
                <p className="text-sm font-semibold text-white">{clinic.metro}</p>
              </div>
            </div>
          )}
          {clinic.workingHours && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Clock size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Режим работы</p>
                <p className="text-sm font-semibold text-white">{clinic.workingHours}</p>
              </div>
            </div>
          )}
          {(clinic as any).website && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Globe size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Сайт</p>
                <a href={(clinic as any).website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline">
                  Открыть
                </a>
              </div>
            </div>
          )}
          {clinic.phone && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <Phone size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Телефон</p>
                <a href={`tel:${clinic.phone}`} className="text-sm font-semibold text-primary">
                  {clinic.phone}
                </a>
              </div>
            </div>
          )}
          {(clinic as any).inn && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <div className="w-3.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">ИНН</p>
                <p className="text-sm font-semibold text-white">{(clinic as any).inn}</p>
              </div>
            </div>
          )}
          {clinic.priceConsultation && (
            <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
              <div className="w-3.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Консультация</p>
                <p className="text-sm font-extrabold gradient-primary-text">{clinic.priceConsultation.toLocaleString("ru-RU")}₽</p>
              </div>
            </div>
          )}
        </div>

        {/* Build route button */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full gradient-primary text-white font-extrabold py-3.5 rounded-xl transition-opacity hover:opacity-90"
          data-testid="btn-route-clinic"
        >
          <Navigation size={16} />
          Построить маршрут
        </a>

        {/* Services table */}
        {services && services.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2">Услуги</h3>
            <div className="rounded-xl overflow-hidden border border-border">
              {services.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-card" : "bg-card/50"}`}
                >
                  <span className="text-white">{s.name}</span>
                  <span className="font-bold text-primary">{s.price.toLocaleString("ru-RU")}₽</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment methods */}
        {paymentMethods && paymentMethods.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-2">Способы оплаты</h3>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.map((pm, i) => (
                <span key={i} className="tag tag-teal">{pm}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Boarding list card (compact, clickable) ── */
function BoardingListCard({ boarding, onClick }: { boarding: Boarding; onClick: () => void }) {
  const typeInfo = boardingTypeLabel(boarding.type);
  return (
    <div
      className="service-card cursor-pointer hover:bg-white/5 transition-colors"
      onClick={onClick}
      data-testid={`boarding-card-${boarding.id}`}
    >
      <div className="flex gap-3 p-3">
        {boarding.photoUrl && (
          <img
            src={boarding.photoUrl}
            alt={boarding.name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-extrabold text-white text-sm leading-tight truncate">{boarding.name}</h3>
            <span className={`tag ${typeInfo.cls} flex-shrink-0 text-[10px]`}>{typeInfo.label}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <Train size={11} style={{ color: "hsl(174 70% 52%)" }} />
            <span>{boarding.metro}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {boarding.acceptsWild && <span className="tag tag-coral" style={{ fontSize: "10px" }}>Дикие ✓</span>}
            {boarding.hasIsolationBox && <span className="tag tag-amber" style={{ fontSize: "10px" }}>Бокс</span>}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="gradient-primary-text font-extrabold text-sm">
                {boarding.pricePerDay.toLocaleString("ru-RU")}₽
              </span>
              <span className="text-xs text-muted-foreground">/сут</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-400">★ {boarding.rating.toFixed(1)}</span>
              <a
                href={`tel:${boarding.phone}`}
                className="gradient-primary text-white p-1.5 rounded-full"
                onClick={e => e.stopPropagation()}
                aria-label="Позвонить"
                data-testid={`btn-phone-boarding-${boarding.id}`}
              >
                <Phone size={12} />
              </a>
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground self-center flex-shrink-0" />
      </div>
    </div>
  );
}

/* ── Clinic list card (compact, clickable) ── */
function ClinicListCard({ clinic, onClick }: { clinic: Clinic; onClick: () => void }) {
  return (
    <div
      className="service-card cursor-pointer hover:bg-white/5 transition-colors"
      onClick={onClick}
      data-testid={`clinic-card-${clinic.id}`}
    >
      <div className="flex gap-3 p-3">
        {clinic.photoUrl && (
          <img
            src={clinic.photoUrl}
            alt={clinic.name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-white text-sm leading-tight mb-1 truncate">{clinic.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <Train size={11} style={{ color: "hsl(174 70% 52%)" }} />
            <span>{clinic.metro}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {clinic.worksWithWild && <span className="tag tag-coral" style={{ fontSize: "10px" }}>Дикие ✓</span>}
            {clinic.isRoundClock && <span className="tag tag-green" style={{ fontSize: "10px" }}>24/7</span>}
            {clinic.hasEmergency && <span className="tag tag-amber" style={{ fontSize: "10px" }}>Экстренная</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {clinic.priceConsultation
                ? `от ${clinic.priceConsultation.toLocaleString("ru-RU")}₽`
                : "цена по запросу"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-400">★ {clinic.rating.toFixed(1)}</span>
              <a
                href={`tel:${clinic.phone}`}
                className="gradient-primary text-white p-1.5 rounded-full"
                onClick={e => e.stopPropagation()}
                aria-label="Позвонить"
                data-testid={`btn-phone-clinic-${clinic.id}`}
              >
                <Phone size={12} />
              </a>
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground self-center flex-shrink-0" />
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"boardings" | "clinics">("boardings");

  // Boarding filters
  const [boardingFilter, setBoardingFilter] = useState<string>("all");
  const [boardingMaxPrice, setBoardingMaxPrice] = useState<number | null>(null);

  // Clinic filters
  const [clinicFilter, setClinicFilter] = useState<string>("all");

  // Detail selection
  const [selectedBoarding, setSelectedBoarding] = useState<Boarding | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const { data: boardings = [], isLoading: boardingsLoading } = useQuery<Boarding[]>({
    queryKey: ["/api/boardings"],
  });

  const { data: clinics = [], isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const filteredBoardings = boardings.filter((b) => {
    if (boardingFilter === "wild" && !b.acceptsWild) return false;
    if (boardingFilter === "box" && !b.hasIsolationBox) return false;
    if (boardingFilter === "hospital" && b.type !== "hospital_ward") return false;
    if (boardingMaxPrice && b.pricePerDay > boardingMaxPrice) return false;
    return true;
  });

  const filteredClinics = clinics.filter((c) => {
    if (clinicFilter === "wild" && !c.worksWithWild) return false;
    if (clinicFilter === "24h" && !c.isRoundClock) return false;
    return true;
  });

  // Detail views
  if (selectedBoarding) {
    return <BoardingDetail boarding={selectedBoarding} onBack={() => setSelectedBoarding(null)} />;
  }
  if (selectedClinic) {
    return <ClinicDetail clinic={selectedClinic} onBack={() => setSelectedClinic(null)} />;
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="app-header pr-14">
        <h1 className="text-xl font-black text-white">Сервисы</h1>
      </div>

      {/* Tabs */}
      <div className="tab-bar pt-4">
        <button
          className={`tab-pill ${activeTab === "boardings" ? "active" : ""}`}
          onClick={() => setActiveTab("boardings")}
          data-testid="tab-boardings"
        >
          🏠 Передержки
        </button>
        <button
          className={`tab-pill ${activeTab === "clinics" ? "active" : ""}`}
          onClick={() => setActiveTab("clinics")}
          data-testid="tab-clinics"
        >
          🏥 Клиники
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* ── BOARDINGS TAB ── */}
        {activeTab === "boardings" && (
          <>
            <div className="filter-chips pt-1">
              {[
                { key: "all", label: "Все" },
                { key: "wild", label: "Принимает диких" },
                { key: "box", label: "Есть бокс" },
                { key: "hospital", label: "Стационар" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-chip ${boardingFilter === key ? "active" : ""}`}
                  onClick={() => setBoardingFilter(key)}
                  data-testid={`chip-boarding-${key}`}
                >
                  {label}
                </button>
              ))}
              {[
                { label: "до 400₽/сут", value: 400 },
                { label: "до 600₽/сут", value: 600 },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  className={`filter-chip ${boardingMaxPrice === value ? "active" : ""}`}
                  onClick={() => setBoardingMaxPrice(boardingMaxPrice === value ? null : value)}
                  data-testid={`chip-price-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3 pb-4">
              {boardingsLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : filteredBoardings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 float">🏠</div>
                  <p className="font-bold text-white mb-1">Передержки не найдены</p>
                  <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры</p>
                </div>
              ) : (
                filteredBoardings.map((b) => (
                  <BoardingListCard
                    key={b.id}
                    boarding={b}
                    onClick={() => setSelectedBoarding(b)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* ── CLINICS TAB ── */}
        {activeTab === "clinics" && (
          <>
            <div className="filter-chips pt-1">
              {[
                { key: "all", label: "Все" },
                { key: "wild", label: "Работает с дикими" },
                { key: "24h", label: "Круглосуточно" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-chip ${clinicFilter === key ? "active" : ""}`}
                  onClick={() => setClinicFilter(key)}
                  data-testid={`chip-clinic-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3 pb-4">
              {clinicsLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : filteredClinics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 float">🏥</div>
                  <p className="font-bold text-white mb-1">Клиники не найдены</p>
                  <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры</p>
                </div>
              ) : (
                filteredClinics.map((c) => (
                  <ClinicListCard
                    key={c.id}
                    clinic={c}
                    onClick={() => setSelectedClinic(c)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
