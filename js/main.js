// BoboMart — home page behaviour (static demo; replaced by .NET later)

/* ============================================================
   1. LANGUAGE TOGGLE (EN ⇄ AR with RTL)
   Every translatable element carries data-en / data-ar.
   .NET later: replace with .resx resources / DB translations.
============================================================ */
const LANG_KEY = 'bobomart-lang';

function applyLanguage(lang) {
  const isAr = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-en]').forEach((el) => {
    el.textContent = isAr ? el.dataset.ar : el.dataset.en;
  });
  document.querySelectorAll('[data-placeholder-en]').forEach((el) => {
    el.placeholder = isAr ? el.dataset.placeholderAr : el.dataset.placeholderEn;
  });

  localStorage.setItem(LANG_KEY, lang);
}

function toggleLanguage() {
  const next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
  applyLanguage(next);
  // Re-render any cart controls so their labels translate
  document.querySelectorAll('.bb-cart-control').forEach(renderControl);
}

const langToggleEl = document.getElementById('langToggle');
if (langToggleEl) langToggleEl.addEventListener('click', toggleLanguage);

// Profile page also has a "Language" row in the settings menu
const langToggleProfileEl = document.getElementById('langToggleProfile');
if (langToggleProfileEl) langToggleProfileEl.addEventListener('click', toggleLanguage);

// Restore saved language on load
applyLanguage(localStorage.getItem(LANG_KEY) || 'en');

