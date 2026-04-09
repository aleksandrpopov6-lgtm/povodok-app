import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Video, X, CheckCircle, Plus, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, API_BASE } from "@/lib/queryClient";
import CatPawLogo from "@/components/CatPawLogo";

const MAX_VIDEO_SECONDS = 60;

export default function AdminPage() {
  const { toast } = useToast();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "cat",
    age: "котёнок",
    description: "",
    story: "",
    location: "",
    foundDate: new Date().toISOString().split("T")[0],
    needsFood: true,
    needsShelter: false,
    needsMedical: false,
    needsHome: true,
  });

  const [submitted, setSubmitted] = useState(false);

  const { data: stats } = useQuery<{ total: number; needsHelp: number; rehomed: number }>({
    queryKey: ["/api/stats"],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (photoFile) fd.append("photo", photoFile);
      if (videoFile) fd.append("video", videoFile);

      const res = await fetch(`${API_BASE}/api/animals`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSubmitted(true);
    },
    onError: () => toast({ title: "Ошибка", description: "Попробуйте ещё раз", variant: "destructive" }),
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const dur = video.duration;
      setVideoDuration(Math.round(dur));
      if (dur > MAX_VIDEO_SECONDS) {
        setVideoError(`Видео слишком длинное (${Math.round(dur)}с). Максимум — ${MAX_VIDEO_SECONDS} секунд.`);
        setVideoFile(null);
        setVideoPreview(null);
        URL.revokeObjectURL(url);
      } else {
        setVideoFile(file);
        setVideoPreview(url);
      }
    };
    video.src = url;
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(0);
    setVideoError(null);
    if (videoRef.current) videoRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) { toast({ title: "Добавь фото питомца", variant: "destructive" }); return; }
    if (!form.name || !form.description || !form.story || !form.location) {
      toast({ title: "Заполни все поля", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const resetForm = () => {
    setSubmitted(false);
    setPhotoFile(null); setPhotoPreview(null);
    setVideoFile(null); setVideoPreview(null);
    setVideoDuration(0); setVideoError(null);
    setForm({ name: "", type: "cat", age: "котёнок", description: "", story: "", location: "", foundDate: new Date().toISOString().split("T")[0], needsFood: true, needsShelter: false, needsMedical: false, needsHome: true });
  };

  if (submitted) return (
    <div className="page-content max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <div className="text-6xl">🐾</div>
      <h2 className="text-xl font-black text-foreground">Добавлено!</h2>
      <p className="text-sm text-muted-foreground">Питомец появится в ленте и люди уже смогут ему помочь.</p>
      <Button onClick={resetForm} className="bg-primary text-white font-bold px-6">
        <Plus size={16} className="mr-1" /> Добавить ещё
      </Button>
    </div>
  );

  return (
    <div className="page-content max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <CatPawLogo size={30} />
          <div>
            <h1 className="text-base font-black text-foreground leading-tight">Панель Виолеты</h1>
            <p className="text-xs text-muted-foreground">Добавить нового питомца</p>
          </div>
        </div>
        {stats && (
          <div className="flex gap-3 mt-2">
            {[
              { label: "Всего спасено", value: stats.total },
              { label: "Ждут дом", value: stats.needsHelp, accent: true },
              { label: "Пристроены", value: stats.rehomed, green: true },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-card rounded-xl p-2 text-center border border-border">
                <div className={`text-lg font-black ${s.accent ? "text-primary" : s.green ? "text-accent" : "text-foreground"}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-5">

        {/* Photo upload */}
        <div>
          <Label className="text-sm font-bold mb-2 block">Фото питомца *</Label>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} data-testid="input-photo" />
          <div className="photo-upload-box" onClick={() => photoRef.current?.click()}>
            {photoPreview
              ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              : <>
                  <Camera size={32} className="text-muted-foreground" />
                  <p className="text-sm font-semibold text-muted-foreground">Снять фото или выбрать из галереи</p>
                  <p className="text-xs text-muted-foreground opacity-70">Нажми, чтобы загрузить</p>
                </>
            }
          </div>
        </div>

        {/* Video upload */}
        <div>
          <Label className="text-sm font-bold mb-2 block flex items-center gap-2">
            <Video size={15} />
            Видео <span className="font-normal text-muted-foreground">(необязательно, до 60 сек)</span>
          </Label>
          <input ref={videoRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleVideo} data-testid="input-video" />

          {videoPreview ? (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video src={videoPreview} className="w-full aspect-video object-cover" controls playsInline />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span className="bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock size={11} /> {videoDuration}с / 60с
                </span>
                <button type="button" onClick={removeVideo} className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-upload-box" style={{ aspectRatio: "16/7" }} onClick={() => videoRef.current?.click()}>
              <Video size={28} className="text-muted-foreground" />
              <p className="text-sm font-semibold text-muted-foreground">Снять видео или выбрать из галереи</p>
              <p className="text-xs text-muted-foreground opacity-70">Максимум 1 минута</p>
            </div>
          )}

          {videoError && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {videoError}
            </div>
          )}
        </div>

        {/* Basic info */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-bold">Кличка *</Label>
            <Input placeholder="Например: Мурка" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" data-testid="input-name" />
          </div>

          {/* Type */}
          <div>
            <Label className="text-xs font-bold mb-1.5 block">Кто это?</Label>
            <div className="flex gap-2">
              {[["cat", "🐱 Кошка"], ["dog", "🐶 Собака"]].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: val }))}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${form.type === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  data-testid={`btn-type-${val}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <Label className="text-xs font-bold mb-1.5 block">Возраст</Label>
            <div className="flex gap-2 flex-wrap">
              {["котёнок", "молодой", "взрослый"].map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, age: a }))}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors ${form.age === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Описание *</Label>
            <Textarea placeholder="Характер, особенности, привита ли..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 text-sm" rows={3} data-testid="textarea-description" />
          </div>

          <div>
            <Label className="text-xs font-bold">История находки *</Label>
            <Textarea placeholder="Где и при каких обстоятельствах нашла..." value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} className="mt-1 text-sm" rows={3} data-testid="textarea-story" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Локация *</Label>
              <Input placeholder="Москва, Бутово" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1" data-testid="input-location" />
            </div>
            <div>
              <Label className="text-xs font-bold">Дата находки</Label>
              <Input type="date" value={form.foundDate} onChange={e => setForm(f => ({ ...f, foundDate: e.target.value }))} className="mt-1" data-testid="input-date" />
            </div>
          </div>
        </div>

        {/* Needs */}
        <div>
          <Label className="text-sm font-bold block mb-2">Что нужно питомцу?</Label>
          <div className="space-y-2">
            {[
              { key: "needsFood",    label: "Корм",     emoji: "🍖" },
              { key: "needsShelter", label: "Домик",    emoji: "🏠" },
              { key: "needsMedical", label: "Лечение",  emoji: "💊" },
              { key: "needsHome",    label: "Дом",      emoji: "❤️" },
            ].map(({ key, label, emoji }) => (
              <div key={key} className="flex items-center justify-between bg-card rounded-xl px-3 py-2.5 border border-border">
                <span className="text-sm font-semibold text-foreground">{emoji} {label}</span>
                <Switch
                  checked={Boolean((form as any)[key])}
                  onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))}
                  data-testid={`switch-${key}`}
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-black text-base py-6 rounded-2xl"
          disabled={mutation.isPending}
          data-testid="button-publish"
        >
          {mutation.isPending ? "Публикую..." : "🐾 Опубликовать питомца"}
        </Button>

        <div className="h-4" />
      </form>
    </div>
  );
}
