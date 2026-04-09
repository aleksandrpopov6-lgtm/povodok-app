import { useState } from "react";
import { useHashLocation } from "wouter/use-hash-location";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useUser } from "@/components/ThemeProvider";
import { apiRequest } from "@/lib/queryClient";
import CatPawLogo, { BrandName } from "@/components/CatPawLogo";

/* ── Role data ── */
const ROLES = [
  {
    key: "volunteer",
    emoji: "🐾",
    label: "Я волонтёр",
    desc: "Пристраиваю животных, собираю донаты",
  },
  {
    key: "catcher",
    emoji: "🪤",
    label: "Я ловец",
    desc: "Отлавливаю бездомных животных, волонтёрски",
  },
  {
    key: "boarding",
    emoji: "🏠",
    label: "Передержка / Стационар",
    desc: "Принимаю животных на содержание",
  },
  {
    key: "clinic",
    emoji: "🏥",
    label: "Ветклиника",
    desc: "Лечу животных",
  },
  {
    key: "guest",
    emoji: "👁",
    label: "Просто помочь",
    desc: "Хочу помочь, усыновить",
  },
];

/* ── Catcher extra fields ── */
function CatcherFields({ value, onChange }: {
  value: any;
  onChange: (v: any) => void;
}) {
  const equipment = ["hasNet", "hasTrap", "hasCatTrap"];
  const eqLabels: Record<string, string> = { hasNet: "сочок", hasTrap: "ловушка", hasCatTrap: "котоловка" };

  return (
    <div className="space-y-3 mt-3 p-4 rounded-xl border border-border" style={{ background: "hsl(220 12% 10%)" }}>
      <p className="text-xs font-extrabold text-primary mb-1">Зона обслуживания</p>

      <input
        className="glass-input"
        placeholder="Адрес центра зоны (напр.: Москва, Выхино)"
        value={value.serviceArea || ""}
        onChange={e => onChange({ ...value, serviceArea: e.target.value })}
        data-testid="input-catcher-area"
      />

      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1">
          Радиус выезда: <span className="text-white font-bold">{value.serviceRadiusKm || 5} км</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={value.serviceRadiusKm || 5}
          onChange={e => onChange({ ...value, serviceRadiusKm: Number(e.target.value) })}
          className="w-full accent-primary"
          data-testid="slider-catcher-radius"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
          <span>1 км</span>
          <span>50 км</span>
        </div>
      </div>

      <div className="rounded-xl px-4 py-2.5 border border-green-800/40" style={{ background: "hsl(140 30% 8%)" }}>
        <p className="text-xs text-green-400 font-semibold">
          Ловцы работают бесплатно и помогают на волонтёрских началах
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Оборудование</p>
        <div className="flex flex-wrap gap-2">
          {equipment.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: !value[key] })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                value[key]
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
              data-testid={`toggle-equip-${key}`}
            >
              {eqLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Работает с</p>
        <div className="flex gap-2">
          {[["worksCats", "🐱 Кошки"], ["worksDogs", "🐶 Собаки"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: !value[key] })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                value[key]
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
              data-testid={`toggle-works-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Service row (clinic / boarding) ── */
type ServiceRow = { name: string; price: string };

function ServicesField({ services, onChange }: { services: ServiceRow[]; onChange: (v: ServiceRow[]) => void }) {
  const add = () => {
    if (services.length >= 10) return;
    onChange([...services, { name: "", price: "" }]);
  };
  const remove = (i: number) => onChange(services.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ServiceRow, val: string) => {
    const next = [...services];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {services.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="glass-input flex-1"
            placeholder="Название услуги"
            value={s.name}
            onChange={e => update(i, "name", e.target.value)}
            data-testid={`input-service-name-${i}`}
          />
          <input
            className="glass-input w-24"
            placeholder="₽"
            type="number"
            min={0}
            value={s.price}
            onChange={e => update(i, "price", e.target.value)}
            data-testid={`input-service-price-${i}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-1.5 rounded-full text-muted-foreground hover:text-red-400 transition-colors"
            data-testid={`btn-remove-service-${i}`}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      {services.length < 10 && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-2 text-xs font-bold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/10 transition-colors"
          data-testid="btn-add-service"
        >
          <Plus size={14} />
          Добавить услугу
        </button>
      )}
    </div>
  );
}

/* ── Clinic extra fields ── */
function ClinicFields({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const payOptions = ["СБП", "Банковская карта", "Наличные"];

  const togglePay = (pm: string) => {
    const cur: string[] = value.paymentMethods || [];
    const next = cur.includes(pm) ? cur.filter(x => x !== pm) : [...cur, pm];
    onChange({ ...value, paymentMethods: next });
  };

  return (
    <div className="space-y-3 mt-3 p-4 rounded-xl border border-border" style={{ background: "hsl(220 12% 10%)" }}>
      <p className="text-xs font-extrabold text-primary mb-1">Данные клиники</p>

      <input className="glass-input" placeholder="ИНН организации" value={value.inn || ""} onChange={e => onChange({ ...value, inn: e.target.value })} data-testid="input-clinic-inn" />
      <input className="glass-input" placeholder="Адрес клиники" value={value.address || ""} onChange={e => onChange({ ...value, address: e.target.value })} data-testid="input-clinic-address" />
      <input className="glass-input" placeholder="Контактный телефон" type="tel" value={value.contactPhone || ""} onChange={e => onChange({ ...value, contactPhone: e.target.value })} data-testid="input-clinic-phone" />
      <input className="glass-input" placeholder="Сайт (необязательно)" value={value.website || ""} onChange={e => onChange({ ...value, website: e.target.value })} data-testid="input-clinic-website" />
      <input className="glass-input" placeholder="Ссылка на Яндекс Карты (необязательно)" value={value.yandexMapsLink || ""} onChange={e => onChange({ ...value, yandexMapsLink: e.target.value })} data-testid="input-clinic-maps" />
      <input className="glass-input" placeholder="Режим работы (напр.: 9:00–21:00)" value={value.workingHours || ""} onChange={e => onChange({ ...value, workingHours: e.target.value })} data-testid="input-clinic-hours" />

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Услуги</p>
        <ServicesField
          services={value.services || []}
          onChange={s => onChange({ ...value, services: s })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Способы оплаты</p>
        <div className="flex flex-wrap gap-2">
          {payOptions.map(pm => {
            const cur: string[] = value.paymentMethods || [];
            return (
              <button
                key={pm}
                type="button"
                onClick={() => togglePay(pm)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  cur.includes(pm)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
                data-testid={`toggle-pay-${pm}`}
              >
                {pm}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subscription */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Тариф размещения</p>
        <div className="space-y-2">
          <div
            onClick={() => onChange({ ...value, subscription: "free" })}
            className={`rounded-xl p-3 border-2 cursor-pointer transition-all ${
              (value.subscription || "free") === "free"
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
            data-testid="btn-sub-free"
          >
            <p className="text-sm font-bold text-white">Бесплатно</p>
            <p className="text-xs text-muted-foreground">Базовое размещение</p>
          </div>
          <div
            onClick={() => onChange({ ...value, subscription: "paid" })}
            className={`rounded-xl p-3 border-2 cursor-pointer transition-all ${
              value.subscription === "paid"
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
            data-testid="btn-sub-paid"
          >
            <p className="text-sm font-bold text-white">Платное от 300₽/мес</p>
            <p className="text-xs text-muted-foreground">Приоритет в поиске + расширенный профиль</p>
            {value.subscription === "paid" && (
              <input
                className="glass-input mt-2"
                placeholder="Сумма (мин. 300₽/мес)"
                type="number"
                min={300}
                value={value.subscriptionAmount || ""}
                onChange={e => onChange({ ...value, subscriptionAmount: e.target.value })}
                onClick={e => e.stopPropagation()}
                data-testid="input-sub-amount"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Boarding extra fields ── */
function BoardingFields({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const payOptions = ["СБП", "Банковская карта", "Наличные"];

  const togglePay = (pm: string) => {
    const cur: string[] = value.paymentMethods || [];
    const next = cur.includes(pm) ? cur.filter(x => x !== pm) : [...cur, pm];
    onChange({ ...value, paymentMethods: next });
  };

  return (
    <div className="space-y-3 mt-3 p-4 rounded-xl border border-border" style={{ background: "hsl(220 12% 10%)" }}>
      <p className="text-xs font-extrabold text-primary mb-1">Данные передержки</p>

      <input className="glass-input" placeholder="Адрес" value={value.address || ""} onChange={e => onChange({ ...value, address: e.target.value })} data-testid="input-boarding-address" />
      <input className="glass-input" placeholder="Контактный телефон" type="tel" value={value.contactPhone || ""} onChange={e => onChange({ ...value, contactPhone: e.target.value })} data-testid="input-boarding-phone" />
      <input className="glass-input" placeholder="Сайт (необязательно)" value={value.website || ""} onChange={e => onChange({ ...value, website: e.target.value })} data-testid="input-boarding-website" />
      <input className="glass-input" placeholder="Ссылка на Яндекс Карты (необязательно)" value={value.yandexMapsLink || ""} onChange={e => onChange({ ...value, yandexMapsLink: e.target.value })} data-testid="input-boarding-maps" />
      <input className="glass-input" placeholder="Режим работы (напр.: 9:00–21:00)" value={value.workingHours || ""} onChange={e => onChange({ ...value, workingHours: e.target.value })} data-testid="input-boarding-hours" />

      <div className="grid grid-cols-2 gap-2">
        <input
          className="glass-input"
          placeholder="Цена/сут для кошки (₽)"
          type="number"
          min={0}
          value={value.priceCatPerDay || ""}
          onChange={e => onChange({ ...value, priceCatPerDay: e.target.value })}
          data-testid="input-price-cat"
        />
        <input
          className="glass-input"
          placeholder="Цена/сут для собаки (₽)"
          type="number"
          min={0}
          value={value.priceDogPerDay || ""}
          onChange={e => onChange({ ...value, priceDogPerDay: e.target.value })}
          data-testid="input-price-dog"
        />
      </div>

      <input
        className="glass-input"
        placeholder="Количество мест (вместимость)"
        type="number"
        min={1}
        value={value.capacity || ""}
        onChange={e => onChange({ ...value, capacity: e.target.value })}
        data-testid="input-capacity"
      />

      <div className="flex flex-col gap-2">
        {[
          { key: "acceptsWild", label: "Принимаем диких животных" },
          { key: "hasIsolationBox", label: "Есть бокс для инфекционных" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value[key]}
              onChange={e => onChange({ ...value, [key]: e.target.checked })}
              className="w-4 h-4 accent-primary"
              data-testid={`toggle-${key}`}
            />
            <span className="text-sm text-white">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Услуги</p>
        <ServicesField
          services={value.services || []}
          onChange={s => onChange({ ...value, services: s })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Способы оплаты</p>
        <div className="flex flex-wrap gap-2">
          {payOptions.map(pm => {
            const cur: string[] = value.paymentMethods || [];
            return (
              <button
                key={pm}
                type="button"
                onClick={() => togglePay(pm)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  cur.includes(pm)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
                data-testid={`toggle-boarding-pay-${pm}`}
              >
                {pm}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subscription */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Тариф размещения</p>
        <div className="space-y-2">
          <div
            onClick={() => onChange({ ...value, subscription: "free" })}
            className={`rounded-xl p-3 border-2 cursor-pointer transition-all ${
              (value.subscription || "free") === "free"
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
            data-testid="btn-boarding-sub-free"
          >
            <p className="text-sm font-bold text-white">Бесплатно</p>
            <p className="text-xs text-muted-foreground">Базовое размещение</p>
          </div>
          <div
            onClick={() => onChange({ ...value, subscription: "paid" })}
            className={`rounded-xl p-3 border-2 cursor-pointer transition-all ${
              value.subscription === "paid"
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
            data-testid="btn-boarding-sub-paid"
          >
            <p className="text-sm font-bold text-white">Платное от 300₽/мес</p>
            <p className="text-xs text-muted-foreground">Приоритет в поиске + расширенный профиль</p>
            {value.subscription === "paid" && (
              <input
                className="glass-input mt-2"
                placeholder="Сумма (мин. 300₽/мес)"
                type="number"
                min={300}
                value={value.subscriptionAmount || ""}
                onChange={e => onChange({ ...value, subscriptionAmount: e.target.value })}
                onClick={e => e.stopPropagation()}
                data-testid="input-boarding-sub-amount"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AuthPage() {
  const [, navigate] = useHashLocation();
  const { setUser } = useUser();

  const [tab, setTab] = useState<"register" | "login">("register");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register base state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("guest");

  // Role-specific extra data
  const [catcherData, setCatcherData] = useState<any>({
    serviceArea: "",
    serviceRadiusKm: 5,
    hasNet: false,
    hasTrap: false,
    hasCatTrap: false,
    worksCats: true,
    worksDogs: false,
  });
  const [clinicData, setClinicData] = useState<any>({
    inn: "",
    address: "",
    contactPhone: "",
    website: "",
    yandexMapsLink: "",
    workingHours: "",
    services: [],
    paymentMethods: [],
    subscription: "free",
    subscriptionAmount: "",
  });
  const [boardingData, setBoardingData] = useState<any>({
    address: "",
    contactPhone: "",
    website: "",
    yandexMapsLink: "",
    workingHours: "",
    priceCatPerDay: "",
    priceDogPerDay: "",
    capacity: "",
    acceptsWild: false,
    hasIsolationBox: false,
    services: [],
    paymentMethods: [],
    subscription: "free",
    subscriptionAmount: "",
  });

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const buildExtraData = () => {
    if (regRole === "catcher") return catcherData;
    if (regRole === "clinic") return clinicData;
    if (regRole === "boarding") return boardingData;
    return {};
  };

  const registerMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/auth/register", {
        name: regName,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        city: "Москва",
        createdAt: new Date().toISOString(),
        ...buildExtraData(),
      }),
    onSuccess: async (res) => {
      const data = await res.json();
      setUser({
        id: data.id,
        name: data.name,
        phone: data.phone,
        role: data.role,
        isSubscribed: data.isSubscribed ?? false,
      });
      navigate("/");
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Ошибка регистрации. Попробуйте другой телефон.");
    },
  });

  const loginMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/auth/login", {
        phone: loginPhone,
        password: loginPassword,
      }),
    onSuccess: async (res) => {
      const data = await res.json();
      setUser({
        id: data.id,
        name: data.name,
        phone: data.phone,
        role: data.role,
        isSubscribed: data.isSubscribed ?? false,
      });
      navigate("/");
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Неверный телефон или пароль.");
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regName || !regPhone || !regPassword) {
      setErrorMsg("Заполните все поля");
      return;
    }
    registerMutation.mutate();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginPhone || !loginPassword) {
      setErrorMsg("Введите телефон и пароль");
      return;
    }
    loginMutation.mutate();
  };

  const switchTab = (t: "register" | "login") => {
    setTab(t);
    setErrorMsg(null);
  };

  return (
    <div className="page">
      {/* Back button */}
      <div className="app-header flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          data-testid="btn-back"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <span className="text-base font-bold text-muted-foreground">Назад</span>
      </div>

      <div className="px-4 pt-8 pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <CatPawLogo size={64} />
          <BrandName size="text-3xl" className="mt-3" />
          <p className="text-sm text-muted-foreground mt-1">Помоги питомцу найти дом</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 p-1 rounded-full" style={{ background: "hsl(220 12% 14%)" }}>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-2.5 rounded-full font-extrabold text-sm transition-all ${
              tab === "register"
                ? "gradient-primary text-white shadow-md"
                : "text-muted-foreground"
            }`}
            data-testid="tab-register"
          >
            Регистрация
          </button>
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-2.5 rounded-full font-extrabold text-sm transition-all ${
              tab === "login"
                ? "gradient-primary text-white shadow-md"
                : "text-muted-foreground"
            }`}
            data-testid="tab-login"
          >
            Вход
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "register" ? (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="space-y-3"
            >
              <input
                className="glass-input"
                placeholder="Ваше имя *"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                data-testid="input-reg-name"
              />
              <input
                className="glass-input"
                placeholder="Телефон (+7...) *"
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                data-testid="input-reg-phone"
              />
              <input
                className="glass-input"
                placeholder="Пароль *"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                data-testid="input-reg-password"
              />

              {/* Role selector */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">Кто вы?</p>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((role) => (
                    <div
                      key={role.key}
                      className={`role-card ${regRole === role.key ? "selected" : ""}`}
                      onClick={() => setRegRole(role.key)}
                      data-testid={`role-card-${role.key}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{role.emoji}</span>
                        <div>
                          <p className="font-extrabold text-sm text-white">{role.label}</p>
                          <p className="text-xs text-muted-foreground">{role.desc}</p>
                        </div>
                        {regRole === role.key && (
                          <div className="ml-auto w-4 h-4 rounded-full gradient-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role-specific extra fields */}
              <AnimatePresence>
                {regRole === "catcher" && (
                  <motion.div
                    key="catcher-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CatcherFields value={catcherData} onChange={setCatcherData} />
                  </motion.div>
                )}
                {regRole === "clinic" && (
                  <motion.div
                    key="clinic-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ClinicFields value={clinicData} onChange={setClinicData} />
                  </motion.div>
                )}
                {regRole === "boarding" && (
                  <motion.div
                    key="boarding-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <BoardingFields value={boardingData} onChange={setBoardingData} />
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMsg && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: "hsl(0 70% 50% / 0.12)", color: "hsl(0 70% 65%)", border: "1px solid hsl(0 70% 50% / 0.3)" }}
                  data-testid="error-register"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full gradient-primary text-white font-extrabold py-3.5 rounded-xl text-base transition-opacity hover:opacity-90 mt-2"
                disabled={registerMutation.isPending}
                data-testid="btn-register-submit"
              >
                {registerMutation.isPending ? "Регистрируем..." : "Зарегистрироваться"}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Демо: войдите с любым телефоном и паролем
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="space-y-3"
            >
              <input
                className="glass-input"
                placeholder="Телефон *"
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                data-testid="input-login-phone"
              />
              <input
                className="glass-input"
                placeholder="Пароль *"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                data-testid="input-login-password"
              />

              {errorMsg && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: "hsl(0 70% 50% / 0.12)", color: "hsl(0 70% 65%)", border: "1px solid hsl(0 70% 50% / 0.3)" }}
                  data-testid="error-login"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full gradient-primary text-white font-extrabold py-3.5 rounded-xl text-base transition-opacity hover:opacity-90 mt-2"
                disabled={loginMutation.isPending}
                data-testid="btn-login-submit"
              >
                {loginMutation.isPending ? "Входим..." : "Войти"}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Демо: войдите с любым телефоном и паролем
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
