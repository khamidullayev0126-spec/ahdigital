// AHdigital — backend server (Node.js + Express)
// Ishga tushirish: npm install, keyin npm start

require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// ---------- Xizmatlar ro'yxati (narxlar shu yerda o'zgartiriladi) ----------
// group: "once" — bir martalik, "plan" — obuna, "course" — o'quv kursi
const SERVICES = [
  { id: "video", group: "once", kicker: "Bir martalik", name: "Claude Video", price: 20000, period: "video",
    desc: "Claude yordamida tayyorlangan bitta sifatli video — reklama, reels yoki tushuntirish uchun.",
    features: ["Reklama, reels yoki tushuntirish videosi", "Ssenariy va matn AI yordamida", "Telegram orqali topshiriladi"] },
  { id: "vizitka", group: "once", kicker: "Bir martalik · Sayt", name: "Vizitka va Menyu sayt", price: 25000, period: "sayt",
    desc: "Bir sahifali vizitka sayt yoki kafe, restoran va do'kon uchun menyu sayt.",
    features: ["Bir sahifali chiroyli sayt", "Telefon va kompyuterga moslashgan", "Telefon, Telegram va Instagram havolalari"] },
  { id: "slayd", group: "once", kicker: "Bir martalik", name: "Slayd va Postlar", price: 50000, period: "buyurtma",
    desc: "Taqdimot slaydlari va ijtimoiy tarmoqlar uchun tayyor dizayndagi postlar.",
    features: ["Taqdimot slaydlari", "Instagram va Telegram uchun postlar", "Brendingiz ranglarida"] },
  { id: "katta-sayt", group: "once", kicker: "Bir martalik · Sayt", name: "Katta haqiqiy sayt", price: 350000, period: "sayt",
    desc: "Ko'p sahifali to'liq sayt: buyurtma formasi, admin panel va backend bilan.",
    features: ["Bir nechta sahifa", "Buyurtma yoki aloqa formasi", "Admin panel va backend", "Internetga joylashda yordam"] },
  { id: "pro", group: "plan", kicker: "1 oylik obuna", name: "Pro", price: 100000, period: "oy", featured: true,
    desc: "Bir oy ichida 15 tagacha video, slayd va post yasatishingiz mumkin.",
    features: ["15 tagacha video, slayd va post", "Vizitka va menyu saytlar", "Katta haqiqiy saytlar"] },
  { id: "max", group: "plan", kicker: "1 yillik obuna", name: "Max", price: 1200000, period: "yil",
    desc: "Butun yil davomida cheksiz video, slayd va postlar — hech qanday limit yo'q.",
    features: ["Cheksiz video, slayd va postlar", "Vizitka va menyu saytlar", "Katta haqiqiy saytlar", "Butun yil davomida"] },
  { id: "legends", group: "course", kicker: "O'quv kursi", name: "AI LEGENDS", price: 400000, period: "oy", legend: true,
    desc: "AI bilan ishlashni shaxsan o'zim o'rgataman — amaliy darslar va qo'llab-quvvatlash.",
    features: ["Amaliy darslar", "Claude va AI vositalari bilan ishlash", "Shaxsiy qo'llab-quvvatlash"] }
];

const STATUSES = ["yangi", "jarayonda", "bajarildi", "bekor"];

// ---------- Buyurtmalarni faylda saqlash ----------
function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ---------- Telegramga xabar yuborish (ixtiyoriy) ----------
async function notifyTelegram(order, service) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const text =
    `🆕 Yangi buyurtma!\n\n` +
    `👤 Ism: ${order.name}\n` +
    `📞 Aloqa: ${order.contact}\n` +
    `📦 Xizmat: ${service.name} (${service.price.toLocaleString("ru-RU")} so'm)\n` +
    `💬 Izoh: ${order.message || "—"}`;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    });
  } catch (err) {
    console.error("Telegramga yuborib bo'lmadi:", err.message);
  }
}

// ---------- Oddiy himoya: bitta IP dan juda ko'p so'rov kelmasin ----------
const recentRequests = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const list = (recentRequests.get(req.ip) || []).filter(t => now - t < 60_000);
  if (list.length >= 5) {
    return res.status(429).json({ error: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring." });
  }
  list.push(now);
  recentRequests.set(req.ip, list);
  next();
}

// ---------- Admin tekshiruvi ----------
function requireAdmin(req, res, next) {
  const given = Buffer.from(req.get("x-admin-password") || "");
  const real = Buffer.from(ADMIN_PASSWORD);
  if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) {
    return res.status(401).json({ error: "Parol noto'g'ri." });
  }
  next();
}

// Render kabi xostinglarda mijozning haqiqiy IP manzilini bilish uchun
app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// ================= API =================

// Render server ishlayotganini shu manzil orqali tekshiradi
app.get("/healthz", (req, res) => res.send("ok"));

// Barcha xizmatlar
app.get("/api/services", (req, res) => {
  res.json(SERVICES);
});

// Yangi buyurtma qabul qilish
app.post("/api/orders", rateLimit, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const contact = String(req.body.contact || "").trim();
  const serviceId = String(req.body.serviceId || "").trim();
  const message = String(req.body.message || "").trim();

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ error: "Ismingizni kiriting (2–60 ta harf)." });
  }
  if (contact.length < 5 || contact.length > 60) {
    return res.status(400).json({ error: "Telefon raqam yoki Telegram username kiriting." });
  }
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: "Xizmatni tanlang." });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: "Izoh 1000 ta belgidan oshmasin." });
  }

  const order = {
    id: crypto.randomUUID(),
    name,
    contact,
    serviceId,
    serviceName: service.name,
    price: service.price,
    message,
    status: "yangi",
    createdAt: new Date().toISOString()
  };

  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
  notifyTelegram(order, service);

  res.status(201).json({ ok: true, id: order.id });
});

// Admin: barcha buyurtmalar
app.get("/api/orders", requireAdmin, (req, res) => {
  res.json(readOrders());
});

// Admin: buyurtma holatini o'zgartirish
app.patch("/api/orders/:id", requireAdmin, (req, res) => {
  const status = String(req.body.status || "");
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Noto'g'ri holat." });
  }
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Buyurtma topilmadi." });
  order.status = status;
  writeOrders(orders);
  res.json(order);
});

// Admin: buyurtmani o'chirish
app.delete("/api/orders/:id", requireAdmin, (req, res) => {
  const orders = readOrders();
  const left = orders.filter(o => o.id !== req.params.id);
  if (left.length === orders.length) return res.status(404).json({ error: "Buyurtma topilmadi." });
  writeOrders(left);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ Sayt ishga tushdi: http://localhost:${PORT}`);
  console.log(`🔐 Admin panel:      http://localhost:${PORT}/admin.html`);
  if (ADMIN_PASSWORD === "admin123") {
    console.log("⚠️  Diqqat: .env faylida ADMIN_PASSWORD ni o'zgartiring!");
  }
});