/* ============================================================
   2. DEAL OF THE DAY — countdown to midnight (today only)
   .NET later: end time comes from the deal record in DB.
============================================================ */
function updateCountdown() {
  const hEl = document.getElementById('cdHours');
  const mEl = document.getElementById('cdMins');
  const sEl = document.getElementById('cdSecs');
  if (!hEl || !mEl || !sEl) return; // countdown only exists on the home page

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // end of today

  let diff = Math.max(0, Math.floor((midnight - now) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  hEl.textContent = String(h).padStart(2, '0');
  mEl.textContent = String(m).padStart(2, '0');
  sEl.textContent = String(s).padStart(2, '0');
}
if (document.getElementById('cdHours')) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

/* ============================================================
   3. ADD TO CART + STEPPER
   Direct "Add to cart" button on every card. After adding, it
   becomes a − qty + stepper: quantity changes only by 1 at a
   time, capped at MAX_QTY per item.
   Cart persists in localStorage so it survives page navigation.
   .NET later: buttons post to a cart controller/API.
============================================================ */
const MAX_QTY = 10;
const CART_KEY = 'bobomart-cart';

// Static product catalog so any page (e.g. cart.html) can render
// names, prices and images for cart items.
// .NET later: comes from the products table.
const PRODUCTS = {
  'deal-chips':  { en: 'Potato Chips',  ar: 'رقائق بطاطس', pack: '150g',   price: 0.350, oldPrice: 0.500, img: 'images/products/chips.jpg' },
  'deal-apples': { en: 'Red Apples',    ar: 'تفاح أحمر',   pack: '1kg',    price: 0.600, oldPrice: 0.800, img: 'images/products/apples.jpg' },
  'deal-cheese': { en: 'Cheese Slices', ar: 'شرائح جبن',   pack: '200g',   price: 0.800, oldPrice: 1.000, img: 'images/products/cheese.jpg' },
  'deal-flakes': { en: 'Corn Flakes',   ar: 'رقائق الذرة', pack: '500g',   price: 0.900, oldPrice: 1.500, img: 'images/products/cornflakes.jpg' },
  rice:     { en: 'Basmati Rice',   ar: 'أرز بسمتي',  pack: '5kg',    price: 4.750, img: 'images/products/rice.jpg' },
  milk:     { en: 'Fresh Milk',     ar: 'حليب طازج',  pack: '1L',     price: 0.650, img: 'images/products/milk.jpg' },
  bananas:  { en: 'Bananas',        ar: 'موز',        pack: '1kg',    price: 0.450, img: 'images/products/bananas.jpg' },
  eggs:     { en: 'Farm Eggs',      ar: 'بيض بلدي',   pack: '30 pcs', price: 1.200, img: 'images/products/eggs.jpg' },
  tomatoes: { en: 'Tomatoes',       ar: 'طماطم',      pack: '500g',   price: 0.350, img: 'images/products/tomatoes.jpg' },
  bread:    { en: 'Arabic Bread',   ar: 'خبز عربي',   pack: '6 pcs',  price: 0.250, img: 'images/products/bread.jpg' },
  oliveoil: { en: 'Olive Oil',      ar: 'زيت زيتون',  pack: '750ml',  price: 2.900, img: 'images/products/oliveoil.jpg' },
  chicken:  { en: 'Chicken Breast', ar: 'صدر دجاج',   pack: '1kg',    price: 1.950, img: 'images/products/chicken.jpg' },
  // Pack-size variants so category pages have fuller grids.
  // .NET later: every row below is just another product record.
  'bananas-500':  { en: 'Bananas',        ar: 'موز',         pack: '500g',   price: 0.250, img: 'images/products/bananas.jpg' },
  'apples-500':   { en: 'Red Apples',     ar: 'تفاح أحمر',   pack: '500g',   price: 0.350, img: 'images/products/apples.jpg' },
  'tomatoes-1kg': { en: 'Tomatoes',       ar: 'طماطم',       pack: '1kg',    price: 0.650, img: 'images/products/tomatoes.jpg' },
  'milk-500':     { en: 'Fresh Milk',     ar: 'حليب طازج',   pack: '500ml',  price: 0.350, img: 'images/products/milk.jpg' },
  'eggs-15':      { en: 'Farm Eggs',      ar: 'بيض بلدي',    pack: '15 pcs', price: 0.650, img: 'images/products/eggs.jpg' },
  'cheese-400':   { en: 'Cheese Slices',  ar: 'شرائح جبن',   pack: '400g',   price: 1.500, img: 'images/products/cheese.jpg' },
  'bread-10':     { en: 'Arabic Bread',   ar: 'خبز عربي',    pack: '10 pcs', price: 0.400, img: 'images/products/bread.jpg' },
  'rice-1kg':     { en: 'Basmati Rice',   ar: 'أرز بسمتي',   pack: '1kg',    price: 1.100, img: 'images/products/rice.jpg' },
  'flakes-1kg':   { en: 'Corn Flakes',    ar: 'رقائق الذرة', pack: '1kg',    price: 1.600, img: 'images/products/cornflakes.jpg' },
  'chips-75':     { en: 'Potato Chips',   ar: 'رقائق بطاطس', pack: '75g',    price: 0.200, img: 'images/products/chips.jpg' },
  'oil-1500':     { en: 'Olive Oil',      ar: 'زيت زيتون',   pack: '1.5L',   price: 5.500, img: 'images/products/oliveoil.jpg' },
  'chicken-500':  { en: 'Chicken Breast', ar: 'صدر دجاج',    pack: '500g',   price: 1.050, img: 'images/products/chicken.jpg' },
};

// Short product descriptions, keyed by English name so every pack-size
// variant shares one blurb (quick-commerce style — one or two lines).
// .NET later: a `description` column on the products table.
const DESCRIPTIONS = {
  'Potato Chips':  { en: 'Crispy, lightly salted potato chips — the perfect crunchy snack any time of day.', ar: 'رقائق بطاطس مقرمشة بقليل من الملح — الوجبة الخفيفة المثالية في أي وقت.' },
  'Red Apples':    { en: 'Crisp red apples picked at peak ripeness. Sweet, juicy and great for snacking.', ar: 'تفاح أحمر مقرمش مقطوف في ذروة نضجه. حلو وعصيري ومثالي للتسالي.' },
  'Cheese Slices': { en: 'Smooth, creamy cheese slices that melt perfectly. Ideal for sandwiches and burgers.', ar: 'شرائح جبن كريمية ناعمة تذوب بشكل مثالي. رائعة للسندويشات والبرغر.' },
  'Corn Flakes':   { en: 'Golden, crunchy corn flakes. A wholesome breakfast — just add milk.', ar: 'رقائق ذرة ذهبية ومقرمشة. فطور صحي — فقط أضف الحليب.' },
  'Basmati Rice':  { en: 'Long-grain basmati rice with a rich aroma. Fluffy and perfect for biryani and pilaf.', ar: 'أرز بسمتي طويل الحبة بنكهة غنية. هش ومثالي للبرياني والبيلاف.' },
  'Fresh Milk':    { en: 'Farm-fresh full-cream milk, pasteurised and rich in calcium for the whole family.', ar: 'حليب طازج كامل الدسم مبستر وغني بالكالسيوم لكل العائلة.' },
  'Bananas':       { en: 'Naturally sweet, energy-rich bananas. A healthy grab-and-go snack.', ar: 'موز حلو المذاق غني بالطاقة. وجبة خفيفة صحية وسريعة.' },
  'Farm Eggs':     { en: 'Farm-fresh eggs rich in protein. Perfect for breakfast, baking and cooking.', ar: 'بيض بلدي طازج غني بالبروتين. مثالي للفطور والخبز والطبخ.' },
  'Tomatoes':      { en: 'Plump, ripe red tomatoes. Juicy and full of flavour for salads and cooking.', ar: 'طماطم حمراء ناضجة وممتلئة. عصيرية ومليئة بالنكهة للسلطات والطبخ.' },
  'Arabic Bread':  { en: 'Soft, freshly baked Arabic bread. Warm, fluffy and perfect with any meal.', ar: 'خبز عربي طري ومخبوز طازجاً. دافئ وهش ومثالي مع أي وجبة.' },
  'Olive Oil':     { en: 'Cold-pressed extra-virgin olive oil. Rich flavour for cooking and dressings.', ar: 'زيت زيتون بكر ممتاز معصور على البارد. نكهة غنية للطبخ والتتبيلات.' },
  'Chicken Breast':{ en: 'Fresh, tender boneless chicken breast. Lean protein for healthy meals.', ar: 'صدر دجاج طازج وطري بدون عظم. بروتين قليل الدهون لوجبات صحية.' },
};

// Category → subcategory → sub-subcategory → product ids
// (Zepto/Instamart-style three-level browse).
// A level-2 subcategory may carry its own `products`, its own `subs`
// (the third level), or both — a sub with no `subs` simply has no third
// level and the page hides that rail.
// .NET later: one self-referencing categories table (ParentId) with
// products joined by FK; the three rails are Razor loops over the tree.
const CATEGORIES = {
  fruitsveg: {
    en: 'Fruits & Veg', ar: 'فواكه وخضار', img: 'images/categories/fruitsveg.jpg',
    subs: [
      { id: 'fruits', en: 'Fresh Fruits', ar: 'فواكه طازجة', img: 'images/products/apples.jpg',
        subs: [
          { id: 'apples',  en: 'Apples',  ar: 'تفاح', img: 'images/products/apples.jpg',  products: ['deal-apples', 'apples-500'] },
          { id: 'bananas', en: 'Bananas', ar: 'موز',  img: 'images/products/bananas.jpg', products: ['bananas', 'bananas-500'] },
        ] },
      { id: 'vegetables', en: 'Fresh Vegetables', ar: 'خضار طازجة', img: 'images/products/tomatoes.jpg',
        subs: [
          { id: 'tomatoes',  en: 'Tomatoes',    ar: 'طماطم',        img: 'images/products/tomatoes.jpg', products: ['tomatoes', 'tomatoes-1kg'] },
          { id: 'salad-veg', en: 'Salad Basket', ar: 'سلة السلطة',  img: 'images/categories/fruitsveg.jpg', products: ['tomatoes'] },
        ] },
      { id: 'seasonal', en: 'Seasonal Picks', ar: 'مختارات الموسم', img: 'images/categories/fruitsveg.jpg', products: ['bananas', 'deal-apples', 'tomatoes'] },
    ],
  },
  dairy: {
    en: 'Dairy & Eggs', ar: 'ألبان وبيض', img: 'images/products/milk.jpg',
    subs: [
      { id: 'milk', en: 'Milk', ar: 'حليب', img: 'images/products/milk.jpg',
        subs: [
          { id: 'milk-family', en: 'Family Packs (1L)',   ar: 'عبوات عائلية (١ لتر)', img: 'images/products/milk.jpg', products: ['milk'] },
          { id: 'milk-small',  en: 'Small Packs (500ml)', ar: 'عبوات صغيرة (٥٠٠ مل)', img: 'images/products/milk.jpg', products: ['milk-500'] },
        ] },
      { id: 'eggs', en: 'Eggs', ar: 'بيض', img: 'images/products/eggs.jpg',
        subs: [
          { id: 'eggs-tray', en: 'Trays (30 pcs)',      ar: 'أطباق (٣٠ حبة)',      img: 'images/products/eggs.jpg', products: ['eggs'] },
          { id: 'eggs-half', en: 'Half Trays (15 pcs)', ar: 'نصف طبق (١٥ حبة)',   img: 'images/products/eggs.jpg', products: ['eggs-15'] },
        ] },
      { id: 'cheese', en: 'Cheese & Butter', ar: 'جبن وزبدة', img: 'images/products/cheese.jpg',
        subs: [
          { id: 'cheese-slices', en: 'Cheese Slices', ar: 'شرائح جبن', img: 'images/products/cheese.jpg', products: ['deal-cheese', 'cheese-400'] },
        ] },
    ],
  },
  bakery: {
    en: 'Bakery', ar: 'مخبوزات', img: 'images/products/bread.jpg',
    subs: [
      { id: 'breads', en: 'Breads', ar: 'خبز', img: 'images/products/bread.jpg',
        subs: [
          { id: 'arabic-bread', en: 'Arabic Bread', ar: 'خبز عربي', img: 'images/products/bread.jpg', products: ['bread', 'bread-10'] },
        ] },
      { id: 'breakfast', en: 'Breakfast', ar: 'فطور', img: 'images/products/cornflakes.jpg',
        subs: [
          { id: 'cereal-boxes', en: 'Cereals',    ar: 'حبوب الإفطار', img: 'images/products/cornflakes.jpg', products: ['deal-flakes', 'flakes-1kg'] },
          { id: 'eggs',         en: 'Eggs',       ar: 'بيض',          img: 'images/products/eggs.jpg',       products: ['eggs', 'eggs-15'] },
        ] },
    ],
  },
  beverages: {
    en: 'Beverages', ar: 'مشروبات', img: 'images/categories/beverages.jpg',
    subs: [
      { id: 'dairy-drinks', en: 'Milk Drinks', ar: 'مشروبات الحليب', img: 'images/products/milk.jpg',
        subs: [
          { id: 'plain-milk', en: 'Plain Milk', ar: 'حليب سادة', img: 'images/products/milk.jpg', products: ['milk', 'milk-500'] },
        ] },
      { id: 'chilled', en: 'Chilled Picks', ar: 'مشروبات باردة', img: 'images/categories/beverages.jpg', products: ['milk-500'] },
    ],
  },
  snacks: {
    en: 'Snacks', ar: 'وجبات خفيفة', img: 'images/categories/snacks.jpg',
    subs: [
      { id: 'chips', en: 'Chips & Crisps', ar: 'رقائق وشيبس', img: 'images/products/chips.jpg',
        subs: [
          { id: 'chips-single', en: 'Single Packs', ar: 'عبوات فردية', img: 'images/products/chips.jpg', products: ['chips-75'] },
          { id: 'chips-family', en: 'Family Packs', ar: 'عبوات عائلية', img: 'images/products/chips.jpg', products: ['deal-chips'] },
        ] },
      { id: 'cereals', en: 'Cereal Snacks', ar: 'حبوب خفيفة', img: 'images/products/cornflakes.jpg',
        subs: [
          { id: 'flakes-small', en: 'Corn Flakes 500g', ar: 'رقائق ذرة ٥٠٠ جم', img: 'images/products/cornflakes.jpg', products: ['deal-flakes'] },
          { id: 'flakes-large', en: 'Corn Flakes 1kg',  ar: 'رقائق ذرة ١ كجم',  img: 'images/products/cornflakes.jpg', products: ['flakes-1kg'] },
        ] },
    ],
  },
  rice: {
    en: 'Rice & Grains', ar: 'أرز وحبوب', img: 'images/products/rice.jpg',
    subs: [
      { id: 'rice', en: 'Rice', ar: 'أرز', img: 'images/products/rice.jpg',
        subs: [
          { id: 'basmati-family', en: 'Basmati 5kg', ar: 'بسمتي ٥ كجم', img: 'images/products/rice.jpg', products: ['rice'] },
          { id: 'basmati-small',  en: 'Basmati 1kg', ar: 'بسمتي ١ كجم', img: 'images/products/rice.jpg', products: ['rice-1kg'] },
        ] },
      { id: 'cereals', en: 'Cereals', ar: 'حبوب', img: 'images/products/cornflakes.jpg', products: ['deal-flakes', 'flakes-1kg'] },
    ],
  },
  frozen: {
    en: 'Frozen', ar: 'مجمدات', img: 'images/categories/frozen.jpg',
    subs: [
      { id: 'frozen-meat', en: 'Frozen Chicken', ar: 'دجاج مجمد', img: 'images/products/chicken.jpg',
        subs: [
          { id: 'frozen-breast', en: 'Chicken Breast', ar: 'صدر دجاج', img: 'images/products/chicken.jpg', products: ['chicken', 'chicken-500'] },
        ] },
    ],
  },
  household: {
    en: 'Household', ar: 'منزلية', img: 'images/categories/household.jpg',
    subs: [
      { id: 'kitchen', en: 'Kitchen Essentials', ar: 'أساسيات المطبخ', img: 'images/products/oliveoil.jpg',
        subs: [
          { id: 'kitchen-oils', en: 'Cooking Oils', ar: 'زيوت الطبخ', img: 'images/products/oliveoil.jpg', products: ['oliveoil', 'oil-1500'] },
        ] },
    ],
  },
  meat: {
    en: 'Meat & Poultry', ar: 'لحوم ودواجن', img: 'images/products/chicken.jpg',
    subs: [
      { id: 'chicken', en: 'Chicken', ar: 'دجاج', img: 'images/products/chicken.jpg',
        subs: [
          { id: 'chicken-whole', en: 'Breast 1kg',  ar: 'صدر ١ كجم',   img: 'images/products/chicken.jpg', products: ['chicken'] },
          { id: 'chicken-half',  en: 'Breast 500g', ar: 'صدر ٥٠٠ جم', img: 'images/products/chicken.jpg', products: ['chicken-500'] },
        ] },
      { id: 'eggs', en: 'Eggs', ar: 'بيض', img: 'images/products/eggs.jpg', products: ['eggs', 'eggs-15'] },
    ],
  },
  oils: {
    en: 'Oils & Condiments', ar: 'زيوت وتوابل', img: 'images/products/oliveoil.jpg',
    subs: [
      { id: 'oils', en: 'Cooking Oils', ar: 'زيوت الطبخ', img: 'images/products/oliveoil.jpg',
        subs: [
          { id: 'olive-oil', en: 'Olive Oil', ar: 'زيت زيتون', img: 'images/products/oliveoil.jpg', products: ['oliveoil', 'oil-1500'] },
        ] },
    ],
  },
};

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}
const cart = loadCart(); // productId -> qty

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function updateBadges() {
  document.querySelectorAll('.bb-cart-badge').forEach((b) => {
    b.textContent = cartCount();
  });
}

function renderControl(container) {
  const id = container.dataset.product;
  const qty = cart[id] || 0;
  // Wide variant: full-width "Add to cart" button (used on the product page).
  const wide = container.dataset.variant === 'wide';
  const isAr = document.documentElement.lang === 'ar';
  container.innerHTML = '';

  // Whenever a control changes, refresh every other control for the same
  // product so duplicate steppers (e.g. card + product page) stay in sync.
  const syncAll = () => {
    document.querySelectorAll(`.bb-cart-control[data-product="${id}"]`).forEach((el) => {
      if (el !== container) renderControl(el);
    });
    updateBadges();
  };

  if (qty === 0) {
    const btn = document.createElement('button');
    btn.className = wide ? 'bb-add-btn bb-add-btn--wide' : 'bb-add-btn';
    btn.textContent = wide ? (isAr ? 'أضف إلى السلة' : 'Add to cart') : '+';
    btn.setAttribute('aria-label', isAr ? 'أضف إلى السلة' : 'Add to cart');
    btn.addEventListener('click', () => {
      cart[id] = 1;
      saveCart();
      renderControl(container);
      syncAll();
    });
    container.appendChild(btn);
  } else {
    const stepper = document.createElement('div');
    stepper.className = wide ? 'bb-stepper bb-stepper--wide' : 'bb-stepper';

    const minus = document.createElement('button');
    minus.textContent = '−';
    minus.addEventListener('click', () => {
      cart[id] = Math.max(0, cart[id] - 1);
      if (cart[id] === 0) delete cart[id];
      saveCart();
      renderControl(container);
      syncAll();
    });

    const count = document.createElement('span');
    count.className = 'bb-qty';
    count.textContent = qty;

    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.disabled = qty >= MAX_QTY; // can only add 1 more at a time, up to the cap
    plus.addEventListener('click', () => {
      cart[id] = Math.min(MAX_QTY, cart[id] + 1);
      saveCart();
      renderControl(container);
      syncAll();
    });

    stepper.append(minus, count, plus);
    container.appendChild(stepper);
  }
}

document.querySelectorAll('.bb-cart-control').forEach(renderControl);
updateBadges();

/* ============================================================
   3b. PRODUCT CARDS → DETAIL PAGE
   Clicking a card (anywhere except its cart control) opens the
   product description page. Works for both the static cards and
   the ones JS renders on the category page.
   .NET later: the card is an <a> to /product/{id}.
============================================================ */
function linkProductCards(scope = document) {
  scope.querySelectorAll('.bb-product-card').forEach((card) => {
    if (card.dataset.linked) return;
    const control = card.querySelector('.bb-cart-control[data-product]');
    if (!control) return;
    const id = control.dataset.product;
    card.dataset.linked = '1';
    card.classList.add('cursor-pointer');
    card.addEventListener('click', (e) => {
      // Don't navigate while tapping the add/stepper control.
      if (e.target.closest('.bb-cart-control')) return;
      location.href = `product.html?id=${encodeURIComponent(id)}`;
    });
  });
}
linkProductCards();

/* ============================================================
   4. CART PAGE — renders cart items from localStorage.
   Only runs when #cartItems exists (cart.html).
   .NET later: server-rendered cart view + cart API.
============================================================ */
const FREE_DELIVERY_THRESHOLD = 100; // KD — same as offer strip
const DELIVERY_FEE = 0.500;          // KD flat fee under threshold

function fmtKD(n) {
  return n.toFixed(3);
}

// Currency label always comes BEFORE the amount and carries the same
// font styling as the amount itself (e.g. "KD 4.750").
function kdLabel() {
  return document.documentElement.lang === 'ar' ? 'د.ك' : 'KD';
}
function priceHtml(n) {
  return `<span data-en="KD" data-ar="د.ك">${kdLabel()}</span> ${fmtKD(n)}`;
}

function renderCartPage() {
  const list = document.getElementById('cartItems');
  if (!list) return;

  const isAr = document.documentElement.lang === 'ar';
  const empty = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummary');
  const ids = Object.keys(cart).filter((id) => PRODUCTS[id]);

  list.innerHTML = '';

  if (ids.length === 0) {
    if (empty) empty.classList.remove('hidden');
    if (summary) summary.classList.add('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  if (summary) summary.classList.remove('hidden');

  let subtotal = 0;

  ids.forEach((id) => {
    const p = PRODUCTS[id];
    const qty = cart[id];
    const lineTotal = p.price * qty;
    subtotal += lineTotal;

    const row = document.createElement('div');
    row.className = 'bb-cart-row flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3';
    row.innerHTML = `
      <img src="${p.img}" alt="" class="w-16 h-16 rounded-xl object-cover shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold truncate">${isAr ? p.ar : p.en}</p>
        <span class="text-[11px] font-bold text-gray-400">${p.pack}</span>
        <p class="bb-price text-brand-green font-extrabold text-sm mt-0.5">${priceHtml(lineTotal)}</p>
      </div>
      <div class="bb-cart-control shrink-0" data-product="${id}"></div>
    `;
    list.appendChild(row);
    renderControl(row.querySelector('.bb-cart-control'));
  });

  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const kd = isAr ? 'د.ك' : 'KD';
  const subEl = document.getElementById('cartSubtotal');
  const delEl = document.getElementById('cartDelivery');
  const totEl = document.getElementById('cartTotal');
  if (subEl) subEl.textContent = `${kd} ${fmtKD(subtotal)}`;
  if (delEl) delEl.textContent = delivery === 0 ? (isAr ? 'مجاني' : 'Free') : `${kd} ${fmtKD(delivery)}`;
  if (totEl) totEl.textContent = `${kd} ${fmtKD(subtotal + delivery)}`;
}

renderCartPage();

// Keep the cart page rows + totals in sync when quantities change or language toggles
if (document.getElementById('cartItems')) {
  document.getElementById('cartItems').addEventListener('click', () => {
    // re-render after the stepper handlers ran
    requestAnimationFrame(renderCartPage);
  });
  if (langToggleEl) langToggleEl.addEventListener('click', renderCartPage);
}

/* ============================================================
   5. CATEGORY PAGE — two chip bars on top, products below.
   A horizontal bar of subcategory chips (icon + label) sits at the
   top of the screen and wraps onto more lines as needed. When the
   active subcategory has a third level, a second chip bar in the same
   style renders directly beneath it with its sub-subcategories. The
   product grid of the deepest active level fills the width below.
   Only runs when #subcatRail exists (category.html).
   Selection comes from ?cat=<id>&sub=<id>&sub3=<id>.
   .NET later: server renders both chip bars + grid; the active
   subcategory path becomes part of the route.
============================================================ */

// Every product under a node: its own ids plus those of its children.
// .NET later: a recursive CTE over the categories tree.
function nodeProducts(node) {
  const own = node.products || [];
  const nested = (node.subs || []).flatMap((child) => child.products || []);
  return [...new Set([...own, ...nested])];
}

function initCategoryPage() {
  const rail = document.getElementById('subcatRail');
  if (!rail) return;
  const rail3 = document.getElementById('subcatRail3');

  const params = new URLSearchParams(location.search);
  const catId = params.get('cat');
  const category = CATEGORIES[catId] || CATEGORIES.fruitsveg;

  // "All" pseudo-subcategory first (like Zepto), then real subs
  const allProducts = [...new Set(category.subs.flatMap(nodeProducts))];
  const subs = [
    { id: 'all', en: 'All', ar: 'الكل', img: category.img, products: allProducts },
    ...category.subs,
  ];
  let activeSubId = subs.find((s) => s.id === params.get('sub')) ? params.get('sub') : 'all';

  // Third level of the active subcategory — null when it has none,
  // otherwise its own "All" chip followed by the real sub-subcategories.
  function subs3For(subId) {
    const sub = subs.find((s) => s.id === subId);
    if (!sub || !sub.subs || sub.subs.length === 0) return null;
    return [
      { id: 'all', en: 'All', ar: 'الكل', img: sub.img, products: nodeProducts(sub) },
      ...sub.subs,
    ];
  }

  let subs3 = subs3For(activeSubId);
  let activeSub3Id = subs3 && subs3.find((s) => s.id === params.get('sub3')) ? params.get('sub3') : 'all';

  const isAr = () => document.documentElement.lang === 'ar';

  // Page + document title
  const titleEl = document.getElementById('categoryTitle');
  titleEl.dataset.en = category.en;
  titleEl.dataset.ar = category.ar;
  titleEl.textContent = isAr() ? category.ar : category.en;
  document.title = `BoboMart — ${category.en}`;

  // Keep the URL shareable without reloading
  function syncUrl() {
    const url = new URL(location);
    url.searchParams.set('cat', catId || 'fruitsveg');
    url.searchParams.set('sub', activeSubId);
    if (subs3) url.searchParams.set('sub3', activeSub3Id);
    else url.searchParams.delete('sub3');
    history.replaceState(null, '', url);
  }

  // One chip builder for both bars — the third level only adds a
  // modifier class, so the two bars stay visually identical in style.
  function buildChip(node, active, level, onPick) {
    const btn = document.createElement('button');
    btn.className = `bb-subcat-chip${level === 3 ? ' bb-subcat-chip--l3' : ''}${active ? ' is-active' : ''}`;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.innerHTML = `
      <img src="${node.img}" alt="" />
      <span class="bb-subcat-label" data-en="${node.en}" data-ar="${node.ar}">${isAr() ? node.ar : node.en}</span>
    `;
    btn.addEventListener('click', onPick);
    return btn;
  }

  function renderRail() {
    rail.innerHTML = '';
    subs.forEach((sub) => {
      rail.appendChild(buildChip(sub, sub.id === activeSubId, 2, () => {
        activeSubId = sub.id;
        // A new subcategory brings its own third level — start at "All"
        subs3 = subs3For(activeSubId);
        activeSub3Id = 'all';
        syncUrl();
        renderRail();
        renderRail3();
        renderGrid();
      }));
    });
  }

  // Third-level bar — hidden entirely when the active subcategory
  // has no sub-subcategories.
  function renderRail3() {
    if (!rail3) return;
    rail3.innerHTML = '';
    rail3.classList.toggle('hidden', !subs3);
    rail3.classList.toggle('flex', !!subs3);
    if (!subs3) return;

    subs3.forEach((sub3) => {
      rail3.appendChild(buildChip(sub3, sub3.id === activeSub3Id, 3, () => {
        activeSub3Id = sub3.id;
        syncUrl();
        renderRail3();
        renderGrid();
      }));
    });
  }

  function renderGrid() {
    const grid = document.getElementById('subcatProducts');
    const emptyEl = document.getElementById('subcatEmpty');
    // The deepest active level decides what the grid shows.
    const sub = subs.find((s) => s.id === activeSubId);
    const sub3 = subs3 && activeSub3Id !== 'all' ? subs3.find((s) => s.id === activeSub3Id) : null;
    const node = sub3 || sub;
    const ids = nodeProducts(node).filter((id) => PRODUCTS[id]);

    const subTitleEl = document.getElementById('subcatTitle');
    subTitleEl.dataset.en = node.en;
    subTitleEl.dataset.ar = node.ar;
    subTitleEl.textContent = isAr() ? node.ar : node.en;

    const countEl = document.getElementById('subcatCount');
    countEl.dataset.en = `${ids.length} items`;
    countEl.dataset.ar = `${ids.length} منتج`;
    countEl.textContent = isAr() ? countEl.dataset.ar : countEl.dataset.en;

    grid.innerHTML = '';
    emptyEl.classList.toggle('hidden', ids.length > 0);

    ids.forEach((id) => {
      const p = PRODUCTS[id];
      // Same card anatomy as the home page: offer % badge on the
      // top-start corner, Best Seller on the top-end corner, a two-line
      // title, then the price row (KD first) and the stepper below it.
      const card = document.createElement('div');
      card.className = 'bb-product-card bg-white border border-gray-100 rounded-2xl p-3 md:p-4 relative flex flex-col hover:shadow-md transition';
      const pct = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
      const discountBadge = pct
        ? `<span class="bb-discount-badge absolute top-2.5 left-2.5 z-10 bg-brand-orange text-white text-xs md:text-sm font-extrabold rounded-full px-2.5 py-1 leading-none">-${pct}%</span>`
        : '';
      const oldPrice = p.oldPrice
        ? `<span class="bb-price-old text-gray-400 font-bold text-xs line-through">${fmtKD(p.oldPrice)}</span>`
        : '';
      card.innerHTML = `
        ${discountBadge}
        <img src="${p.img}" alt="${p.en}" class="bb-product-img aspect-square w-full object-cover rounded-xl" />
        <p class="bb-product-name text-sm font-bold mt-2" data-en="${p.en}" data-ar="${p.ar}">${isAr() ? p.ar : p.en}</p>
        <div class="bb-price-row mt-auto pt-2 flex flex-wrap items-baseline gap-x-2">
          <span class="bb-price ${pct ? 'text-brand-green' : 'text-gray-900'} font-extrabold text-[15px]">${priceHtml(p.price)}</span>
          ${oldPrice}
        </div>
        <div class="bb-cart-control mt-2 flex justify-end" data-product="${id}"></div>
      `;
      grid.appendChild(card);
      renderControl(card.querySelector('.bb-cart-control'));
    });
    linkProductCards(grid);
  }

  renderRail();
  renderRail3();
  renderGrid();
}

initCategoryPage();

/* ============================================================
   6. PRODUCT PAGE — single product description view.
   Quick-commerce style: big image, name, pack, price and a
   short description, with an "Add to cart" buy bar.
   Only runs when #productDetail exists (product.html).
   Product comes from ?id=<id> in the URL.
   .NET later: server renders /product/{id} from the DB.
============================================================ */
function initProductPage() {
  const root = document.getElementById('productDetail');
  if (!root) return;

  const isAr = () => document.documentElement.lang === 'ar';
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const p = PRODUCTS[id];

  const notFound = document.getElementById('productNotFound');

  if (!p) {
    root.classList.add('hidden');
    if (notFound) notFound.classList.remove('hidden');
    return;
  }

  // Image
  const img = document.getElementById('productImg');
  img.src = p.img;
  img.alt = p.en;

  // Discount badge (only when there's an old price)
  const badge = document.getElementById('productDiscount');
  if (p.oldPrice && p.oldPrice > p.price) {
    const pct = Math.round((1 - p.price / p.oldPrice) * 100);
    badge.textContent = `-${pct}%`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  // Name (translatable via applyLanguage on toggle)
  const nameEl = document.getElementById('productName');
  nameEl.dataset.en = p.en;
  nameEl.dataset.ar = p.ar;
  nameEl.textContent = isAr() ? p.ar : p.en;
  document.title = `BoboMart — ${p.en}`;

  // Pack size
  document.getElementById('productPack').textContent = p.pack;

  // Price + old price
  document.getElementById('productPrice').textContent = fmtKD(p.price);
  const oldEl = document.getElementById('productOldPrice');
  if (p.oldPrice && p.oldPrice > p.price) {
    oldEl.textContent = fmtKD(p.oldPrice);
    oldEl.classList.remove('hidden');
  } else {
    oldEl.classList.add('hidden');
  }

  // Short description
  const desc = DESCRIPTIONS[p.en];
  const descEl = document.getElementById('productDesc');
  if (desc) {
    descEl.dataset.en = desc.en;
    descEl.dataset.ar = desc.ar;
    descEl.textContent = isAr() ? desc.ar : desc.en;
  }

  // Buy bar price + cart control
  const barPrice = document.getElementById('productPriceBar');
  if (barPrice) barPrice.innerHTML = priceHtml(p.price);

  const control = document.getElementById('productCartControl');
  control.dataset.product = id;
  renderControl(control);
}

initProductPage();

/* ============================================================
   7. CHECKOUT — three pages, one shared draft.
        step 1  checkout-address.html  → delivery address
        step 2  checkout-payment.html  → delivery type, voucher,
                                         payment options, order items
        step 3  checkout-confirm.html  → order confirmed
   The draft lives in localStorage so each page picks up where the
   previous one left off.
   .NET later: the draft becomes TempData / a server-side checkout
   session and each step is its own Checkout action.
============================================================ */
const ADDRESS_KEY = 'bobomart-addresses';
const CHECKOUT_KEY = 'bobomart-checkout';
const ORDER_KEY = 'bobomart-last-order';

// Areas served, used for the Area dropdown on step 1.
// .NET later: the areas table, filtered to those with active coverage.
const AREAS = [
  { en: 'Salmiya',        ar: 'السالمية' },
  { en: 'Hawally',        ar: 'حولي' },
  { en: 'Jabriya',        ar: 'الجابرية' },
  { en: 'Kuwait City',    ar: 'مدينة الكويت' },
  { en: 'Sharq',          ar: 'شرق' },
  { en: 'Salwa',          ar: 'سلوى' },
  { en: 'Mishref',        ar: 'مشرف' },
  { en: 'Rumaithiya',     ar: 'الرميثية' },
  { en: 'Bayan',          ar: 'بيان' },
  { en: 'Sabah Al Salem', ar: 'صباح السالم' },
  { en: 'Farwaniya',      ar: 'الفروانية' },
  { en: 'Fahaheel',       ar: 'الفحيحيل' },
  { en: 'Mangaf',         ar: 'المنقف' },
  { en: 'Mahboula',       ar: 'المهبولة' },
  { en: 'Fintas',         ar: 'الفنطاس' },
  { en: 'Jahra',          ar: 'الجهراء' },
];

function areaLabel(en, isAr) {
  const found = AREAS.find((a) => a.en === en);
  return isAr && found ? found.ar : en;
}

// Saved addresses of the logged-in user, held as structured fields so
// step 1 can fill its form and step 2 can show just the important ones.
// .NET later: the user's addresses table.
const DEFAULT_ADDRESSES = [
  { id: 'home', label: 'Home', labelAr: 'المنزل', type: 'apartment', area: 'Salmiya',
    block: '4', street: '12', avenue: '', building: '8', floor: '2', flat: '3',
    phone: '+965 9000 1234', directions: 'Near the pharmacy, white gate' },
  { id: 'work', label: 'Work', labelAr: 'العمل', type: 'office', area: 'Kuwait City',
    block: '6', street: 'Al Shuhada', avenue: '', building: 'Al Hamra Tower',
    floor: '22', flat: '4', phone: '+965 9000 5678', directions: '' },
];

// Delivery types. `fee` is waived above FREE_DELIVERY_THRESHOLD.
// .NET later: slots table with per-area capacity.
const SLOTS = [
  { id: 'express',  en: 'Express',      ar: 'سريع',        subEn: '15–30 min',      subAr: '١٥–٣٠ دقيقة', fee: 0.500, tagEn: 'Fastest', tagAr: 'الأسرع' },
  { id: 'standard', en: 'Normal',       ar: 'عادي',        subEn: 'Within 2 hours', subAr: 'خلال ساعتين', fee: 0.250 },
  { id: 'evening',  en: 'Evening slot', ar: 'فترة المساء', subEn: '6:00 – 9:00 PM', subAr: '٦:٠٠ – ٩:٠٠ م', fee: 0, tagEn: 'Free', tagAr: 'مجاني' },
];

// Enabled payment methods. `img` is the brand mark shown on the row —
// placeholder SVGs under images/payments, swap for official assets.
// .NET later: gateway configuration per store.
const PAYMENTS = [
  { id: 'knet', en: 'KNET', ar: 'كي نت', img: 'images/payments/knet.svg',
    subEn: 'Pay with your Kuwaiti debit card', subAr: 'الدفع ببطاقة الخصم الكويتية' },
  { id: 'card', en: 'Visa / Mastercard', ar: 'فيزا / ماستركارد',
    img: 'images/payments/visa.svg', img2: 'images/payments/mastercard.svg',
    subEn: 'Credit or debit card', subAr: 'بطاقة ائتمان أو خصم' },
  { id: 'applepay', en: 'Apple Pay', ar: 'أبل باي', img: 'images/payments/applepay.svg',
    subEn: 'Fast and secure — no card details needed', subAr: 'سريع وآمن — بدون بيانات بطاقة' },
  { id: 'cod', en: 'Cash on delivery', ar: 'الدفع عند التسليم', img: 'images/payments/cash.svg',
    subEn: 'Pay the driver in cash on arrival', subAr: 'ادفع للمندوب نقداً عند الوصول' },
];

// Demo voucher codes.
// .NET later: promotions table with validity dates and usage limits.
const PROMOS = {
  BOBO10:   { type: 'percent',      value: 10,    en: '10% off your order',     ar: 'خصم ١٠٪ على طلبك' },
  FRESH500: { type: 'amount',       value: 0.500, en: 'KD 0.500 off',           ar: 'خصم ٠.٥٠٠ د.ك' },
  FREEDEL:  { type: 'freedelivery', value: 0,     en: 'Free delivery unlocked', ar: 'تم تفعيل التوصيل المجاني' },
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function loadAddresses() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADDRESS_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* fall through to the defaults */ }
  return DEFAULT_ADDRESSES;
}

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(CHECKOUT_KEY)) || {}; }
  catch { return {}; }
}
function saveDraft(draft) {
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(draft));
}

