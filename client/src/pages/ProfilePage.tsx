import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LogOut, Edit3, Save, X, MapPin, Phone, Globe, Clock, Building,
  Camera, CheckCircle, CreditCard, FileText, Download, Mail,
  ChevronDown, ChevronUp, Star,
} from "lucide-react";
import { useUser } from "@/components/ThemeProvider";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import { BrandName } from "@/components/CatPawLogo";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = {
  guest: "Гость", volunteer: "Волонтёр", catcher: "Ловец",
  clinic: "Ветклиника", boarding: "Передержка",
};
const ROLE_ICONS: Record<string, string> = {
  guest: "👁", volunteer: "🐾", catcher: "🪤", clinic: "🏥", boarding: "🏠",
};
const ROLE_DESC: Record<string, string> = {
  guest: "Смотри объявления, находи ловцов и клиники, помогай животным.",
  volunteer: "Размещай объявления о пристройстве, собирай донаты для лечения животных.",
  catcher: "Принимай заявки на отлов бездомных животных от волонтёров. Бесплатно.",
  clinic: "Клиника отображается в каталоге и получает заявки на лечение животных.",
  boarding: "Передержка отображается в каталоге и принимает животных на временное содержание.",
};

/* ─────────────────────────────────────────────────────────────────
   Payment / subscription modal
───────────────────────────────────────────────────────────────── */
function SubscriptionModal({
  amount,
  planName,
  onClose,
  onSuccess,
}: {
  amount: number;
  planName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [method, setMethod] = useState<"card" | "invoice" | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ inn: "", email: "", orgName: "" });
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [done, setDone] = useState(false);

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: invoiceForm.orgName,
          buyerInn: invoiceForm.inn,
          buyerEmail: invoiceForm.email,
          amount,
          planName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Ошибка" }));
        throw new Error(err.error || "Ошибка генерации счёта");
      }
      // Download PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schet_povodok_${amount}rub.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => {
      toast({ title: "Счёт скачан!", description: `Счёт на ${amount}₽ отправлен на ${invoiceForm.email}` });
      setDone(true);
      setTimeout(onSuccess, 1500);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const cardMutation = useMutation({
    mutationFn: async () => {
      // Demo — in production this would go to a payment gateway
      await new Promise(r => setTimeout(r, 1200));
      return true;
    },
    onSuccess: () => {
      setDone(true);
      toast({ title: "Оплата прошла!", description: "Подписка активирована" });
      setTimeout(onSuccess, 1200);
    },
  });

  if (done) {
    return (
      <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
        <div className="bottom-sheet w-full max-w-lg">
          <div className="sheet-handle" />
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle size={48} className="text-green-500" />
            <p className="text-lg font-black" style={{ color: "hsl(var(--foreground))" }}>Готово!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bottom-sheet w-full max-w-lg" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="sheet-handle" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1"><span className="font-black text-base" style={{ color: "hsl(var(--foreground))" }}>Подписка </span><BrandName size="text-base" /></div>
            <p className="text-sm gradient-primary-text font-bold">{amount}₽ / месяц</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
            <X size={18} />
          </button>
        </div>

        {/* Method selector */}
        {!method && (
          <div className="space-y-3">
            <p className="text-xs font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>СПОСОБ ОПЛАТЫ</p>

            <button
              onClick={() => setMethod("card")}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
              style={{ background: "hsl(var(--secondary))", border: "2px solid hsl(var(--border))" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center gradient-primary text-white flex-shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>Привязать карту</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Автоматическое списание каждый месяц</p>
              </div>
            </button>

            <button
              onClick={() => setMethod("invoice")}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
              style={{ background: "hsl(var(--secondary))", border: "2px solid hsl(var(--border))" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: "hsl(var(--teal, 174 70% 42%))" }}>
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>Выставить счёт</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>PDF-счёт для юрлица — скачать или отправить на email</p>
              </div>
            </button>
          </div>
        )}

        {/* Card form */}
        {method === "card" && (
          <div className="space-y-3">
            <button onClick={() => setMethod(null)} className="flex items-center gap-1 text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              ← Назад
            </button>
            <p className="text-xs font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>ДАННЫЕ КАРТЫ</p>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Номер карты</label>
              <input
                className="glass-input"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                value={cardForm.number}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setCardForm(f => ({ ...f, number: v.replace(/(.{4})/g, "$1 ").trim() }));
                }}
                data-testid="input-card-number"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Срок действия</label>
                <input
                  className="glass-input"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardForm.expiry}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                    setCardForm(f => ({ ...f, expiry: v }));
                  }}
                  data-testid="input-card-expiry"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>CVV / CVC</label>
                <input
                  className="glass-input"
                  placeholder="•••"
                  type="password"
                  maxLength={3}
                  value={cardForm.cvv}
                  onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                  data-testid="input-card-cvv"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Имя на карте</label>
              <input
                className="glass-input"
                placeholder="IVAN IVANOV"
                value={cardForm.name}
                onChange={e => setCardForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                data-testid="input-card-name"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              Данные карты защищены по стандарту PCI DSS. Платёж обрабатывается через защищённый шлюз.
            </div>

            <button
              onClick={() => cardMutation.mutate()}
              disabled={cardMutation.isPending || !cardForm.number || !cardForm.expiry || !cardForm.cvv}
              className="w-full gradient-primary text-white font-black py-3.5 rounded-2xl text-base disabled:opacity-50"
              data-testid="button-pay-card"
            >
              {cardMutation.isPending ? "Обработка..." : `Оплатить ${amount}₽`}
            </button>
          </div>
        )}

        {/* Invoice form */}
        {method === "invoice" && (
          <div className="space-y-3">
            <button onClick={() => setMethod(null)} className="flex items-center gap-1 text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              ← Назад
            </button>
            <p className="text-xs font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>РЕКВИЗИТЫ ДЛЯ СЧЁТА</p>

            <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
              <p className="font-bold" style={{ color: "hsl(var(--foreground))" }}>Счёт выставляется от:</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>ООО «ПоводОК» · ИНН 1234567890 · КПП 123401001</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>р/с 40702810000000000001 · Тинькофф Банк</p>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Наименование организации *</label>
              <input
                className="glass-input"
                placeholder='ООО "Ваша организация"'
                value={invoiceForm.orgName}
                onChange={e => setInvoiceForm(f => ({ ...f, orgName: e.target.value }))}
                data-testid="input-invoice-orgname"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>ИНН организации *</label>
              <input
                className="glass-input"
                placeholder="1234567890"
                maxLength={12}
                value={invoiceForm.inn}
                onChange={e => setInvoiceForm(f => ({ ...f, inn: e.target.value.replace(/\D/g, "") }))}
                data-testid="input-invoice-inn"
              />
            </div>
            <div>
              <label className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                <Mail size={11} /> Email для отправки счёта *
              </label>
              <input
                className="glass-input"
                placeholder="buhgalter@example.ru"
                type="email"
                value={invoiceForm.email}
                onChange={e => setInvoiceForm(f => ({ ...f, email: e.target.value }))}
                data-testid="input-invoice-email"
              />
            </div>

            <div className="p-3 rounded-xl text-xs" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
              <p className="font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Назначение платежа:</p>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>
                Благотворительное пожертвование на поддержку бездомных животных и развитие волонтёрской платформы «ПоводОК». Подписка на сервис.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => invoiceMutation.mutate()}
                disabled={invoiceMutation.isPending || !invoiceForm.inn || !invoiceForm.email || !invoiceForm.orgName}
                className="flex-1 flex items-center justify-center gap-2 gradient-primary text-white font-bold py-3 rounded-xl disabled:opacity-50"
                data-testid="button-download-invoice"
              >
                <Download size={16} />
                {invoiceMutation.isPending ? "Генерация..." : "Скачать счёт PDF"}
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
              Счёт будет скачан и выслан на указанный email
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Support Project Card
───────────────────────────────────────────────────────────────── */
function SupportProjectCard() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const plans = [
    { name: "Базовый", price: 99 },
    { name: "Стандарт", price: 299 },
    { name: "Премиум", price: 599 },
  ];

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--primary) / 0.08)", border: "2px solid hsl(var(--primary) / 0.3)" }}>
      <div>
        <h3 className="font-black text-base" style={{ color: "hsl(var(--foreground))" }}>Поддержать ПоводОК</h3>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Ваша подписка помогает развивать платформу и спасать больше животных
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {plans.map(plan => (
          <button
            key={plan.price}
            onClick={() => setSelectedPlan(plan.price === selectedPlan ? null : plan.price)}
            className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-center"
            style={{
              borderColor: selectedPlan === plan.price ? "hsl(var(--primary))" : "hsl(var(--border))",
              background: selectedPlan === plan.price ? "hsl(var(--primary) / 0.15)" : "hsl(var(--card))",
            }}
            data-testid={`btn-support-${plan.price}`}
          >
            <span className="text-xs font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>{plan.name}</span>
            <span className="font-black text-base gradient-primary-text">{plan.price}₽</span>
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>/мес</span>
          </button>
        ))}
      </div>

      {selectedPlan && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
            Переведите {selectedPlan}₽ на +79296146024
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Сбер / ТКофф / ВТБ — Воробьёва Виолетта Игоревна
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            После перевода пришлите чек в @Povodokpro_bot
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Profile Page
───────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editCity, setEditCity] = useState(user?.city || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(300);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [catcherPriceInMkad, setCatcherPriceInMkad] = useState("0");
  const [catcherPriceOutMkad, setCatcherPriceOutMkad] = useState("0");
  const [extraFields, setExtraFields] = useState({
    serviceArea: "", serviceRadiusKm: 5,
    hasNet: false, hasTrap: false, hasCatTrap: false,
    worksCats: true, worksDogs: true,
    address: "", phone: "", website: "", yandexMapsLink: "",
    workingHours: "", description: "", inn: "", pricePerDay: "",
  });

  const savePricesMutation = useMutation({
    mutationFn: async () => {
      // We need the catcher id — for simplicity, we look up by user id
      const res = await fetch(`${API_BASE}/api/catchers`);
      const catchers = await res.json();
      const myCatcher = catchers.find((c: any) => c.userId === user?.id);
      if (!myCatcher) throw new Error("Ловец не найден");
      const resp = await fetch(`${API_BASE}/api/catchers/${myCatcher.id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceInMkad: Number(catcherPriceInMkad) || 0,
          priceOutMkad: Number(catcherPriceOutMkad) || 0,
        }),
      });
      if (!resp.ok) throw new Error("Ошибка сохранения");
      return resp.json();
    },
    onSuccess: () => toast({ title: "Цены сохранены" }),
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", editName);
      fd.append("city", editCity);
      if (avatarFile) fd.append("avatar", avatarFile);
      const res = await fetch(`${API_BASE}/api/users/${user!.id}`, { method: "PATCH", body: fd });
      if (!res.ok) throw new Error("Ошибка сохранения");
      return res.json();
    },
    onSuccess: (updated) => {
      setUser({ ...user!, name: updated.name, city: updated.city, avatarUrl: updated.avatarUrl });
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast({ title: "Профиль обновлён" });
    },
    onError: () => toast({ title: "Ошибка сохранения", variant: "destructive" }),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // If user came from Telegram, check tgUser
  const isTgUser = Boolean(user?.tgUser);

  if (!user) {
    return (
      <div className="page max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center pb-24">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: "hsl(var(--secondary))" }}>👤</div>
        <div>
          <h2 className="text-xl font-black" style={{ color: "hsl(var(--foreground))" }}>Войдите в аккаунт</h2>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Чтобы размещать объявления и помогать животным</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => navigate("/auth")} className="gradient-primary text-white font-bold py-3.5 rounded-2xl text-base">Войти</button>
          <button onClick={() => navigate("/auth")} className="font-bold py-3.5 rounded-2xl text-base"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
            Зарегистрироваться
          </button>
        </div>
      </div>
    );
  }

  const role = user.role || "guest";
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="page max-w-lg mx-auto pb-24">
      <div className="app-header px-4 pt-3 pb-3 pr-14">
        <h1 className="text-lg font-black" style={{ color: "hsl(var(--foreground))" }}>Профиль</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black text-white"
              style={{ background: "linear-gradient(135deg, hsl(328 80% 62%), hsl(var(--primary)))" }}>
              {(avatarPreview || user.avatarUrl)
                ? <img src={avatarPreview || user.avatarUrl!} alt={user.name} className="w-full h-full object-cover" />
                : initials}
            </div>
            {editing && (
              <>
                <input ref={avatarRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAvatarChange} />
                <button onClick={() => avatarRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ background: "hsl(var(--primary))" }}>
                  <Camera size={14} />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing
              ? <input value={editName} onChange={e => setEditName(e.target.value)} className="glass-input text-base font-bold w-full mb-1" placeholder="Ваше имя" />
              : <h2 className="text-lg font-black truncate" style={{ color: "hsl(var(--foreground))" }}>{user.name}</h2>}
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="tag tag-coral text-xs">{ROLE_ICONS[role]} {ROLE_LABELS[role]}</span>
              {user.isSubscribed && <span className="pro-badge text-xs">PRO</span>}
            </div>
          </div>

          {!editing
            ? <button onClick={() => { setEditName(user.name); setEditCity(user.city || ""); setEditing(true); }}
                className="flex-shrink-0 p-2 rounded-xl" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                <Edit3 size={18} />
              </button>
            : <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }}
                  className="p-2 rounded-xl" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                  <X size={18} />
                </button>
                <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
                  className="p-2 rounded-xl gradient-primary text-white">
                  <Save size={18} />
                </button>
              </div>}
        </div>

        {/* Phone / Telegram username */}
        <div className="rounded-xl p-3 text-sm flex items-center gap-2" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
          <Phone size={15} />
          <span>{isTgUser && user.tgUser?.username ? `@${user.tgUser.username}` : user.phone}</span>
          {isTgUser && <span className="ml-auto text-xs opacity-60">Telegram</span>}
          {!isTgUser && <span className="ml-auto text-xs opacity-60">нельзя изменить</span>}
        </div>

        {/* City */}
        {editing
          ? <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}><MapPin size={12} className="inline mr-1" />Город</label>
              <input value={editCity} onChange={e => setEditCity(e.target.value)} className="glass-input" placeholder="Москва" />
            </div>
          : user.city
            ? <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}><MapPin size={14} /><span>{user.city}</span></div>
            : null}

        {/* Role desc */}
        <div className="rounded-xl p-3" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-xs font-bold mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Ваша роль: {ROLE_LABELS[role]}</p>
          <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{ROLE_DESC[role]}</p>
        </div>

        {/* Role-specific editable fields */}
        {editing && role === "catcher" && (
          <div className="rounded-xl p-3 space-y-3" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>🪤 Зона обслуживания</p>
            <input value={extraFields.serviceArea} onChange={e => setExtraFields(f => ({ ...f, serviceArea: e.target.value }))}
              className="glass-input text-sm" placeholder="Адрес центра зоны (напр.: Москва, Выхино)" />
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Радиус выезда: <strong>{extraFields.serviceRadiusKm} км</strong>
              </label>
              <input type="range" min={1} max={50} value={extraFields.serviceRadiusKm}
                onChange={e => setExtraFields(f => ({ ...f, serviceRadiusKm: Number(e.target.value) }))}
                className="w-full" style={{ accentColor: "hsl(var(--primary))" }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[["hasNet","сочок"],["hasTrap","ловушка"],["hasCatTrap","котоловка"]].map(([key, label]) => (
                <button key={key} type="button"
                  onClick={() => setExtraFields(f => ({ ...f, [key]: !(f as any)[key] }))}
                  className={`tag cursor-pointer ${(extraFields as any)[key] ? "tag-teal" : "tag-muted"}`}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Catcher pricing section */}
        {role === "catcher" && (
          <div className="rounded-xl p-3 space-y-3" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>💰 Мои цены</p>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Цена в МКАД (₽)</label>
              <input
                type="number"
                min={0}
                value={catcherPriceInMkad}
                onChange={e => setCatcherPriceInMkad(e.target.value)}
                className="glass-input text-sm"
                placeholder="0"
                data-testid="input-price-in-mkad"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Цена за МКАД (₽)</label>
              <input
                type="number"
                min={0}
                value={catcherPriceOutMkad}
                onChange={e => setCatcherPriceOutMkad(e.target.value)}
                className="glass-input text-sm"
                placeholder="0"
                data-testid="input-price-out-mkad"
              />
            </div>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Оставьте 0 чтобы работать бесплатно</p>
            <button
              onClick={() => savePricesMutation.mutate()}
              disabled={savePricesMutation.isPending}
              className="w-full gradient-primary text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
              data-testid="btn-save-prices"
            >
              {savePricesMutation.isPending ? "Сохраняем..." : "Сохранить цены"}
            </button>
          </div>
        )}

        {editing && (role === "clinic" || role === "boarding") && (
          <div className="rounded-xl p-3 space-y-3" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{role === "clinic" ? "🏥" : "🏠"} Данные организации</p>
            {[
              { key: "address", label: "Адрес", placeholder: "ул. Примерная, 1, Москва" },
              { key: "phone", label: "Телефон", placeholder: "+7 (___) ___-__-__" },
              { key: "website", label: "Сайт", placeholder: "https://example.ru" },
              { key: "yandexMapsLink", label: "Ссылка Яндекс Карты", placeholder: "https://yandex.ru/maps/..." },
              { key: "workingHours", label: "Режим работы", placeholder: "9:00–21:00" },
              { key: "description", label: "Описание", placeholder: "Расскажите об организации" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</label>
                <input value={(extraFields as any)[key]} onChange={e => setExtraFields(f => ({ ...f, [key]: e.target.value }))}
                  className="glass-input text-sm" placeholder={placeholder} />
              </div>
            ))}
            {role === "clinic" && (
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>ИНН</label>
                <input value={extraFields.inn} onChange={e => setExtraFields(f => ({ ...f, inn: e.target.value }))}
                  className="glass-input text-sm" placeholder="ИНН организации" />
              </div>
            )}
          </div>
        )}

        {/* ── SUBSCRIPTION / TARIFF SECTION ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black" style={{ color: "hsl(var(--foreground))" }}>Тариф размещения</h3>
            {user.isSubscribed && (
              <button
                onClick={() => setShowChangePlan(v => !v)}
                className="flex items-center gap-1 text-xs font-bold"
                style={{ color: "hsl(var(--primary))" }}
              >
                Изменить {showChangePlan ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {user.isSubscribed && !showChangePlan ? (
            /* Active subscription banner */
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "hsl(142 60% 42% / 0.12)", border: "1px solid hsl(142 60% 42% / 0.3)" }}>
              <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-500">Платное размещение активно</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Все функции платформы доступны</p>
              </div>
            </div>
          ) : (
            /* Plan cards — same as registration screen */
            <div className="space-y-3">
              {/* FREE */}
              <div className="rounded-xl p-4" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black" style={{ color: "hsl(var(--foreground))" }}>Бесплатно</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Базовое размещение</p>
                  </div>
                  <span className="font-black text-lg" style={{ color: "hsl(var(--foreground))" }}>0₽</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {["Профиль в каталоге", "До 3 объявлений в месяц", "Базовые фильтры"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <CheckCircle size={12} className="text-green-500" />{f}
                    </li>
                  ))}
                </ul>
                {user.isSubscribed && (
                  <button className="w-full mt-3 py-2 rounded-xl text-sm font-bold"
                    style={{ background: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    Перейти на бесплатный
                  </button>
                )}
              </div>

              {/* PAID */}
              <div className="rounded-xl p-4 relative"
                style={{ background: "hsl(var(--primary) / 0.08)", border: "2px solid hsl(var(--primary))" }}>
                <div className="absolute -top-3 left-4 gradient-primary text-white text-xs font-black px-3 py-0.5 rounded-full">
                  Популярный
                </div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-black" style={{ color: "hsl(var(--foreground))" }}>Платное</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Приоритет в поиске + расширенный профиль</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-lg gradient-primary-text">от {selectedAmount}₽</span>
                    <span className="text-xs block" style={{ color: "hsl(var(--muted-foreground))" }}>/мес</span>
                  </div>
                </div>

                {/* Amount input */}
                <div className="mb-3">
                  <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Сумма в месяц (от 300₽)
                  </label>
                  <input
                    type="number"
                    min={300}
                    value={selectedAmount}
                    onChange={e => setSelectedAmount(Math.max(300, Number(e.target.value)))}
                    className="glass-input text-base font-bold"
                    data-testid="input-subscription-amount"
                  />
                </div>

                <ul className="mb-3 space-y-1">
                  {["Приоритет в поиске", "Расширенный профиль", "До 10 фото", "Значок «Проверено»"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <CheckCircle size={12} className="text-green-500" />{f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setShowPayModal(true)}
                  className="w-full gradient-primary text-white font-black py-3 rounded-xl text-sm"
                  data-testid="button-subscribe"
                >
                  {user.isSubscribed ? "Изменить тариф" : "Подключить"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SUPPORT PROJECT SECTION ── */}
        <SupportProjectCard />

        {/* Logout */}
        <button onClick={() => { setUser(null); navigate("/"); }}
          className="flex items-center gap-2 text-sm font-semibold py-2"
          style={{ color: "hsl(var(--muted-foreground))" }} data-testid="button-logout">
          <LogOut size={16} /> Выйти
        </button>
      </div>

      {/* Payment modal */}
      {showPayModal && (
        <SubscriptionModal
          amount={selectedAmount}
          planName="paid"
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setUser({ ...user!, isSubscribed: true });
            setShowPayModal(false);
            setShowChangePlan(false);
          }}
        />
      )}
    </div>
  );
}
