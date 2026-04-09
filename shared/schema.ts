import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS & ROLES ───────────────────────────────────────────────────────────
// Roles: guest | volunteer | catcher | clinic | boarding | admin
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("guest"), // guest | volunteer | catcher | clinic | boarding | admin
  avatarUrl: text("avatar_url"),
  city: text("city").notNull().default("Москва"),
  isSubscribed: integer("is_subscribed", { mode: "boolean" }).notNull().default(false),
  subscriptionExpiry: text("subscription_expiry"),
  createdAt: text("created_at").notNull(),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── CATCHERS ────────────────────────────────────────────────────────────────
export const catchers = sqliteTable("catchers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  photoUrl: text("photo_url"),
  description: text("description").notNull(),
  metro: text("metro").notNull(),           // station name
  city: text("city").notNull().default("Москва"),
  priceInMkad: real("price_in_mkad").notNull().default(0),  // ловцы работают бесплатно, 0 по умолчанию
  priceOutMkad: real("price_out_mkad"),
  serviceArea: text("service_area"),       // адрес центра зоны обслуживания
  serviceRadiusKm: real("service_radius_km").notNull().default(5), // радиус в км
  worksCats: integer("works_cats", { mode: "boolean" }).notNull().default(true),
  worksDogs: integer("works_dogs", { mode: "boolean" }).notNull().default(true),
  hasNet: integer("has_net", { mode: "boolean" }).notNull().default(false),           // сочок
  hasTrap: integer("has_trap", { mode: "boolean" }).notNull().default(false),         // ловушка
  hasCatTrap: integer("has_cat_trap", { mode: "boolean" }).notNull().default(false),  // котоловка
  experience: text("experience"),           // опыт в годах или описание
  rating: real("rating").notNull().default(5.0),
  reviewCount: integer("review_count").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});
export const insertCatcherSchema = createInsertSchema(catchers).omit({ id: true });
export type InsertCatcher = z.infer<typeof insertCatcherSchema>;
export type Catcher = typeof catchers.$inferSelect;

// ─── BOARDING / SHELTERS (передержки и стационары) ───────────────────────────
export const boardings = sqliteTable("boardings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  metro: text("metro").notNull(),
  photoUrl: text("photo_url"),
  description: text("description").notNull(),
  type: text("type").notNull().default("boarding"), // boarding | shelter | hospital_ward
  inn: text("inn"),
  website: text("website"),
  yandexMapsLink: text("yandex_maps_link"),
  photos: text("photos"),               // JSON array of up to 10 URLs
  services: text("services"),           // JSON array of {name, price}
  paymentMethods: text("payment_methods"), // JSON array
  pricePerDay: real("price_per_day").notNull(),
  pricePerDayCat: real("price_per_day_cat"),
  pricePerDayDog: real("price_per_day_dog"),
  acceptsWild: integer("accepts_wild", { mode: "boolean" }).notNull().default(false),
  hasIsolationBox: integer("has_isolation_box", { mode: "boolean" }).notNull().default(false),
  acceptsCats: integer("accepts_cats", { mode: "boolean" }).notNull().default(true),
  acceptsDogs: integer("accepts_dogs", { mode: "boolean" }).notNull().default(true),
  capacity: integer("capacity"),
  availableSlots: integer("available_slots"),
  workingHours: text("working_hours"),
  rating: real("rating").notNull().default(5.0),
  reviewCount: integer("review_count").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});
export const insertBoardingSchema = createInsertSchema(boardings).omit({ id: true });
export type InsertBoarding = z.infer<typeof insertBoardingSchema>;
export type Boarding = typeof boardings.$inferSelect;

// ─── VET CLINICS ─────────────────────────────────────────────────────────────
export const clinics = sqliteTable("clinics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  metro: text("metro").notNull(),
  photoUrl: text("photo_url"),
  description: text("description").notNull(),
  inn: text("inn"),
  website: text("website"),
  yandexMapsLink: text("yandex_maps_link"),
  photos: text("photos"),               // JSON array of up to 10 URLs
  services: text("services"),           // JSON array of {name, price}
  paymentMethods: text("payment_methods"), // JSON array
  worksWithWild: integer("works_with_wild", { mode: "boolean" }).notNull().default(false),
  hasEmergency: integer("has_emergency", { mode: "boolean" }).notNull().default(false),
  hasSurgery: integer("has_surgery", { mode: "boolean" }).notNull().default(false),
  worksCats: integer("works_cats", { mode: "boolean" }).notNull().default(true),
  worksDogs: integer("works_dogs", { mode: "boolean" }).notNull().default(true),
  priceConsultation: real("price_consultation"),
  workingHours: text("working_hours"),
  isRoundClock: integer("is_round_clock", { mode: "boolean" }).notNull().default(false),
  subscriptionPlan: text("subscription_plan").notNull().default("free"), // free | paid
  subscriptionAmount: real("subscription_amount"),  // мин 300₽/мес
  rating: real("rating").notNull().default(5.0),
  reviewCount: integer("review_count").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});
