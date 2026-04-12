import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  ArrowLeft, Heart, Home as HomeIcon, Stethoscope,
  UtensilsCrossed, MapPin, CalendarDays,
  CheckCircle, Play, Pause, Volume2, VolumeX,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, API_BASE } from "@/lib/queryClient";
import type { Animal } from "@shared/schema";

const helpOptions = [
  { id: "home",    icon: Heart,           label: "Забрать домой",    desc: "Стать хозяином",                color: "text-primary",    needKey: "needsHome" },
  { id: "food",    icon: UtensilsCrossed, label: "Купить корм",      desc: "Помочь с едой и лакомствами",   color: "text-orange-500", needKey: "needsFood" },
  { id: "shelter", icon: HomeIcon,        label: "Купить домик",     desc: "Тёплый домик для улицы",        color: "text-blue-500",   needKey: "needsShelter" },
  { id: "medicine",icon: Stethoscope,     label: "Купить лекарства", desc: "Ветеринарная помощь",           color: "text-red-500",    needKey: "needsMedical" },
];

/* ── Inline video player ───────────────────────────────── */
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden cursor-pointer" onClick={toggle}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        loop
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v) setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        }}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={26} className="text-foreground ml-1" />
          </div>
        </div>
      )}
      <button
        className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm p-1.5 rounded-full text-white"
        onClick={toggleMute}
        aria-label={muted ? "Включить звук" : "Выключить звук"}
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs font-bold">
        Видео
      </div>
    </div>
  );
}

