import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
// framer-motion removed — no longer needed after removing donation sheet
import {
  ArrowLeft, Plus,
  Cat, Dog, ImagePlus, CheckCircle,
  X
} from "lucide-react";
import { apiRequest, queryClient, API_BASE } from "@/lib/queryClient";
import { useUser } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import type { VolunteerAd } from "@shared/schema";
import PhoneLink, { TelegramLink } from "@/components/PhoneLink";

/* ── Ad card ── */
function AdCard({ ad }: { ad: VolunteerAd }) {
  return (
    <div className="ad-card p-4" data-testid={`ad-card-${ad.id}`}>
      <div className="flex gap-3">
        {/* Photo */}
        <div className="flex-shrink-0">
          <img
            src={ad.photoUrl}
            alt={ad.animalName}
            className="w-20 h-20 rounded-xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80/1a1c22/666?text=🐾";
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-extrabold text-base leading-tight flex-1 min-w-0 truncate" style={{color:"hsl(var(--foreground))"}}>
              {ad.title}
            </h3>
            <span
              className={`tag flex-shrink-0 ${
                ad.adType === "rehome"
                  ? "tag-green"
                  : ad.adType === "treatment"
                  ? "tag-coral"
                  : "tag-amber"
              }`}
            >
              {ad.adType === "rehome" ? "Пристройство" : ad.adType === "treatment" ? "Лечение" : "Оба"}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-1.5">
            {ad.authorName} · <PhoneLink phone={ad.authorPhone} showIcon={false} />
          </p>

          <div className="flex flex-wrap gap-1 mb-2">
            <span className="tag tag-muted">{ad.animalName}</span>
            {ad.animalType === "cat" ? (
              <span className="tag tag-muted"><Cat size={10} /> кошка</span>
            ) : ad.animalType === "dog" ? (
              <span className="tag tag-muted"><Dog size={10} /> собака</span>
            ) : (
              <span className="tag tag-muted">{ad.animalType}</span>
            )}
            {ad.animalAge && <span className="tag tag-muted">{ad.animalAge}</span>}
          </div>
        </div>
      </div>

      {/* Action buttons — only "Write" button */}
      <div className="flex gap-2 mt-3">
        <TelegramLink
          phone={ad.authorPhone}
          label="✉️ Написать"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold gradient-primary text-white transition-opacity hover:opacity-90"
          data-testid={`btn-contact-${ad.id}`}
        />
      </div>
    </div>
  );
}