// Cart lines resolved against the catalog
function cartLines() {
  return Object.keys(cart)
    .filter((id) => PRODUCTS[id])
    .map((id) => ({ id, qty: cart[id], ...PRODUCTS[id] }));
}

function addressName(addr, isAr) {
  return (isAr && addr.labelAr) ? addr.labelAr : addr.label;
}

// The address as one readable line, area last (matching how Kuwaiti
// addresses are spoken). .NET later: a display helper on the model.
function addressLine(addr, isAr) {
  const parts = [];
  if (addr.block)    parts.push(`${isAr ? 'قطعة' : 'Block'} ${addr.block}`);
  if (addr.street)   parts.push(`${isAr ? 'شارع' : 'Street'} ${addr.street}`);
  if (addr.avenue)   parts.push(`${isAr ? 'جادة' : 'Avenue'} ${addr.avenue}`);
  if (addr.building) parts.push(`${isAr ? 'مبنى' : 'Bldg'} ${addr.building}`);
  if (addr.floor)    parts.push(`${isAr ? 'طابق' : 'Floor'} ${addr.floor}`);
  if (addr.flat)     parts.push(`${isAr ? 'شقة' : 'Flat'} ${addr.flat}`);
  return `${parts.join(', ')} — ${areaLabel(addr.area, isAr)}`;
}

