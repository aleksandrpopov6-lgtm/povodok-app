import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";

/* ── Security audit log ──────────────────────────────────────────── */
const SEC_LOG = path.join(process.cwd(), "security.log");
const BCRYPT_ROUNDS = 12;

function secLog(event: string, subject: string, result: "SUCCESS"|"FAILURE", details = "") {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, subject, result, details }) + "\n";
  try { fs.appendFileSync(SEC_LOG, line); } catch {}
}
import {
  insertAnimalSchema, insertCatcherSchema, insertBoardingSchema,
  insertClinicSchema, insertVolunteerAdSchema, insertCatchRequestSchema,
  insertHelpRequestSchema, insertSuccessStorySchema, insertUserSchema, insertReviewSchema,
} from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only images and videos allowed"));
  },
});

function fileUrl(file?: Express.Multer.File) {
  return file ? `/uploads/${file.filename}` : undefined;
}
function filesUrl(files: { [f: string]: Express.Multer.File[] } | undefined, key: string) {
  return files?.[key]?.[0] ? `/uploads/${files[key][0].filename}` : undefined;
}

export function registerRoutes(httpServer: Server, app: Express) {
  // Rate limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10,
    message: { error: "Слишком много попыток. Попробуйте через 15 минут." },
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, max: 300,
    message: { error: "Слишком много запросов." },
  });
  app.use("/api/auth", authLimiter);
  app.use("/api", apiLimiter);
  // ── AUTH / USERS ──────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, phone, password, role } = req.body;
      if (!name || !phone || !password) return res.status(400).json({ error: "Заполните все поля" });
      const existing = storage.getUserByPhone(phone);
      if (existing) return res.status(409).json({ error: "Пользователь с таким телефоном уже зарегистрирован" });
      const user = storage.createUser({
        name, phone, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS), role: role || "guest",
        city: req.body.city || "Москва",
        isSubscribed: false, createdAt: new Date().toISOString(),
      });
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { phone, password } = req.body;
    const user = storage.getUserByPhone(phone);
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !isValid) {
      secLog("LOGIN", phone || "unknown", "FAILURE", "Wrong credentials");
      return res.status(401).json({ error: "Неверный телефон или пароль" });
    }
    secLog("LOGIN", phone, "SUCCESS");
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/users/:id", (req, res) => {
    const user = storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "Not found" });
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/users/:id/subscribe", (req, res) => {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const user = storage.updateUserSubscription(Number(req.params.id), expiry);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, expiry });
  });

  // ── STATS ─────────────────────────────────────────────────────────────────
  app.get("/api/stats", (_req, res) => {
    const s = storage.getStats() as any;
    res.json({
      ...s,
      total: s.total ?? (s.animals ?? 0) + (s.rehomed ?? 0),
      needsHelp: s.needsHelp ?? s.animals ?? 0,
      saved: 27,
    });
  });

  // ── ANIMALS ───────────────────────────────────────────────────────────────
  /* ── MAX Bot webhook ─────────────────────────────────────────── */
  app.post("/api/max-webhook", async (req, res) => {
    try {
      const update = req.body;
      const MAX_TOKEN = process.env.MAX_BOT_TOKEN || "";

      // Отвечаем 200 сразу
      res.json({ ok: true });

      if (!update || !MAX_TOKEN) return;

      const updateType = update.update_type;

      // Когда пользователь нажал /start или написал боту впервые
      if (updateType === "bot_started" || updateType === "message_created") {
        const chatId = update.chat_id ||
          update.message?.recipient?.chat_id ||
          update.user?.user_id;

        if (!chatId) return;

        const text = updateType === "message_created"
          ? (update.message?.body?.text || "")
          : "";

        // Реагируем на /start или первый запуск
        if (updateType === "bot_started" || text.startsWith("/start")) {
          await fetch(`https://botapi.max.ru/messages?chat_id=${chatId}`, {
            method: "POST",
            headers: {
              "Authorization": MAX_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: "🐾 Добро пожаловать в ПоводОК!\n\nПлатформа для помощи бездомным животным. Нажмите кнопку ниже чтобы открыть приложение.",
              attachments: [{
                type: "inline_keyboard",
                payload: {
                  buttons: [[{
                    type: "url",
                    text: "🐾 Открыть ПоводОК",
                    url: "https://povodok.pro"
                  }]]
                }
              }]
            })
          }).catch(() => {});
        }

        secLog("MAX_MESSAGE", String(chatId), "SUCCESS", `type=${updateType}`);
      }
    } catch (e) {
      // silent
    }
  });

  // Security log (последние 500 событий)
  app.get("/api/security/log", (req, res) => {
    try {
      if (!fs.existsSync(SEC_LOG)) return res.json([]);
      const lines = fs.readFileSync(SEC_LOG, "utf8").trim().split("\n")
        .filter(Boolean).slice(-500)
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean).reverse();
      res.json(lines);
    } catch { res.json([]); }
  });

  /* ── Image proxy (для MAX и других WebView) ─────────────────── */
  app.get("/api/proxy-image", async (req, res) => {
    const { url } = req.query as { url?: string };
    if (!url) return res.status(400).json({ error: "url required" });

    // Разрешаем только доверенные источники
    const allowed = ["images.unsplash.com", "placekitten.com", "povodok.pro"];
    let hostname = "";
    try { hostname = new URL(url).hostname; } catch { return res.status(400).json({ error: "bad url" }); }
    if (!allowed.some(d => hostname.endsWith(d))) {
      return res.status(403).json({ error: "domain not allowed" });
    }

    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "PovodokBot/1.0" },
      });
      if (!resp.ok) return res.status(resp.status).end();

      const contentType = resp.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const buf = await resp.arrayBuffer();
      res.send(Buffer.from(buf));
    } catch {
      res.status(502).json({ error: "fetch failed" });
    }
  });

  app.get("/api/animals", (req, res) => res.json(storage.getAnimals(req.query.status as string)));
  app.get("/api/animals/:id", (req, res) => {
    const a = storage.getAnimal(Number(req.params.id));
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });
  app.post("/api/animals", upload.fields([{ name: "photo", maxCount: 1 }, { name: "video", maxCount: 1 }]), (req, res) => {
    try {
      const files = req.files as any;
      const data = insertAnimalSchema.parse({
        ...req.body,
        photoUrl: filesUrl(files, "photo") || req.body.photoUrl,
        videoUrl: filesUrl(files, "video") || null,
        needsFood: req.body.needsFood === "true", needsShelter: req.body.needsShelter === "true",
        needsMedical: req.body.needsMedical === "true", needsHome: req.body.needsHome === "true",
      });
      res.status(201).json(storage.createAnimal(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/animals/:id/status", (req, res) => {
    const a = storage.updateAnimalStatus(Number(req.params.id), req.body.status);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });
  app.patch("/api/animals/:id/rehome", (req, res) => {
    const a = storage.updateAnimalStatus(Number(req.params.id), "rehomed");
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });

  // ── CATCHERS ──────────────────────────────────────────────────────────────
  app.get("/api/catchers", (req, res) => {
    const { metro, maxPrice, worksCats, worksDogs } = req.query;
    res.json(storage.getCatchers({
      metro: metro as string,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      worksCats: worksCats === "true" ? true : undefined,
      worksDogs: worksDogs === "true" ? true : undefined,
    }));
  });
  app.get("/api/catchers/:id", (req, res) => {
    const c = storage.getCatcher(Number(req.params.id));
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  });
  app.post("/api/catchers", upload.single("photo"), (req, res) => {
    try {
      const data = insertCatcherSchema.parse({
        ...req.body,
        photoUrl: fileUrl(req.file) || req.body.photoUrl,
        priceInMkad: Number(req.body.priceInMkad),
        priceOutMkad: req.body.priceOutMkad ? Number(req.body.priceOutMkad) : null,
        worksCats: req.body.worksCats === "true", worksDogs: req.body.worksDogs === "true",
        hasNet: req.body.hasNet === "true", hasTrap: req.body.hasTrap === "true", hasCatTrap: req.body.hasCatTrap === "true",
        userId: Number(req.body.userId), isActive: true, rating: 5.0, reviewCount: 0,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(storage.createCatcher(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── CATCH REQUESTS ────────────────────────────────────────────────────────
  app.post("/api/catch-requests", (req, res) => {
    try {
      const data = insertCatchRequestSchema.parse({ ...req.body, catcherId: Number(req.body.catcherId), createdAt: new Date().toISOString() });
      res.status(201).json(storage.createCatchRequest(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── BOARDINGS ─────────────────────────────────────────────────────────────
  app.get("/api/boardings", (req, res) => {
    const { metro, maxPrice, acceptsWild, hasIsolationBox, type } = req.query;
    res.json(storage.getBoardings({
      metro: metro as string,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      acceptsWild: acceptsWild === "true" ? true : undefined,
      hasIsolationBox: hasIsolationBox === "true" ? true : undefined,
      type: type as string,
    }));
  });
  app.get("/api/boardings/:id", (req, res) => {
    const b = storage.getBoarding(Number(req.params.id));
    if (!b) return res.status(404).json({ error: "Not found" });
    res.json(b);
  });
  app.post("/api/boardings", upload.single("photo"), (req, res) => {
    try {
      const data = insertBoardingSchema.parse({
        ...req.body,
        photoUrl: fileUrl(req.file) || req.body.photoUrl,
        pricePerDay: Number(req.body.pricePerDay),
        acceptsWild: req.body.acceptsWild === "true", hasIsolationBox: req.body.hasIsolationBox === "true",
        acceptsCats: req.body.acceptsCats !== "false", acceptsDogs: req.body.acceptsDogs !== "false",
        isActive: true, rating: 5.0, reviewCount: 0, createdAt: new Date().toISOString(),
      });
      res.status(201).json(storage.createBoarding(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── CLINICS ───────────────────────────────────────────────────────────────
  app.get("/api/clinics", (req, res) => {
    const { metro, worksWithWild, isRoundClock } = req.query;
    res.json(storage.getClinics({
      metro: metro as string,
      worksWithWild: worksWithWild === "true" ? true : undefined,
      isRoundClock: isRoundClock === "true" ? true : undefined,
    }));
  });
  app.get("/api/clinics/:id", (req, res) => {
    const c = storage.getClinic(Number(req.params.id));
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  });
  app.post("/api/clinics", upload.single("photo"), (req, res) => {
    try {
      const data = insertClinicSchema.parse({
        ...req.body,
        photoUrl: fileUrl(req.file) || req.body.photoUrl,
        priceConsultation: req.body.priceConsultation ? Number(req.body.priceConsultation) : null,
        worksWithWild: req.body.worksWithWild === "true", hasEmergency: req.body.hasEmergency === "true",
        hasSurgery: req.body.hasSurgery === "true", isRoundClock: req.body.isRoundClock === "true",
        worksCats: true, worksDogs: true, isActive: true, rating: 5.0, reviewCount: 0,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(storage.createClinic(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── VOLUNTEER ADS ─────────────────────────────────────────────────────────
  app.get("/api/volunteer-ads", (req, res) => {
    const { adType, animalType } = req.query;
    res.json(storage.getVolunteerAds({ adType: adType as string, animalType: animalType as string }));
  });
  app.get("/api/volunteer-ads/:id", (req, res) => {
    const a = storage.getVolunteerAd(Number(req.params.id));
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });
  app.post("/api/volunteer-ads", upload.fields([{ name: "photo", maxCount: 1 }, { name: "video", maxCount: 1 }]), (req, res) => {
    try {
      const files = req.files as any;
      const data = insertVolunteerAdSchema.parse({
        ...req.body,
        photoUrl: filesUrl(files, "photo") || req.body.photoUrl,
        videoUrl: filesUrl(files, "video") || null,
        userId: Number(req.body.userId),
        donationNeeded: req.body.donationNeeded ? Number(req.body.donationNeeded) : null,
        donationCollected: 0,
        status: "active", createdAt: new Date().toISOString(),
      });
      res.status(201).json(storage.createVolunteerAd(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── HELP REQUESTS ─────────────────────────────────────────────────────────
  app.post("/api/help-requests", (req, res) => {
    try {
      const data = insertHelpRequestSchema.parse({ ...req.body, createdAt: new Date().toISOString() });
      res.status(201).json(storage.createHelpRequest(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── SUCCESS STORIES ───────────────────────────────────────────────────────
  app.get("/api/success-stories", (_req, res) => res.json(storage.getSuccessStories()));
  app.post("/api/success-stories", upload.fields([{ name: "photoBefore", maxCount: 1 }, { name: "photoAfter", maxCount: 1 }]), (req, res) => {
    try {
      const files = req.files as any;
      const data = insertSuccessStorySchema.parse({
        ...req.body,
        animalId: Number(req.body.animalId),
        photoBefore: filesUrl(files, "photoBefore") || req.body.photoBefore,
        photoAfter: filesUrl(files, "photoAfter") || req.body.photoAfter,
      });
      const story = storage.createSuccessStory(data);
      storage.updateAnimalStatus(data.animalId, "rehomed");
      res.status(201).json(story);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // Reviews
  app.get("/api/reviews/:type/:id", (req, res) => {
    res.json(storage.getReviews(req.params.type, Number(req.params.id)));
  });
  app.post("/api/reviews", (req, res) => {
    try {
      const data = insertReviewSchema.parse({ ...req.body, targetId: Number(req.body.targetId), userId: req.body.userId ? Number(req.body.userId) : null, createdAt: new Date().toISOString() });
      res.status(201).json(storage.createReview(data));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── UPDATE PROFILE ────────────────────────────────────────────────────────
  app.patch("/api/users/:id", upload.single("avatar"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = storage.getUser(id);
      if (!user) return res.status(404).json({ error: "Not found" });
      const avatarUrl = req.file ? `/uploads/${req.file.filename}` : req.body.avatarUrl || user.avatarUrl;
      const updated = storage.updateUser(id, {
        name: req.body.name || user.name,
        avatarUrl,
        city: req.body.city || user.city,
      });
      const { passwordHash: _, ...safeUser } = updated!;
      res.json(safeUser);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });



  // ── TELEGRAM NOTIFICATION ──────────────────────────────────────────────────
  app.post("/api/notify-telegram", async (req, res) => {
    try {
      const { chatId, message } = req.body;
      if (!chatId || !message) return res.status(400).json({ error: "chatId and message required" });
      const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
      const resp = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      });
      const data = await resp.json();
      if (!data.ok) {
        console.error("Telegram API error:", data);
        return res.status(502).json({ error: "Telegram API error", details: data });
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Telegram notify error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ── CATCHERS PRICE UPDATE ─────────────────────────────────────────────────
  app.patch("/api/catchers/:id/price", (req, res) => {
    try {
      const id = Number(req.params.id);
      const { priceInMkad, priceOutMkad } = req.body;
      const result = storage.updateCatcherPrice(id, Number(priceInMkad) || 0, priceOutMkad != null ? Number(priceOutMkad) : null);
      if (!result) return res.status(404).json({ error: "Catcher not found" });
      res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── GENERATE INVOICE PDF (Python ReportLab) ──────────────────────────────
  app.post("/api/invoice", async (req, res) => {
    try {
      const { execFile } = await import("child_process");
      const path = await import("path");
      const fs = await import("fs");
      const os = await import("os");

      const { buyerName = "", buyerInn = "", buyerEmail = "", amount = 0, planName = "paid" } = req.body;
      if (!buyerName || !buyerInn || !buyerEmail || !amount) {
        return res.status(400).json({ error: "Заполните все поля" });
      }

      const tmpFile = path.join(os.tmpdir(), `invoice_${Date.now()}.pdf`);
      // In dev: server/gen_invoice.py; in prod: gen_invoice.py (copied to dist root)
      const scriptPath = fs.existsSync(path.join(process.cwd(), "server", "gen_invoice.py"))
        ? path.join(process.cwd(), "server", "gen_invoice.py")
        : path.join(process.cwd(), "gen_invoice.py");
      const jsonData = JSON.stringify({ buyerName, buyerInn, buyerEmail, amount, planName });

      await new Promise<void>((resolve, reject) => {
        execFile("python3", [scriptPath, jsonData, tmpFile], { timeout: 15000 }, (err, stdout, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve();
        });
      });

      const pdfBuffer = fs.readFileSync(tmpFile);
      try { fs.unlinkSync(tmpFile); } catch {}

      const invoiceNum = Math.floor(1000 + Math.random() * 9000);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="schet_povodok_${invoiceNum}.pdf"`);
      res.send(pdfBuffer);
    } catch (e: any) {
      console.error("PDF error:", e);
      res.status(500).json({ error: "Ошибка генерации счёта: " + e.message });
    }
  });

}
