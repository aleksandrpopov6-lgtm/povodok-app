import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import {
  users, animals, catchers, boardings, clinics, volunteerAds,
  catchRequests, helpRequests, successStories, reviews,
  type User, type InsertUser,
  type Animal, type InsertAnimal,
  type Catcher, type InsertCatcher,
  type Boarding, type InsertBoarding,
  type Clinic, type InsertClinic,
  type VolunteerAd, type InsertVolunteerAd,
  type CatchRequest, type InsertCatchRequest,
  type HelpRequest, type InsertHelpRequest,
  type SuccessStory, type InsertSuccessStory,
  type Review, type InsertReview,
} from "@shared/schema";

const sqlite = new Database("lapki.db");
export const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest',
    avatar_url TEXT,
    city TEXT NOT NULL DEFAULT 'Москва',
    is_subscribed INTEGER NOT NULL DEFAULT 0,
    subscription_expiry TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    age TEXT NOT NULL,
    description TEXT NOT NULL,
    story TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    video_url TEXT,
    status TEXT NOT NULL DEFAULT 'needs_help',
    needs_food INTEGER NOT NULL DEFAULT 1,
    needs_shelter INTEGER NOT NULL DEFAULT 0,
    needs_medical INTEGER NOT NULL DEFAULT 0,
    needs_home INTEGER NOT NULL DEFAULT 1,
    found_date TEXT NOT NULL,
    location TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS catchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    photo_url TEXT,
    description TEXT NOT NULL,
    metro TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Москва',
    price_in_mkad REAL NOT NULL DEFAULT 0,
    price_out_mkad REAL,
    service_area TEXT,
    service_radius_km REAL NOT NULL DEFAULT 5,
    works_cats INTEGER NOT NULL DEFAULT 1,
    works_dogs INTEGER NOT NULL DEFAULT 1,
    has_net INTEGER NOT NULL DEFAULT 0,
    has_trap INTEGER NOT NULL DEFAULT 0,
    has_cat_trap INTEGER NOT NULL DEFAULT 0,
    experience TEXT,
    rating REAL NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS boardings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    metro TEXT NOT NULL,
    photo_url TEXT,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'boarding',
    inn TEXT,
    website TEXT,
    yandex_maps_link TEXT,
    photos TEXT,
    services TEXT,
    payment_methods TEXT,
    price_per_day REAL NOT NULL,
    price_per_day_cat REAL,
    price_per_day_dog REAL,
    accepts_wild INTEGER NOT NULL DEFAULT 0,
    has_isolation_box INTEGER NOT NULL DEFAULT 0,
    accepts_cats INTEGER NOT NULL DEFAULT 1,
    accepts_dogs INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER,
    available_slots INTEGER,
    working_hours TEXT,
    rating REAL NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    metro TEXT NOT NULL,
    photo_url TEXT,
    description TEXT NOT NULL,
    inn TEXT,
    website TEXT,
    yandex_maps_link TEXT,
    photos TEXT,
    services TEXT,
    payment_methods TEXT,
    works_with_wild INTEGER NOT NULL DEFAULT 0,
    has_emergency INTEGER NOT NULL DEFAULT 0,
    has_surgery INTEGER NOT NULL DEFAULT 0,
    works_cats INTEGER NOT NULL DEFAULT 1,
    works_dogs INTEGER NOT NULL DEFAULT 1,
    price_consultation REAL,
    working_hours TEXT,
    is_round_clock INTEGER NOT NULL DEFAULT 0,
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    subscription_amount REAL,
    rating REAL NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS volunteer_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_phone TEXT NOT NULL,
    title TEXT NOT NULL,
    animal_name TEXT NOT NULL,
    animal_type TEXT NOT NULL,
    animal_age TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    video_url TEXT,
    ad_type TEXT NOT NULL,
    donation_needed REAL,
    donation_collected REAL NOT NULL DEFAULT 0,
    bank_card TEXT,
    sbp_phone TEXT,
    tinkoff_link TEXT,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS catch_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catcher_id INTEGER NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    animal_type TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    help_type TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    user_id INTEGER,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS success_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    new_owner_name TEXT NOT NULL,
    photo_before TEXT NOT NULL,
    photo_after TEXT NOT NULL,
    story_text TEXT NOT NULL,
    rehomed_date TEXT NOT NULL
  );