// One summary line — shared by the payment page and the confirmation
// page, so both read identically.
function orderLineHtml(item, isAr) {
  return `
    <div class="bb-checkout-line flex items-center gap-2.5">
      <img src="${item.img}" alt="" class="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100" />
      <div class="flex-1 min-w-0">
        <p class="text-xs font-extrabold truncate">${escapeHtml(isAr ? item.ar : item.en)}</p>
        <!-- dir=ltr: pack sizes are Latin ("6 pcs", "1L"), so the "× qty"
             suffix would reorder inside an Arabic paragraph without it -->
        <p class="text-[11px] font-bold text-gray-400"><span dir="ltr">${escapeHtml(item.pack)} × ${item.qty}</span></p>
      </div>
      <span class="bb-price text-xs font-extrabold text-gray-900 shrink-0">${priceHtml(item.price * item.qty)}</span>
    </div>
  `;
}

// Empty-cart guard shared by both checkout steps
function blockEmptyCheckout(rootId, barId) {
  const root = document.getElementById(rootId);
  if (!root) return false;            // not this page
  if (cartLines().length > 0) return false;

  root.classList.add('hidden');
  const bar = document.getElementById(barId);
  if (bar) bar.classList.add('hidden');
  const empty = document.getElementById('checkoutEmpty');
  if (empty) empty.classList.remove('hidden');
  return true;                       // handled — stop here
}

