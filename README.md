# 🥦 BoboMart — Quick Grocery Store (Kuwait)

BoboMart is a quick-commerce grocery web app for Kuwait. It is a single responsive website that **behaves like a mobile app** (bottom tab bar) when opened on a phone, and like a **regular website** (top navigation) when opened in a desktop browser. Fully bilingual: **English and Arabic (RTL)**.

![BoboMart Logo](./WhatsApp%20Image%202026-07-06%20at%209.59.59%20PM.jpeg)

---

## 1. Design Language

Simple, modern, and clean — minimum colors, lots of white space, derived from the current BoboMart logo.

| Token | Color | Usage |
|---|---|---|
| `--brand-green` | `#3DA829` (logo green) | Primary — buttons, active tab, prices, links |
| `--brand-orange` | `#F5A11A` (logo orange) | Accent — deals, countdown, badges, offer strip |
| `--background` | `#FFFFFF` | Page background (always white) |
| `--text` | `#1F2937` | Headings & body text |
| `--muted` | `#6B7280` / `#F3F4F6` | Secondary text / card borders & dividers |

Rules:
- White background everywhere; color is used sparingly and only from the brand palette.
- Rounded corners, soft shadows, friendly rounded typography (matching the logo style).
- Arabic uses an Arabic-friendly font (e.g. Cairo / Tajawal) with full RTL mirroring.

---

## 2. Core Features (Requirements)

### 2.1 Responsive App/Website Behavior
- **Mobile (< 768px):** app-like experience with a fixed **bottom tab bar** — Home, Categories, Cart, Orders, Profile.
- **Desktop (≥ 768px):** classic website layout with a top header — logo, search bar, then the nav links (Home, Categories, Orders), cart and a **“Hi &lt;customer name&gt;” link to the profile, all aligned to the right**.

### 2.2 Language Support (EN / AR)
- Language switcher visible in the header (English ⇄ العربية).
- Arabic switches the entire layout to **RTL** (navigation, cards, sliders, tab bar all mirror).
- All product names, categories, offers, and UI labels are translated.
- Selected language is remembered (persisted in local storage).

### 2.3 Top Offer Strip (Free Delivery)
- A slim strip fixed at the very top of every page (brand orange/green on white):
  - **EN:** "🚚 Free delivery on orders above 100 KD"
  - **AR:** "🚚 توصيل مجاني للطلبات فوق ١٠٠ د.ك"
- Dismissible on mobile; cart page also shows progress toward the 100 KD free-delivery threshold.

### 2.4 Deal of the Day (with Countdown)
- A highlighted **"Deal of the Day"** section on the home page.
- Live **countdown timer** ("Deal ends today in `HH : MM : SS`") counting down to midnight (or a configured end time).
- Deal products show original price, discounted price, and % off badge (orange).
- When the timer hits zero the deal section hides / rotates to the next deal.

### 2.5 Grocery Packets Section
- Products are sold as **packets with defined quantities**: `250g`, `500g`, `1kg`, `2kg`, `5kg`, `1L`, `6 pcs`, etc. (any quantity per product variant).
- Each product card shows: image, name (EN/AR), packet size, price in **KD**.
- **Add to Cart button directly on the card** — one tap adds the item.
- After adding, the button becomes a stepper (`− 1 +`) so the user can **add only 1 more at a time** (increment/decrement by 1, with a per-item max limit).

### 2.6 Profile
- **Greeting link at the top** on desktop (“Hi &lt;customer name&gt;” → profile page); the profile picture stays on the mobile profile tab and profile page.
- Profile page: user info, saved addresses, order history, language preference.

---

## 3. Pages / Screens

| Page | Mobile (tab) | Description |
|---|---|---|
| Home | 🏠 Home | Offer strip, hero/banner, Deal of the Day + countdown, category shortcuts, grocery packets grid |
| Categories | 🗂 Categories | Fruits & Vegetables, Dairy & Eggs, Bakery, Beverages, Snacks, Rice & Grains, Frozen, Household |
| Cart | 🛒 Cart | Line items with steppers, subtotal in KD, free-delivery progress bar (100 KD), checkout |
| Orders | 📦 Orders | Current & past orders with status |
| Profile | 👤 Profile | Profile picture, details, addresses, language switch |

---

## 4. Cart Rules

- Currency: **KD (Kuwaiti Dinar)**, 3 decimal places (e.g. `1.250 KD`).
- Quantity changes only in steps of **+1 / −1** from the product card or cart.
- Delivery fee applied below 100 KD; **free delivery at ≥ 100 KD** (strip + cart both communicate this).

---

## 5. Tech Stack

Static **HTML + CSS** design first, later integrated into a **.NET (ASP.NET / Razor)** backend to make it dynamic.

| Layer | Choice | Why |
|---|---|---|
| Markup | Plain HTML5 | Hands over cleanly to .NET Razor views / partials |
| CSS | **Tailwind CSS (CDN)** | Best fit: modern minimal look, no build step, works inside Razor as plain classes |
| Fonts | Nunito (EN) + Cairo (AR) via Google Fonts | Rounded, friendly — matches the logo style |
| Images | Real royalty-free photos (Unsplash), stored locally in `images/` | Replaced by actual product images / CDN later from .NET |
| Icons | Inline SVG line icons (Lucide-style) | Crisp app-like navigation, colored via `currentColor` |
| JS | Small vanilla JS only | Countdown timer, EN⇄AR toggle, add-to-cart stepper demo |

### .NET Integration Conventions
- Every component carries a **semantic class** (`bb-*` prefix) alongside Tailwind utilities — e.g. `bb-product-card`, `bb-offer-strip`, `bb-countdown` — so .NET can target/bind them without touching utility classes.
- Repeatable blocks (product card, category chip, deal card) are marked with `<!-- REPEATABLE: ... -->` comments → each becomes a Razor partial fed by a model loop.
- Text elements carry `data-en` / `data-ar` attributes for language switching → later replaced by .NET resource files (`.resx`) or a DB-driven translation table.

---

## 6. Project Structure

```
bobomart/
├── README.md
├── index.html           # Home / Dashboard page (offer strip, header, deal of the day, packets grid, tab bar)
├── css/
│   └── custom.css       # Small overrides on top of Tailwind (scrollbars, RTL tweaks)
├── js/
│   └── main.js          # Countdown, language toggle, cart stepper
└── images/
    ├── logo.jpeg        # Brand logo
    ├── hero.jpg         # Home banner photo
    ├── profile.jpg      # Placeholder profile picture (later: user avatar from .NET)
    ├── products/        # Product photos (rice, milk, bananas, eggs, ...)
    └── categories/      # Category thumbnails (fruits & veg, beverages, ...)
```

Later pages: `categories.html`, `cart.html`, `orders.html`, `profile.html` → each converted to a Razor view during .NET integration.

---

## 7. Roadmap

- [x] Requirements & README
- [x] Home / Dashboard page design (HTML + Tailwind): offer strip, header, deal of the day + countdown, packets grid, mobile tab bar
- [ ] i18n content complete (EN/AR + RTL)
- [ ] Categories page
- [ ] Cart page with stepper logic and free-delivery progress
- [ ] Profile page with picture
- [ ] Orders page
- [ ] .NET integration (Razor views, dynamic data, real images)
- [ ] Backend / payments (future)