export default function AnimalPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const [selectedHelp, setSelectedHelp] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ contactName: "", contactPhone: "", message: "" });
  const [mediaTab, setMediaTab] = useState<"photo" | "video">("photo");

  const { data: animal, isLoading } = useQuery<Animal>({
    queryKey: ["/api/animals", id],
    queryFn: () => fetch(`${API_BASE}/api/animals/${id}`).then(r => r.json()),
  });

  const helpMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/help-requests", data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
    },
    onError: () => toast({ title: "Ошибка", description: "Попробуйте ещё раз", variant: "destructive" }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactName || !form.contactPhone) {
      toast({ title: "Заполните имя и телефон", variant: "destructive" });
      return;
    }
    helpMutation.mutate({
      animalId: Number(id),
      helpType: selectedHelp,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      message: form.message,
      createdAt: new Date().toISOString(),
    });

    // Send Telegram notification to author
    const helpLabel = helpOptions.find(h => h.id === selectedHelp)?.label || selectedHelp;
    const tgMessage = `🐾 <b>Новая заявка!</b>\nПитомец: ${animal?.name}\nТип помощи: ${helpLabel}\nОт: ${form.contactName} (${form.contactPhone})${form.message ? `\n${form.message}` : ""}`;
    const authorTgId = (animal as any)?.authorTelegramId;
    if (authorTgId) {
      try {
        await fetch(`${API_BASE}/api/notify-telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: String(authorTgId), message: tgMessage }),
        });
      } catch (err) {
        console.warn("Telegram notification failed:", err);
      }
    }
  };

  if (isLoading) return (
    <div className="page-content max-w-lg mx-auto" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-3"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full" /></div>
    </div>
  );
  if (!animal) return null;

  const hasVideo = Boolean(animal.videoUrl);

  return (
    <div className="page-content max-w-lg mx-auto" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      {/* Media area */}
      <div className="relative">
        {/* Tab switcher — only if video exists */}
        {hasVideo && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex bg-black/40 backdrop-blur-sm rounded-full p-0.5 gap-0.5">
            {(["photo", "video"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMediaTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${mediaTab === tab ? "bg-white text-foreground" : "text-white/80"}`}
                data-testid={`tab-${tab}`}
              >
                {tab === "photo" ? "Фото" : "Видео"}
              </button>
            ))}
          </div>
        )}

        {mediaTab === "photo" || !hasVideo ? (
          <img src={animal.photoUrl} alt={animal.name} className="w-full aspect-[4/3] object-cover" />
        ) : (
          <div className="w-full aspect-[4/3] bg-black flex items-center justify-center p-3">
            <VideoPlayer src={animal.videoUrl!} />
          </div>
        )}

        <button onClick={() => navigate("/")} className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm p-2 rounded-full shadow-md z-20" data-testid="button-back">
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-4 left-4 z-10">
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${animal.status === "rehomed" ? "bg-accent/20 text-accent border border-accent/30" : "bg-primary/20 text-primary border border-primary/30"}`}>
            {animal.status === "rehomed" ? "✓ Пристроен" : "Ищет дом"}
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Name */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-black text-foreground">{animal.name}</h1>
          <span className="text-sm font-semibold text-muted-foreground mt-1">{animal.age}</span>
        </div>

        {/* Location + date */}
        <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
          {/* Tappable map link */}
          <a
            href={`https://yandex.ru/maps/?text=${encodeURIComponent(animal.location)}&mode=routes`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline font-semibold"
            data-testid="link-map"
          >
            <MapPin size={12} />
            <span>{animal.location}</span>
            <Navigation size={11} className="ml-0.5 opacity-70" />
            <span className="text-xs text-muted-foreground font-normal ml-0.5">Построить маршрут</span>
          </a>
          <span className="flex items-center gap-1"><CalendarDays size={12} />Найдена {new Date(animal.foundDate).toLocaleDateString("ru-RU")}</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{animal.description}</p>

        {/* Story */}
        <div className="bg-muted/40 rounded-xl p-3 mb-5 border border-border">
          <p className="text-xs font-bold text-foreground mb-1">История находки</p>
          <p className="text-sm text-muted-foreground italic">"{animal.story}"</p>
          <p className="text-xs text-primary font-semibold mt-1">— Виолета</p>
        </div>

        {/* Help options */}
        {animal.status !== "rehomed" && !submitted && (
          <>
            <h2 className="text-base font-extrabold text-foreground mb-3">Как вы можете помочь?</h2>
            <div className="flex flex-col gap-2 mb-4">
              {helpOptions.map(({ id: hid, icon: Icon, label, desc, color, needKey }) => {
                const needed = needKey ? Boolean((animal as any)[needKey]) : true;
                if (!needed) return null;
                return (
                  <div
                    key={hid}
                    className={`help-option ${selectedHelp === hid ? "selected" : ""}`}
                    onClick={() => { setSelectedHelp(hid); setShowForm(true); }}
                    data-testid={`help-option-${hid}`}
                  >
                    <div className={`p-2 rounded-lg bg-muted/60 ${color}`}><Icon size={20} /></div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact form for help request */}
            {showForm && selectedHelp && (
              <form onSubmit={handleSubmit} className="space-y-3 bg-card rounded-xl p-4 border border-border mb-4">
                <h3 className="font-bold text-sm text-foreground">{helpOptions.find(h => h.id === selectedHelp)?.label}</h3>
                <div>
                  <Label htmlFor="name" className="text-xs font-semibold">Ваше имя *</Label>
                  <Input id="name" placeholder="Имя" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} className="mt-1" data-testid="input-contact-name" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold">Телефон *</Label>
                  <Input id="phone" placeholder="+7 (___) ___-__-__" type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="mt-1" data-testid="input-contact-phone" />
                </div>
                <div>
                  <Label htmlFor="msg" className="text-xs font-semibold">Сообщение</Label>
                  <Textarea id="msg" placeholder="Напишите что-нибудь..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="mt-1 text-sm" rows={2} />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold" disabled={helpMutation.isPending} data-testid="button-submit-help">
                  {helpMutation.isPending ? "Отправляем..." : "Отправить"}
                </Button>
              </form>
            )}
          </>
        )}

        {submitted && (
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-5 border border-green-200 dark:border-green-800 text-center mb-4">
            <CheckCircle size={40} className="mx-auto mb-2 text-green-500" />
            <p className="font-extrabold text-foreground mb-1">Спасибо!</p>
            <p className="text-sm text-muted-foreground">Виолета получит ваш запрос и свяжется с вами как можно скорее.</p>
          </div>
        )}

        {animal.status === "rehomed" && (
          <div className="bg-accent/10 rounded-xl p-4 text-center border border-accent/20 mb-4">
            <CheckCircle size={32} className="mx-auto mb-2 text-accent" />
            <p className="font-extrabold text-accent">Уже нашёл дом!</p>
            <p className="text-sm text-muted-foreground mt-1">Этот питомец счастливо живёт в новой семье.</p>
          </div>
        )}
      </div>
    </div>
  );
}