/* ============================================================
   7a. STEP 1 — DELIVERY ADDRESS
   A dropdown of every saved address sits above the address fields,
   which are always on the page (no "add new address" tap). Picking a
   saved address fills the fields; "New address" clears them.
   Only runs when #checkoutAddress exists (checkout-address.html).
============================================================ */
function initCheckoutAddressPage() {
  const root = document.getElementById('checkoutAddress');
  if (!root) return;
  if (blockEmptyCheckout('checkoutAddress', 'addressBar')) return;

  const isAr = () => document.documentElement.lang === 'ar';
  const addresses = loadAddresses();
  const draft = loadDraft();

  const select = document.getElementById('addressSelect');
  const areaSelect = document.getElementById('addrArea');
  const errorEl = document.getElementById('addrError');

  const FIELDS = {
    label: 'addrLabel', type: 'addrType', area: 'addrArea', block: 'addrBlock',
    street: 'addrStreet', avenue: 'addrAvenue', building: 'addrBuilding',
    floor: 'addrFloor', flat: 'addrFlat', phone: 'addrPhone', directions: 'addrDirections',
  };
  const field = (key) => document.getElementById(FIELDS[key]);

  // Areas dropdown — REPEATABLE: one <option> per served area
  areaSelect.innerHTML = AREAS.map((a) =>
    `<option value="${escapeHtml(a.en)}" data-en="${escapeHtml(a.en)}" data-ar="${escapeHtml(a.ar)}">${escapeHtml(isAr() ? a.ar : a.en)}</option>`
  ).join('');

  // Saved-address dropdown — REPEATABLE: one <option> per address, plus
  // a final "New address" entry so nothing hides behind an extra tap
  function renderSelect(activeId) {
    select.innerHTML = [
      ...addresses.map((a) => {
        const en = `${a.label} — ${a.area}`;
        const ar = `${addressName(a, true)} — ${areaLabel(a.area, true)}`;
        return `<option value="${escapeHtml(a.id)}" data-en="${escapeHtml(en)}" data-ar="${escapeHtml(ar)}">${escapeHtml(isAr() ? ar : en)}</option>`;
      }),
      `<option value="new" data-en="+ New address" data-ar="+ عنوان جديد">${isAr() ? '+ عنوان جديد' : '+ New address'}</option>`,
    ].join('');
    select.value = activeId;
  }

  function fillFields(addr) {
    Object.keys(FIELDS).forEach((key) => { field(key).value = addr[key] || ''; });
    if (!addr.type) field('type').value = 'house';
    if (!addr.area) areaSelect.value = AREAS[0].en;
  }

  // Start from whatever step 1 saved last, else the first saved address
  const startId = draft.address && draft.address.id ? draft.address.id : addresses[0].id;
  const saved = addresses.find((a) => a.id === startId);
  renderSelect(saved ? startId : 'new');
  fillFields(draft.address && draft.address.id === startId ? draft.address : (saved || addresses[0]));

  select.addEventListener('change', () => {
    errorEl.classList.add('hidden');
    if (select.value === 'new') {
      fillFields({ area: AREAS[0].en, type: 'house' });
      field('label').focus();
      return;
    }
    fillFields(addresses.find((a) => a.id === select.value));
  });

  function continueToPayment() {
    const addr = {};
    Object.keys(FIELDS).forEach((key) => { addr[key] = field(key).value.trim(); });

    if (!addr.area || !addr.block || !addr.street) {
      errorEl.classList.remove('hidden');
      errorEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    errorEl.classList.add('hidden');

    const editingSaved = select.value !== 'new';
    addr.id = editingSaved ? select.value : `addr-${addresses.length + 1}`;
    if (!addr.label) addr.label = isAr() ? 'عنوان جديد' : 'New address';
    addr.labelAr = editingSaved
      ? (addresses.find((a) => a.id === addr.id) || {}).labelAr || addr.label
      : addr.label;

    // .NET later: POST the address; the response id goes into the draft
    localStorage.setItem(ADDRESS_KEY,
      JSON.stringify(addresses.filter((a) => a.id !== addr.id).concat(addr)));

    saveDraft({ ...loadDraft(), address: addr });
    location.href = 'checkout-payment.html';
  }

  ['addressContinue', 'addressContinueMobile'].forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', continueToPayment);
  });
}