`);

// ── Seed ──────────────────────────────────────────────────────────────────
const animalCount = (sqlite.prepare("SELECT COUNT(*) as c FROM animals").get() as any).c;
if (animalCount === 0) {
  sqlite.exec(`
    INSERT INTO animals (name,type,age,description,story,photo_url,status,needs_food,needs_shelter,needs_medical,needs_home,found_date,location) VALUES
    ('Мурка','cat','котёнок','Ласковая рыжая кошечка, привита, обработана от паразитов.','Нашла у мусорного контейнера — маленькая, грязная, напуганная. Отмыла, вылечила ушной клещ.','https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600','needs_help',1,0,0,1,'2026-03-15','Москва, Южное Бутово'),
    ('Барсик','cat','взрослый','Степенный серый кот, спокойный, ладит с детьми. Кастрирован.','Жил на улице несколько лет. Соседи кормили, но когда пришла зима — забрала его.','https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600','needs_help',1,1,0,1,'2026-02-20','Москва, Чертаново'),
    ('Рыжик','dog','молодой','Энергичный пёс, любит людей. Знает «сидеть» и «дай лапу». Привит, чипирован.','Бросили прямо на трассе — бегал между машинами. Забрала почти под колёсами.','https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600','needs_help',1,1,0,1,'2026-03-01','Москва, Бирюлёво'),
    ('Снежинка','cat','молодой','Белоснежная красавица с голубыми глазами. Тихая и нежная.','Принесли в коробке — кто-то подбросил у подъезда зимой.','https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=600','needs_help',0,0,1,1,'2026-01-10','Москва, Тёплый Стан'),
    ('Шарик','dog','взрослый','Добрейшая дворняга, большой и пушистый, очень ласковый.','Три зимы жил возле рынка. Построила ему домик, теперь ищу семью.','https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600','needs_help',1,0,0,1,'2025-12-05','Москва, Коломенское');
  `);
}

const catcherCount = (sqlite.prepare("SELECT COUNT(*) as c FROM catchers").get() as any).c;
if (catcherCount === 0) {
  sqlite.exec(`
    INSERT INTO users (name,phone,password_hash,role,city,is_subscribed,created_at) VALUES
    ('Андрей Ловцов','+79161234567','$2b$12$LQv3c1yqBwEHxv1LUUoTle.4p6GqbxKe/LGX/vSZBqLR2ZOoUqJLO','catcher','Москва',0,'2026-01-01'),
    ('Сергей Профи','+79031112233','$2b$12$LQv3c1yqBwEHxv1LUUoTle.4p6GqbxKe/LGX/vSZBqLR2ZOoUqJLO','catcher','Москва',0,'2026-01-15'),
    ('Наталья Кошкина','+79265554433','$2b$12$LQv3c1yqBwEHxv1LUUoTle.4p6GqbxKe/LGX/vSZBqLR2ZOoUqJLO','catcher','Москва',0,'2026-02-01');
    INSERT INTO catchers (user_id,name,phone,photo_url,description,metro,service_area,service_radius_km,price_in_mkad,works_cats,works_dogs,has_net,has_trap,has_cat_trap,experience,rating,review_count,is_active,created_at) VALUES
    (1,'Андрей Ловцов','+79161234567','https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400','Профессиональный отлов кошек и собак. Работаю тихо, без стресса для животного. Все виды оборудования.','Выхино','Москва, Выхино',7,0,1,1,1,1,1,'7 лет',4.9,23,1,'2026-01-01'),
    (2,'Сергей Профи','+79031112233','https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400','Специализируюсь на диких/агрессивных животных. Опыт работы с ТСН и муниципалитетами.','Тушинская','Москва, Тушинская',10,0,1,1,1,1,0,'10 лет',5.0,41,1,'2026-01-15'),
    (3,'Наталья Кошкина','+79265554433','https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400','Отлавливаю только кошек. Мягкий метод без стресса.','Новогиреево','Москва, Новогиреево',5,0,1,0,0,0,1,'3 года',4.8,12,1,'2026-02-01');
  `);
}

const boardingCount = (sqlite.prepare("SELECT COUNT(*) as c FROM boardings").get() as any).c;
if (boardingCount === 0) {
  sqlite.exec(`
    INSERT INTO boardings (name,phone,address,metro,photo_url,description,type,yandex_maps_link,photos,services,payment_methods,price_per_day,price_per_day_cat,price_per_day_dog,accepts_wild,has_isolation_box,accepts_cats,accepts_dogs,capacity,available_slots,working_hours,rating,review_count,is_active,created_at) VALUES
    ('Передержка "Добрые руки"','+74951234567','ул. Профсоюзная, 120, Москва','Профсоюзная','https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600','Уютная домашняя передержка. Животные живут в отдельных вольерах. Кормление 3 раза в день. Прогулки 2 раза в день. Ежедневные отчёты хозяевам.','boarding','https://yandex.ru/maps/?text=ул.+Профсоюзная+120+Москва','["https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600","https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=600","https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600"]','[{"name":"Передержка кошки","price":350},{"name":"Передержка собаки до 10 кг","price":450},{"name":"Передержка собаки от 10 кг","price":550},{"name":"Ветеринарный осмотр","price":500}]','["СБП","Банковская карта","Наличные"]',400,350,500,1,1,1,1,15,4,'9:00–21:00',4.8,34,1,'2026-01-10'),
    ('Стационар "Айболит"','+74959876543','Варшавское шоссе, 55, Москва','Варшавская','https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600','Стационар при ветклинике. Круглосуточное наблюдение врачей. Есть бокс для инфекционных.','hospital_ward','https://yandex.ru/maps/?text=Варшавское+шоссе+55+Москва','["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600","https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600"]','[{"name":"Стационар стандарт","price":800},{"name":"Стационар интенсив","price":1200},{"name":"Капельница","price":600}]','["СБП","Банковская карта"]',800,700,900,1,1,1,1,20,6,'Круглосуточно',4.9,56,1,'2026-01-05');
  `);
}

const clinicCount = (sqlite.prepare("SELECT COUNT(*) as c FROM clinics").get() as any).c;
if (clinicCount === 0) {
  sqlite.exec(`
    INSERT INTO clinics (name,phone,address,metro,photo_url,description,yandex_maps_link,photos,services,payment_methods,works_with_wild,has_emergency,has_surgery,works_cats,works_dogs,price_consultation,working_hours,is_round_clock,subscription_plan,subscription_amount,rating,review_count,is_active,created_at) VALUES
    ('Ветклиника "Зоовет"','+74952345678','Дмитровское шоссе, 71к1, Москва','Петровско-Разумовская','https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600','Работаем с дикими и уличными животными. Бесплатная первичная помощь для отловленных.','https://yandex.ru/maps/?text=Дмитровское+шоссе+71к1+Москва','["https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600","https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600"]','[{"name":"Первичная консультация","price":800},{"name":"Вакцинация","price":600},{"name":"УЗИ","price":1500},{"name":"Кастрация кота","price":3500},{"name":"Стерилизация кошки","price":5000}]','["СБП","Банковская карта","Наличные"]',1,1,1,1,1,800,'9:00–21:00',0,'paid',500,4.9,87,1,'2025-11-01'),
    ('СВЦ "Белый клык"','+74953456789','пр. Мира, 188, Москва','Ботанический сад','https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600','Круглосуточная экстренная помощь. Операционная, реанимация. С дикими работаем.','https://yandex.ru/maps/?text=пр.+Мира+188+Москва','["https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600"]','[{"name":"Экстренная консультация","price":1200},{"name":"Операция","price":8000},{"name":"Реанимация (сутки)","price":3500}]','["СБП","Банковская карта"]',1,1,1,1,1,1200,'Круглосуточно',1,'paid',300,4.8,63,1,'2025-10-15'),
    ('Ветамбулатория "Лапа"','+74954567890','ул. Братиславская, 12, Москва','Братиславская','https://images.unsplash.com/photo-1559190394-df5a28aab5c5?w=600','Доступные цены, работаем с бездомными по льготному тарифу.','https://yandex.ru/maps/?text=ул.+Братиславская+12+Москва','["https://images.unsplash.com/photo-1559190394-df5a28aab5c5?w=600"]','[{"name":"Консультация","price":500},{"name":"Вакцинация","price":400}]','["Наличные","СБП"]',0,0,0,1,1,500,'10:00–20:00',0,'free',null,4.7,41,1,'2025-12-01');
  `);
}

const adCount = (sqlite.prepare("SELECT COUNT(*) as c FROM volunteer_ads").get() as any).c;
if (adCount === 0) {
  sqlite.exec(`
    INSERT INTO users (name,phone,password_hash,role,city,is_subscribed,created_at) VALUES
    ('Виолета','+79990001122','$2b$12$LQv3c1yqBwEHxv1LUUoTle.4p6GqbxKe/LGX/vSZBqLR2ZOoUqJLO','volunteer','Москва',1,'2026-01-01');
    INSERT INTO volunteer_ads (user_id,author_name,author_phone,title,animal_name,animal_type,animal_age,description,photo_url,ad_type,donation_needed,donation_collected,bank_card,sbp_phone,location,status,created_at) VALUES
    (4,'Виолета','+79990001122','Котёнок Персик ищет дом','Персик','cat','котёнок','Подобрала на улице, уже привит, здоров.','https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600','rehome',NULL,0,NULL,'+79990001122','Москва, Тёплый Стан','active','2026-03-10'),
    (4,'Виолета','+79990001122','Собираем на операцию Барону','Барон','dog','взрослый','Дворняга попал под машину. Нужна операция на лапу — 18 000₽.','https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600','treatment',18000,7400,'2200 7010 1234 5678','+79990001122','Москва, Бирюлёво','active','2026-03-20');
  `);
}

// ── Storage interface ──────────────────────────────────────────────────────
export interface IStorage {
  getUser(id: number): User | undefined;
  getUserByPhone(phone: string): User | undefined;
  createUser(data: InsertUser): User;
  updateUser(id: number, data: { name?: string; avatarUrl?: string | null; city?: string }): User | undefined;
  updateUserRole(id: number, role: string): User | undefined;
  updateUserSubscription(id: number, expiry: string): User | undefined;

  getAnimals(status?: string): Animal[];
  getAnimal(id: number): Animal | undefined;
  createAnimal(data: InsertAnimal): Animal;
  updateAnimalStatus(id: number, status: string): Animal | undefined;

  getCatchers(filters?: any): Catcher[];
  getCatcher(id: number): Catcher | undefined;
  createCatcher(data: InsertCatcher): Catcher;
  updateCatcherPrice(id: number, priceInMkad: number, priceOutMkad: number | null): Catcher | undefined;

  getBoardings(filters?: any): Boarding[];
  getBoarding(id: number): Boarding | undefined;
  createBoarding(data: InsertBoarding): Boarding;

  getClinics(filters?: any): Clinic[];
  getClinic(id: number): Clinic | undefined;
  createClinic(data: InsertClinic): Clinic;

  getVolunteerAds(filters?: any): VolunteerAd[];
  getVolunteerAd(id: number): VolunteerAd | undefined;
  createVolunteerAd(data: InsertVolunteerAd): VolunteerAd;

  createCatchRequest(data: InsertCatchRequest): CatchRequest;
  createHelpRequest(data: InsertHelpRequest): HelpRequest;

  getReviews(targetType: string, targetId: number): Review[];
  createReview(data: InsertReview): Review;

  getSuccessStories(): (SuccessStory & { animal?: Animal })[];
  createSuccessStory(data: InsertSuccessStory): SuccessStory;

  getStats(): object;
}

export class Storage implements IStorage {
  getUser(id: number) { return db.select().from(users).where(eq(users.id, id)).get(); }
  getUserByPhone(phone: string) { return db.select().from(users).where(eq(users.phone, phone)).get(); }
  createUser(data: InsertUser) { return db.insert(users).values(data).returning().get(); }
  updateUser(id: number, data: { name?: string; avatarUrl?: string | null; city?: string }) {
    return db.update(users).set(data as any).where(eq(users.id, id)).returning().get();
  }
  updateUserRole(id: number, role: string) { return db.update(users).set({ role }).where(eq(users.id, id)).returning().get(); }
  updateUserSubscription(id: number, expiry: string) { return db.update(users).set({ isSubscribed: true, subscriptionExpiry: expiry }).where(eq(users.id, id)).returning().get(); }

  getAnimals(status?: string) {
    return status ? db.select().from(animals).where(eq(animals.status, status)).all() : db.select().from(animals).all();
  }
  getAnimal(id: number) { return db.select().from(animals).where(eq(animals.id, id)).get(); }
  createAnimal(data: InsertAnimal) { return db.insert(animals).values(data).returning().get(); }
  updateAnimalStatus(id: number, status: string) { return db.update(animals).set({ status }).where(eq(animals.id, id)).returning().get(); }

  getCatchers(filters?: any) {
    return db.select().from(catchers).where(eq(catchers.isActive, true)).all().filter((c: any) => {
      if (filters?.metro && !c.metro.toLowerCase().includes(filters.metro.toLowerCase())) return false;
      if (filters?.worksCats === true && !c.worksCats) return false;
      if (filters?.worksDogs === true && !c.worksDogs) return false;
      return true;
    });
  }
  getCatcher(id: number) { return db.select().from(catchers).where(eq(catchers.id, id)).get(); }
  createCatcher(data: InsertCatcher) { return db.insert(catchers).values(data).returning().get(); }
  updateCatcherPrice(id: number, priceInMkad: number, priceOutMkad: number | null) {
    return db.update(catchers).set({ priceInMkad, priceOutMkad }).where(eq(catchers.id, id)).returning().get();
  }

  getBoardings(filters?: any) {
    return db.select().from(boardings).where(eq(boardings.isActive, true)).all().filter((b: any) => {
      if (filters?.metro && !b.metro.toLowerCase().includes(filters.metro.toLowerCase())) return false;
      if (filters?.maxPrice && b.pricePerDay > filters.maxPrice) return false;
      if (filters?.acceptsWild === true && !b.acceptsWild) return false;
      if (filters?.hasIsolationBox === true && !b.hasIsolationBox) return false;
      if (filters?.type && b.type !== filters.type) return false;
      return true;
    });
  }
  getBoarding(id: number) { return db.select().from(boardings).where(eq(boardings.id, id)).get(); }
  createBoarding(data: InsertBoarding) { return db.insert(boardings).values(data).returning().get(); }

  getClinics(filters?: any) {
    return db.select().from(clinics).where(eq(clinics.isActive, true)).all().filter((c: any) => {
      if (filters?.metro && !c.metro.toLowerCase().includes(filters.metro.toLowerCase())) return false;
      if (filters?.worksWithWild === true && !c.worksWithWild) return false;
      if (filters?.isRoundClock === true && !c.isRoundClock) return false;
      return true;
    });
  }
  getClinic(id: number) { return db.select().from(clinics).where(eq(clinics.id, id)).get(); }
  createClinic(data: InsertClinic) { return db.insert(clinics).values(data).returning().get(); }

  getVolunteerAds(filters?: any) {
    return db.select().from(volunteerAds).where(eq(volunteerAds.status, "active")).all().filter((a: any) => {
      if (filters?.adType && a.adType !== filters.adType) return false;
      if (filters?.animalType && a.animalType !== filters.animalType) return false;
      return true;
    });
  }
  getVolunteerAd(id: number) { return db.select().from(volunteerAds).where(eq(volunteerAds.id, id)).get(); }
  createVolunteerAd(data: InsertVolunteerAd) { return db.insert(volunteerAds).values(data).returning().get(); }

  createCatchRequest(data: InsertCatchRequest) { return db.insert(catchRequests).values(data).returning().get(); }
  createHelpRequest(data: InsertHelpRequest) { return db.insert(helpRequests).values(data).returning().get(); }

  getReviews(targetType: string, targetId: number) {
    return db.select().from(reviews).where(eq(reviews.targetId, targetId)).all().filter((r: any) => r.targetType === targetType);
  }
  createReview(data: InsertReview) {
    const review = db.insert(reviews).values(data).returning().get();
    // Recalculate average rating
    const allReviews = this.getReviews(data.targetType, data.targetId);
    const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
    if (data.targetType === "clinic") {
      db.update(clinics).set({ rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length }).where(eq(clinics.id, data.targetId)).run();
    } else if (data.targetType === "boarding") {
      db.update(boardings).set({ rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length }).where(eq(boardings.id, data.targetId)).run();
    }
    return review;
  }

  getSuccessStories() {
    return db.select().from(successStories).all().map((s: any) => ({
      ...s,
      animal: db.select().from(animals).where(eq(animals.id, s.animalId)).get(),
    }));
  }
  createSuccessStory(data: InsertSuccessStory) { return db.insert(successStories).values(data).returning().get(); }

  getStats() {
    const allAnimals = db.select().from(animals).all();
    return {
      animals: allAnimals.filter((a: any) => a.status === "needs_help").length,
      catchers: db.select().from(catchers).where(eq(catchers.isActive, true)).all().length,
      boardings: db.select().from(boardings).where(eq(boardings.isActive, true)).all().length,
      clinics: db.select().from(clinics).where(eq(clinics.isActive, true)).all().length,
      volunteerAds: db.select().from(volunteerAds).where(eq(volunteerAds.status, "active")).all().length,
      rehomed: allAnimals.filter((a: any) => a.status === "rehomed").length,
    };
  }
}

export const storage = new Storage();
