# AHdigital — to'liq web sayt + Portfolio

Bitta loyihada ikkita sayt bor:
- **AHdigital** (`/`) — xizmatlar, narxlar, buyurtma formasi, admin panel.
- **Portfolio** (`/portfolio/`) — boshqa dizayndagi shaxsiy portfolio sahifasi.

## Qaysi tillar ishlatilgan

| Qism | Til / texnologiya | Fayllar |
|---|---|---|
| Tuzilish | **HTML** | `public/index.html`, `public/admin.html`, `public/portfolio/index.html` |
| Dizayn | **CSS** | `public/style.css`, `public/portfolio/portfolio.css` |
| Brauzerdagi harakat | **JavaScript** | `public/script.js`, `public/admin.js`, `public/portfolio/portfolio.js` |
| Backend (server) | **JavaScript (Node.js + Express)** | `server.js` |
| Ma'lumotlar | **JSON** | `data/orders.json` (o'zi yaratiladi) |

## Papka tuzilishi

```
abdulhamid-digital-sayt/
├── server.js            ← backend: API va server. Narxlar shu yerda (SERVICES)
├── package.json         ← loyiha ma'lumoti va kutubxonalar
├── render.yaml          ← Render.com uchun sozlama
├── .env.example         ← sozlamalar namunasi
└── public/
    ├── index.html       ← asosiy sahifa
    ├── style.css
    ├── script.js        ← xizmatlarni yuklash, buyurtma yuborish, mobil menyu
    ├── admin.html       ← admin panel
    ├── admin.js
    ├── images/
    └── portfolio/
        ├── index.html   ← portfolio sahifasi
        ├── portfolio.css
        └── portfolio.js ← yozilayotgan matn, loyihalar, narx kalkulyatori
```

## Nimani qayerdan o'zgartirish mumkin

- **Narx yoki xizmat** → `server.js` ichidagi `SERVICES` ro'yxati. O'zgarish ham asosiy saytda, ham portfoliodagi kalkulyatorda ko'rinadi.
- **Portfolioga yangi loyiha** → `public/portfolio/portfolio.js` ichidagi `PROJECTS` ro'yxatiga yangi obyekt qo'shing.
- **O'quv yo'li** (masalan, JavaScript'ni tugatsangiz) → `portfolio.js` ichidagi `JOURNEY` ro'yxatida `done: true` qiling va yangisini qo'shing.

## Kompyuterda ishga tushirish

1. **Node.js** o'rnating: https://nodejs.org (LTS versiyasi).
2. Papkani VS Code'da oching: `File → Open Folder`.
3. Terminalni oching (`Ctrl + ~`) va yozing:
   ```
   npm install
   npm start
   ```
4. Brauzerda oching:
   - Sayt: http://localhost:3000
   - Portfolio: http://localhost:3000/portfolio/
   - Admin panel: http://localhost:3000/admin.html (parol: `admin123`)

To'xtatish: terminalda `Ctrl + C`.

## Internetga chiqarish (Render.com, bepul)

### 1-qadam. GitHub'ga yuklash
1. https://github.com da ro'yxatdan o'ting (yoki kiring).
2. Yuqori o'ngdagi **+** → **New repository** bosing. Nomi: `ahdigital`. **Public** ni tanlang va **Create repository** bosing.
3. Ochilgan sahifada **uploading an existing file** havolasini bosing.
4. Loyiha papkasi ichidagi hamma narsani sudrab tashlang. **`node_modules` papkasini yuklamang!**
   (`.env` fayli bo'lsa, uni ham yuklamang — unda parolingiz bor.)
5. **Commit changes** bosing.

### 2-qadam. Render'da ishga tushirish
1. https://render.com ga kiring → **Get Started** → **GitHub bilan kirish**.
2. **New +** → **Blueprint** ni tanlang.
3. `ahdigital` repongizni tanlang va **Connect** bosing. Render `render.yaml` faylini o'zi o'qiydi.
4. `ADMIN_PASSWORD` so'raladi — o'zingiz o'ylagan kuchli parolni yozing.
   `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni hozircha bo'sh qoldirsangiz ham bo'ladi.
5. **Apply** bosing va 2–5 daqiqa kuting.
6. Tayyor! Saytingiz `https://ahdigital.onrender.com` ga o'xshash manzilda ochiladi.
   Portfolio: o'sha manzil + `/portfolio/`.

### Bilish muhim
- Bepul tarifda sayt 15 daqiqa hech kim kirmasa "uxlab qoladi". Keyingi ochilishda 30–60 soniya yuklanadi — bu normal.
- Bepul tarifda server qayta ishga tushganda `data/orders.json` o'chib ketishi mumkin. Buyurtmalar yo'qolmasligi uchun **Telegram xabarnomasini yoqing**:
  1. Telegramda @BotFather ga `/newbot` yozing va token oling.
  2. O'z botingizga `/start` yozing.
  3. @userinfobot orqali o'z ID raqamingizni bilib oling.
  4. Render → saytingiz → **Environment** → `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni kiriting → **Save**.
- Kodni o'zgartirsangiz, GitHub'ga qayta yuklang — Render saytni o'zi yangilaydi.

## API (backend manzillari)

| Metod | Manzil | Vazifasi | Parol kerakmi |
|---|---|---|---|
| GET | `/api/services` | Xizmatlar va narxlar | Yo'q |
| POST | `/api/orders` | Yangi buyurtma yuborish | Yo'q |
| GET | `/api/orders` | Barcha buyurtmalar | Ha |
| PATCH | `/api/orders/:id` | Buyurtma holatini o'zgartirish | Ha |
| DELETE | `/api/orders/:id` | Buyurtmani o'chirish | Ha |
| GET | `/healthz` | Server ishlayaptimi (Render uchun) | Yo'q |