initCheckoutAddressPage();

/* ============================================================
   7b. STEP 2 — PAYMENT
   Sections, in order: the chosen address (with a link back to step 1),
   delivery type, voucher, payment options, then order items + totals.
   Only runs when #checkoutPayment exists (checkout-payment.html).
============================================================ */
function initCheckoutPaymentPage() {
  const root = document.getElementById('checkoutPayment');
  if (!root) return;
  if (blockEmptyCheckout('checkoutPayment', 'placeOrderBar')) return;

  const isAr = () => document.documentElement.lang === 'ar';
  const draft = loadDraft();

  // No address yet — step 1 has to happen first
  if (!draft.address) {
    location.replace('checkout-address.html');
    return;
  }

  let activeSlotId = SLOTS.some((s) => s.id === draft.slotId) ? draft.slotId : SLOTS[0].id;
  let activePaymentId = PAYMENTS.some((p) => p.id === draft.paymentId) ? draft.paymentId : PAYMENTS[0].id;
  let promo = draft.promo && PROMOS[draft.promo] ? { code: draft.promo, ...PROMOS[draft.promo] } : null;

  /* ---------- 1 · delivering to ---------- */
  const addr = draft.address;
  const labelEl = document.getElementById('payAddrLabel');
  labelEl.dataset.en = addr.label;
  labelEl.dataset.ar = addressName(addr, true);
  labelEl.textContent = isAr() ? labelEl.dataset.ar : labelEl.dataset.en;

  const areaEl = document.getElementById('payAddrArea');
  areaEl.dataset.en = areaLabel(addr.area, false);
  areaEl.dataset.ar = areaLabel(addr.area, true);
  areaEl.textContent = isAr() ? areaEl.dataset.ar : areaEl.dataset.en;

  const lineEl = document.getElementById('payAddrLine');
  lineEl.dataset.en = addressLine(addr, false);
  lineEl.dataset.ar = addressLine(addr, true);
  lineEl.textContent = isAr() ? lineEl.dataset.ar : lineEl.dataset.en;

  document.getElementById('payAddrPhone').textContent = addr.phone || '';

  /* ---------- 2 · delivery type ---------- */
  const slotList = document.getElementById('slotList');

  function renderSlots() {
    slotList.innerHTML = '';
    SLOTS.forEach((slot) => {
      const active = slot.id === activeSlotId;
      const btn = document.createElement('button');
      btn.className = `bb-opt${active ? ' is-active' : ''}`;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      const tag = slot.tagEn
        ? `<span class="bb-opt-tag mt-1.5" data-en="${slot.tagEn}" data-ar="${slot.tagAr}">${isAr() ? slot.tagAr : slot.tagEn}</span>`
        : '';
      btn.innerHTML = `
        <span class="bb-radio"></span>
        <span class="flex-1 min-w-0">
          <span class="bb-opt-title block" data-en="${slot.en}" data-ar="${slot.ar}">${isAr() ? slot.ar : slot.en}</span>
          <span class="bb-opt-sub block" data-en="${slot.subEn}" data-ar="${slot.subAr}">${isAr() ? slot.subAr : slot.subEn}</span>
          ${tag}
        </span>
      `;
      btn.addEventListener('click', () => {
        activeSlotId = slot.id;
        renderSlots();
        renderTotals();   // the delivery fee feeds straight into the total
      });
      slotList.appendChild(btn);
    });
  }

  /* ---------- 3 · voucher ---------- */
  const promoInput = document.getElementById('promoInput');
  const promoMsg = document.getElementById('promoMsg');

  function showPromoMsg(text, ok) {
    promoMsg.textContent = text;
    promoMsg.classList.remove('hidden', 'is-ok', 'is-bad');
    promoMsg.classList.add(ok ? 'is-ok' : 'is-bad');
  }

  if (promo) {
    promoInput.value = promo.code;
    showPromoMsg(`✓ ${isAr() ? promo.ar : promo.en}`, true);
  }

  document.getElementById('promoApplyBtn').addEventListener('click', () => {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) {
      promo = null;
      promoMsg.classList.add('hidden');
      renderTotals();
      return;
    }
    const found = PROMOS[code];
    if (!found) {
      promo = null;
      showPromoMsg(isAr() ? 'كود القسيمة غير صحيح' : 'That voucher code is not valid', false);
    } else {
      promo = { code, ...found };
      showPromoMsg(`✓ ${isAr() ? found.ar : found.en}`, true);
    }
    renderTotals();
  });

  /* ---------- 4 · payment options ---------- */
  const paymentList = document.getElementById('paymentList');
  const cardFields = document.getElementById('cardFields');

  function renderPayments() {
    paymentList.innerHTML = '';
    PAYMENTS.forEach((pay) => {
      const active = pay.id === activePaymentId;
      const btn = document.createElement('button');
      btn.className = `bb-opt bb-opt--center${active ? ' is-active' : ''}`;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      // Brand marks — Visa/Mastercard share a row, hence two images
      const marks = [pay.img, pay.img2].filter(Boolean)
        .map((src) => `<img src="${src}" alt="" class="bb-pay-img" />`).join('');
      btn.innerHTML = `
        <span class="bb-radio"></span>
        <span class="bb-pay-marks">${marks}</span>
        <span class="flex-1 min-w-0">
          <span class="bb-opt-title block" data-en="${pay.en}" data-ar="${pay.ar}">${isAr() ? pay.ar : pay.en}</span>
          <span class="bb-opt-sub block" data-en="${pay.subEn}" data-ar="${pay.subAr}">${isAr() ? pay.subAr : pay.subEn}</span>
        </span>
      `;
      btn.addEventListener('click', () => {
        activePaymentId = pay.id;
        renderPayments();
      });
      paymentList.appendChild(btn);
    });
    // Card fields belong to the card method only
    if (cardFields) cardFields.classList.toggle('hidden', activePaymentId !== 'card');
  }

  /* ---------- 5 · order items and details ---------- */
  function renderItems() {
    document.getElementById('checkoutItems').innerHTML =
      cartLines().map((item) => orderLineHtml(item, isAr())).join('');
  }

  // Restore the note / contactless choice when coming back from step 1
  const noteEl = document.getElementById('orderNote');
  const contactlessEl = document.getElementById('contactlessOpt');
  if (draft.note) noteEl.value = draft.note;
  if (draft.contactless) contactlessEl.checked = true;

  /* ---------- totals ---------- */
  // One function so every input (delivery type, voucher, cart)
  // recomputes the same way.
  // .NET later: the server is the source of truth here.
  function computeTotals() {
    const lines = cartLines();
    const subtotal = lines.reduce((sum, item) => sum + item.price * item.qty, 0);
    const slot = SLOTS.find((s) => s.id === activeSlotId);

    let delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : slot.fee;
    let discount = 0;

    if (promo) {
      if (promo.type === 'percent') discount = subtotal * (promo.value / 100);
      else if (promo.type === 'amount') discount = Math.min(promo.value, subtotal);
      else if (promo.type === 'freedelivery') delivery = 0;
    }

    return { lines, subtotal, delivery, discount, total: subtotal + delivery - discount, slot };
  }

  function renderTotals() {
    const { subtotal, delivery, discount, total } = computeTotals();
    const kd = isAr() ? 'د.ك' : 'KD';

    document.getElementById('checkoutSubtotal').textContent = `${kd} ${fmtKD(subtotal)}`;
    document.getElementById('checkoutDelivery').textContent =
      delivery === 0 ? (isAr() ? 'مجاني' : 'Free') : `${kd} ${fmtKD(delivery)}`;

    // Only one display class at a time, so neither can shadow the other
    const discountRow = document.getElementById('checkoutDiscountRow');
    discountRow.classList.toggle('hidden', discount <= 0);
    discountRow.classList.toggle('flex', discount > 0);
    document.getElementById('checkoutDiscount').textContent = `− ${kd} ${fmtKD(discount)}`;

    document.getElementById('checkoutTotal').textContent = `${kd} ${fmtKD(total)}`;
    const barTotal = document.getElementById('checkoutTotalBar');
    if (barTotal) barTotal.textContent = `${kd} ${fmtKD(total)}`;
  }

  /* ---------- place order ---------- */
  let placing = false;   // stops the draft-sync below from resurrecting the draft

  function placeOrder(btn) {
    const { lines, subtotal, delivery, discount, total, slot } = computeTotals();
    const payment = PAYMENTS.find((p) => p.id === activePaymentId);
    placing = true;

    // Brief pending state so the tap always feels acknowledged
    btn.disabled = true;
    btn.style.opacity = '.7';
    btn.textContent = isAr() ? 'جارٍ تأكيد الطلب…' : 'Placing order…';

    const order = {
      id: `BM-${2500 + (Date.now() % 500)}`,
      placedAt: new Date().toISOString(),
      items: lines.map(({ id, en, ar, pack, price, img, qty }) => ({ id, en, ar, pack, price, img, qty })),
      subtotal, delivery, discount, total,
      address: draft.address,
      slot: { id: slot.id, en: slot.en, ar: slot.ar, subEn: slot.subEn, subAr: slot.subAr },
      payment: { id: payment.id, en: payment.en, ar: payment.ar, img: payment.img },
      promo: promo ? promo.code : null,
      note: noteEl.value.trim(),
      contactless: contactlessEl.checked,
    };

    // .NET later: POST the order, then redirect to /order/{id}
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CHECKOUT_KEY);
    location.href = 'checkout-confirm.html';
  }

  ['placeOrderBtn', 'placeOrderBtnMobile'].forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', () => placeOrder(btn));
  });

  // Keep the draft current so stepping back to the address page and
  // returning does not lose the delivery type / voucher / note choices.
  ['click', 'input'].forEach((evt) => root.addEventListener(evt, () => {
    if (placing) return;   // the order is on its way — leave the cleared draft alone
    saveDraft({
      ...loadDraft(),
      slotId: activeSlotId,
      paymentId: activePaymentId,
      promo: promo ? promo.code : null,
      note: noteEl.value,
      contactless: contactlessEl.checked,
    });
  }));

  renderSlots();
  renderPayments();
  renderItems();
  renderTotals();
}