export const insertClinicSchema = createInsertSchema(clinics).omit({ id: true });
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinics.$inferSelect;

// ─── VOLUNTEER ADS (объявления о пристройстве / сборе средств) ───────────────
export const volunteerAds = sqliteTable("volunteer_ads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  authorPhone: text("author_phone").notNull(),
  title: text("title").notNull(),
  animalName: text("animal_name").notNull(),
  animalType: text("animal_type").notNull(), // cat | dog | other
  animalAge: text("animal_age").notNull(),
  description: text("description").notNull(),
  photoUrl: text("photo_url").notNull(),
  videoUrl: text("video_url"),
  adType: text("ad_type").notNull(), // rehome | treatment | both
  // Реквизиты для донатов
  donationNeeded: real("donation_needed"),        // сумма нужна
  donationCollected: real("donation_collected").notNull().default(0),
  bankCard: text("bank_card"),                    // номер карты
  sbpPhone: text("sbp_phone"),                    // СБП телефон
  tinkoffLink: text("tinkoff_link"),
  location: text("location").notNull(),
  status: text("status").notNull().default("active"), // active | closed | rehomed
  createdAt: text("created_at").notNull(),
});
export const insertVolunteerAdSchema = createInsertSchema(volunteerAds).omit({ id: true });
export type InsertVolunteerAd = z.infer<typeof insertVolunteerAdSchema>;
export type VolunteerAd = typeof volunteerAds.$inferSelect;

// ─── CATCH REQUESTS (заявки на отлов) ────────────────────────────────────────
export const catchRequests = sqliteTable("catch_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  catcherId: integer("catcher_id").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  animalType: text("animal_type").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  status: text("status").notNull().default("new"), // new | accepted | done | cancelled
  createdAt: text("created_at").notNull(),
});
export const insertCatchRequestSchema = createInsertSchema(catchRequests).omit({ id: true });
export type InsertCatchRequest = z.infer<typeof insertCatchRequestSchema>;
export type CatchRequest = typeof catchRequests.$inferSelect;

// ─── ANIMALS (swipe feed — теперь может быть от любого волонтёра) ─────────────
export const animals = sqliteTable("animals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  age: text("age").notNull(),
  description: text("description").notNull(),
  story: text("story").notNull(),
  photoUrl: text("photo_url").notNull(),
  videoUrl: text("video_url"),
  status: text("status").notNull().default("needs_help"),
  needsFood: integer("needs_food", { mode: "boolean" }).notNull().default(true),
  needsShelter: integer("needs_shelter", { mode: "boolean" }).notNull().default(false),
  needsMedical: integer("needs_medical", { mode: "boolean" }).notNull().default(false),
  needsHome: integer("needs_home", { mode: "boolean" }).notNull().default(true),
  foundDate: text("found_date").notNull(),
  location: text("location").notNull(),
});
export const insertAnimalSchema = createInsertSchema(animals).omit({ id: true });
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;

// ─── REVIEWS (оценки клиник и передержек) ───────────────────────────────────
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetType: text("target_type").notNull(), // clinic | boarding
  targetId: integer("target_id").notNull(),
  userId: integer("user_id"),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),       // 1-5
  comment: text("comment"),
  createdAt: text("created_at").notNull(),
});
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ─── SUCCESS STORIES ─────────────────────────────────────────────────────────
export const successStories = sqliteTable("success_stories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  animalId: integer("animal_id").notNull(),
  newOwnerName: text("new_owner_name").notNull(),
  photoBefore: text("photo_before").notNull(),
  photoAfter: text("photo_after").notNull(),
  storyText: text("story_text").notNull(),
  rehomedDate: text("rehomed_date").notNull(),
});
export const insertSuccessStorySchema = createInsertSchema(successStories).omit({ id: true });
export type InsertSuccessStory = z.infer<typeof insertSuccessStorySchema>;
export type SuccessStory = typeof successStories.$inferSelect;

// ─── HELP REQUESTS ───────────────────────────────────────────────────────────
export const helpRequests = sqliteTable("help_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  animalId: integer("animal_id").notNull(),
  helpType: text("help_type").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  message: text("message"),
  createdAt: text("created_at").notNull(),
});
export const insertHelpRequestSchema = createInsertSchema(helpRequests).omit({ id: true });
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type HelpRequest = typeof helpRequests.$inferSelect;

// ─── SUBSCRIPTION PLANS ──────────────────────────────────────────────────────
// Plans: free | basic (199₽/мес) | pro (499₽/мес)
// free: read-only, no posting
// basic: volunteer/catcher can post 3 ads/month
// pro: unlimited posts, priority in search, badge