/* ── Create ad form ── */
function CreateAdForm({ onBack }: { onBack: () => void }) {
  const [, navigate] = useHashLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: "",
    animalName: "",
    animalType: "cat" as "cat" | "dog" | "other",
    animalAge: "",
    description: "",
    adType: "rehome" as "rehome" | "treatment" | "both",
    location: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/volunteer-ads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-ads"] });
      setSubmitted(true);
    },
    onError: () => toast({ title: "Ошибка", description: "Не удалось создать объявление", variant: "destructive" }),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.animalName || !form.description || !form.location) {
      toast({ title: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }
    mutation.mutate({
      userId: user!.id,
      authorName: user!.name,
      authorPhone: "",
      title: form.title,
      animalName: form.animalName,
      animalType: form.animalType,
      animalAge: form.animalAge,
      description: form.description,
      photoUrl: photoPreview || "https://placekitten.com/400/400",
      adType: form.adType,
      location: form.location,
      donationNeeded: null,
      bankCard: null,
      sbpPhone: null,
      tinkoffLink: null,
      createdAt: new Date().toISOString(),
    });
  };

  if (!user || (user.role !== "volunteer" && user.role !== "admin")) {
    return (
      <div className="page" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div className="app-header flex items-center gap-3 pr-14">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/10" data-testid="btn-back-create">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-black" style={{color:"hsl(var(--foreground))"}}>Создать объявление</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-5xl mb-4 float">🐾</div>
          <h2 className="font-extrabold text-xl text-white mb-2">Нужна регистрация как волонтёр</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Создавать объявления могут только зарегистрированные волонтёры.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="gradient-primary text-white font-extrabold px-8 py-3 rounded-xl"
            data-testid="btn-go-auth"
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div className="app-header flex items-center gap-3 pr-14">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/10" data-testid="btn-back-success">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-black" style={{color:"hsl(var(--foreground))"}}>Объявление создано</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <CheckCircle size={64} className="text-green-500 mb-4" />
          <h2 className="font-extrabold text-xl text-white mb-2">Объявление опубликовано!</h2>
          <p className="text-sm text-muted-foreground mb-6">Другие увидят его в ленте объявлений.</p>
          <button
            onClick={onBack}
            className="gradient-primary text-white font-extrabold px-8 py-3 rounded-xl"
            data-testid="btn-back-to-ads"
          >
            К объявлениям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <div className="app-header flex items-center gap-3 pr-14">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          data-testid="btn-back-form"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-xl font-black" style={{color:"hsl(var(--foreground))"}}>Создать объявление</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4 pb-8">
        {/* Photo upload */}
        <div>
          <label className="photo-upload-box aspect-video w-full relative cursor-pointer" data-testid="photo-upload">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handlePhotoChange}
            />
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <>
                <ImagePlus size={32} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-semibold">Добавить фото</span>
              </>
            )}
          </label>
        </div>

        <input
          className="glass-input"
          placeholder="Заголовок объявления *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          data-testid="input-title"
        />
        <input
          className="glass-input"
          placeholder="Имя животного *"
          value={form.animalName}
          onChange={(e) => setForm((f) => ({ ...f, animalName: e.target.value }))}
          data-testid="input-animal-name"
        />

        {/* Animal type */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2">Тип животного</p>
          <div className="flex gap-2">
            {(["cat", "dog", "other"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, animalType: type }))}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
                  form.animalType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
                data-testid={`btn-animal-type-${type}`}
              >
                {type === "cat" ? "🐱 Кошка" : type === "dog" ? "🐶 Собака" : "Другое"}
              </button>
            ))}
          </div>
        </div>

        <input
          className="glass-input"
          placeholder="Возраст (напр. 2 года)"
          value={form.animalAge}
          onChange={(e) => setForm((f) => ({ ...f, animalAge: e.target.value }))}
          data-testid="input-animal-age"
        />

        <textarea
          className="glass-input"
          placeholder="Описание *"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          style={{ resize: "none" }}
          data-testid="input-description"
        />

        {/* Ad type */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2">Тип объявления</p>
          <div className="flex gap-2">
            {(["rehome", "treatment", "both"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, adType: type }))}
                className={`flex-1 py-2 rounded-xl font-bold text-xs border-2 transition-all ${
                  form.adType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
                data-testid={`btn-ad-type-${type}`}
              >
                {type === "rehome" ? "Пристройство" : type === "treatment" ? "Лечение" : "Оба"}
              </button>
            ))}
          </div>
        </div>

        <input
          className="glass-input"
          placeholder="Город / район *"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          data-testid="input-location"
        />

        <button
          type="submit"
          className="w-full gradient-primary text-white font-extrabold py-3.5 rounded-xl text-sm transition-opacity hover:opacity-90"
          disabled={mutation.isPending}
          data-testid="btn-submit-ad"
        >
          {mutation.isPending ? "Публикуем..." : "Опубликовать объявление"}
        </button>
      </form>
    </div>
  );
}

/* ── Main page ── */
export default function AdsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: ads = [], isLoading } = useQuery<VolunteerAd[]>({
    queryKey: ["/api/volunteer-ads"],
  });

  const filtered = ads.filter((ad) => {
    if (filter === "rehome" && ad.adType !== "rehome" && ad.adType !== "both") return false;
    if (filter === "treatment" && ad.adType !== "treatment" && ad.adType !== "both") return false;
    if (filter === "cat" && ad.animalType !== "cat") return false;
    if (filter === "dog" && ad.animalType !== "dog") return false;
    return true;
  });

  if (showCreate) {
    return <CreateAdForm onBack={() => setShowCreate(false)} />;
  }

  return (
    <div className="page" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      {/* Header */}
      <div className="app-header pr-14">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black" style={{color:"hsl(var(--foreground))"}}>Объявления волонтёров</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="gradient-primary text-white font-extrabold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 transition-opacity hover:opacity-90"
            data-testid="btn-create-ad"
          >
            <Plus size={14} />
            Создать
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Filter chips */}
        <div className="filter-chips">
          {[
            { key: "all", label: "Все" },
            { key: "rehome", label: "Пристройство" },
            { key: "treatment", label: "Лечение" },
            { key: "cat", label: "🐱 Кошки" },
            { key: "dog", label: "🐶 Собаки" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-chip ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
              data-testid={`chip-ad-${key}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3 pb-4">
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="ad-card p-4">
                  <div className="flex gap-3">
                    <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-40 rounded" />
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="skeleton h-3 w-32 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 float">📋</div>
              <p className="font-bold text-white mb-1">Объявлений нет</p>
              <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            filtered.map((ad) => <AdCard key={ad.id} ad={ad} />)
          )}
        </div>
      </div>
    </div>
  );
}