initCheckoutPaymentPage();

/* ============================================================
   7c. STEP 3 — ORDER CONFIRMED
   Reads the order step 2 just saved.
   Only runs when #orderConfirmed exists (checkout-confirm.html).
   .NET later: server renders /order/{id} from the DB instead.
============================================================ */
function initCheckoutConfirmPage() {
  const root = document.getElementById('orderConfirmed');
  if (!root) return;

  const isAr = () => document.documentElement.lang === 'ar';
  const missing = document.getElementById('orderMissing');

  let order = null;
  try { order = JSON.parse(localStorage.getItem(ORDER_KEY)); } catch { order = null; }

  if (!order || !order.items || order.items.length === 0) {
    root.classList.add('hidden');
    if (missing) missing.classList.remove('hidden');
    return;
  }

  document.getElementById('successOrderId').textContent = `#${order.id}`;
  document.title = `BoboMart — Order #${order.id}`;

  // Arrival window comes from the chosen delivery type
  const etaEl = document.getElementById('successEta');
  etaEl.dataset.en = order.slot.subEn;
  etaEl.dataset.ar = order.slot.subAr;
  etaEl.textContent = isAr() ? order.slot.subAr : order.slot.subEn;

  const addrLabel = document.getElementById('successAddrLabel');
  addrLabel.dataset.en = `${order.address.label} · ${areaLabel(order.address.area, false)}`;
  addrLabel.dataset.ar = `${addressName(order.address, true)} · ${areaLabel(order.address.area, true)}`;
  addrLabel.textContent = isAr() ? addrLabel.dataset.ar : addrLabel.dataset.en;

  const addrLine = document.getElementById('successAddrLine');
  addrLine.dataset.en = addressLine(order.address, false);
  addrLine.dataset.ar = addressLine(order.address, true);
  addrLine.textContent = isAr() ? addrLine.dataset.ar : addrLine.dataset.en;

  const payImg = document.getElementById('successPayImg');
  if (payImg && order.payment.img) payImg.src = order.payment.img;

  const payEl = document.getElementById('successPayment');
  payEl.dataset.en = order.payment.en;
  payEl.dataset.ar = order.payment.ar;
  payEl.textContent = isAr() ? order.payment.ar : order.payment.en;

  const slotEl = document.getElementById('successSlot');
  slotEl.dataset.en = `${order.slot.en} · ${order.slot.subEn}`;
  slotEl.dataset.ar = `${order.slot.ar} · ${order.slot.subAr}`;
  slotEl.textContent = isAr() ? slotEl.dataset.ar : slotEl.dataset.en;

  document.getElementById('successItems').innerHTML =
    order.items.map((item) => orderLineHtml(item, isAr())).join('');

  const kd = isAr() ? 'د.ك' : 'KD';
  document.getElementById('successSubtotal').textContent = `${kd} ${fmtKD(order.subtotal)}`;
  document.getElementById('successDelivery').textContent =
    order.delivery === 0 ? (isAr() ? 'مجاني' : 'Free') : `${kd} ${fmtKD(order.delivery)}`;
  const discountRow = document.getElementById('successDiscountRow');
  discountRow.classList.toggle('hidden', order.discount <= 0);
  discountRow.classList.toggle('flex', order.discount > 0);
  document.getElementById('successDiscount').textContent = `− ${kd} ${fmtKD(order.discount)}`;
  document.getElementById('successTotal').textContent = `${kd} ${fmtKD(order.total)}`;
}

initCheckoutConfirmPage();
