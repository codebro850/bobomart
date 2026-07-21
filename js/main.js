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

// Category → subcategories → product ids (Zepto/Instamart-style browse).
// .NET later: categories + subcategories tables, products joined by FK.
const CATEGORIES = {
  fruitsveg: {
    en: 'Fruits & Veg', ar: 'فواكه وخضار', img: 'images/categories/fruitsveg.jpg',
    subs: [
      { id: 'fruits',     en: 'Fresh Fruits',     ar: 'فواكه طازجة',  img: 'images/products/apples.jpg',   products: ['deal-apples', 'apples-500', 'bananas', 'bananas-500'] },
      { id: 'vegetables', en: 'Fresh Vegetables', ar: 'خضار طازجة',   img: 'images/products/tomatoes.jpg', products: ['tomatoes', 'tomatoes-1kg'] },
      { id: 'seasonal',   en: 'Seasonal Picks',   ar: 'مختارات الموسم', img: 'images/categories/fruitsveg.jpg', products: ['bananas', 'deal-apples', 'tomatoes'] },
    ],
  },
  dairy: {
    en: 'Dairy & Eggs', ar: 'ألبان وبيض', img: 'images/products/milk.jpg',
    subs: [
      { id: 'milk',   en: 'Milk',            ar: 'حليب',       img: 'images/products/milk.jpg',   products: ['milk', 'milk-500'] },
      { id: 'eggs',   en: 'Eggs',            ar: 'بيض',        img: 'images/products/eggs.jpg',   products: ['eggs', 'eggs-15'] },
      { id: 'cheese', en: 'Cheese & Butter', ar: 'جبن وزبدة',  img: 'images/products/cheese.jpg', products: ['deal-cheese', 'cheese-400'] },
    ],
  },
  bakery: {
    en: 'Bakery', ar: 'مخبوزات', img: 'images/products/bread.jpg',
    subs: [
      { id: 'breads',    en: 'Breads',    ar: 'خبز',         img: 'images/products/bread.jpg',      products: ['bread', 'bread-10'] },
      { id: 'breakfast', en: 'Breakfast', ar: 'فطور',        img: 'images/products/cornflakes.jpg', products: ['deal-flakes', 'flakes-1kg', 'eggs'] },
    ],
  },
  beverages: {
    en: 'Beverages', ar: 'مشروبات', img: 'images/categories/beverages.jpg',
    subs: [
      { id: 'dairy-drinks', en: 'Milk Drinks',   ar: 'مشروبات الحليب', img: 'images/products/milk.jpg',       products: ['milk', 'milk-500'] },
      { id: 'chilled',      en: 'Chilled Picks', ar: 'مشروبات باردة',  img: 'images/categories/beverages.jpg', products: ['milk-500'] },
    ],
  },
  snacks: {
    en: 'Snacks', ar: 'وجبات خفيفة', img: 'images/categories/snacks.jpg',
    subs: [
      { id: 'chips',   en: 'Chips & Crisps', ar: 'رقائق وشيبس', img: 'images/products/chips.jpg',      products: ['deal-chips', 'chips-75'] },
      { id: 'cereals', en: 'Cereal Snacks',  ar: 'حبوب خفيفة',  img: 'images/products/cornflakes.jpg', products: ['deal-flakes', 'flakes-1kg'] },
    ],
  },
  rice: {
    en: 'Rice & Grains', ar: 'أرز وحبوب', img: 'images/products/rice.jpg',
    subs: [
      { id: 'rice',    en: 'Rice',    ar: 'أرز',   img: 'images/products/rice.jpg',       products: ['rice', 'rice-1kg'] },
      { id: 'cereals', en: 'Cereals', ar: 'حبوب',  img: 'images/products/cornflakes.jpg', products: ['deal-flakes', 'flakes-1kg'] },
    ],
  },
  frozen: {
    en: 'Frozen', ar: 'مجمدات', img: 'images/categories/frozen.jpg',
    subs: [
      { id: 'frozen-meat', en: 'Frozen Chicken', ar: 'دجاج مجمد', img: 'images/products/chicken.jpg', products: ['chicken', 'chicken-500'] },
    ],
  },
  household: {
    en: 'Household', ar: 'منزلية', img: 'images/categories/household.jpg',
    subs: [
      { id: 'kitchen', en: 'Kitchen Essentials', ar: 'أساسيات المطبخ', img: 'images/products/oliveoil.jpg', products: ['oliveoil', 'oil-1500'] },
    ],
  },
  meat: {
    en: 'Meat & Poultry', ar: 'لحوم ودواجن', img: 'images/products/chicken.jpg',
    subs: [
      { id: 'chicken', en: 'Chicken', ar: 'دجاج', img: 'images/products/chicken.jpg', products: ['chicken', 'chicken-500'] },
      { id: 'eggs',    en: 'Eggs',    ar: 'بيض',  img: 'images/products/eggs.jpg',    products: ['eggs', 'eggs-15'] },
    ],
  },
  oils: {
    en: 'Oils & Condiments', ar: 'زيوت وتوابل', img: 'images/products/oliveoil.jpg',
    subs: [
      { id: 'oils', en: 'Cooking Oils', ar: 'زيوت الطبخ', img: 'images/products/oliveoil.jpg', products: ['oliveoil', 'oil-1500'] },
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
  container.innerHTML = '';

  if (qty === 0) {
    const btn = document.createElement('button');
    btn.className = 'bb-add-btn';
    btn.textContent = '+';
    btn.setAttribute('aria-label', document.documentElement.lang === 'ar' ? 'أضف إلى السلة' : 'Add to cart');
    btn.addEventListener('click', () => {
      cart[id] = 1;
      saveCart();
      renderControl(container);
      updateBadges();
    });
    container.appendChild(btn);
  } else {
    const stepper = document.createElement('div');
    stepper.className = 'bb-stepper';

    const minus = document.createElement('button');
    minus.textContent = '−';
    minus.addEventListener('click', () => {
      cart[id] = Math.max(0, cart[id] - 1);
      if (cart[id] === 0) delete cart[id];
      saveCart();
      renderControl(container);
      updateBadges();
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
      updateBadges();
    });

    stepper.append(minus, count, plus);
    container.appendChild(stepper);
  }
}

document.querySelectorAll('.bb-cart-control').forEach(renderControl);
updateBadges();

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
        <p class="text-brand-green font-extrabold text-sm mt-0.5">${fmtKD(lineTotal)} <small>${isAr ? 'د.ك' : 'KD'}</small></p>
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
  if (subEl) subEl.textContent = `${fmtKD(subtotal)} ${kd}`;
  if (delEl) delEl.textContent = delivery === 0 ? (isAr ? 'مجاني' : 'Free') : `${fmtKD(delivery)} ${kd}`;
  if (totEl) totEl.textContent = `${fmtKD(subtotal + delivery)} ${kd}`;
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
   5. CATEGORY PAGE — Zepto/Instamart-style split view.
   Left rail: subcategories in a single column. Right: product
   grid of the active subcategory. Only runs when #subcatRail
   exists (category.html). Category comes from ?cat=<id>.
   .NET later: server renders the rail + grid; the active
   subcategory becomes part of the route.
============================================================ */
function initCategoryPage() {
  const rail = document.getElementById('subcatRail');
  if (!rail) return;

  const params = new URLSearchParams(location.search);
  const catId = params.get('cat');
  const category = CATEGORIES[catId] || CATEGORIES.fruitsveg;

  // "All" pseudo-subcategory first (like Zepto), then real subs
  const allProducts = [...new Set(category.subs.flatMap((s) => s.products))];
  const subs = [
    { id: 'all', en: 'All', ar: 'الكل', img: category.img, products: allProducts },
    ...category.subs,
  ];
  let activeSubId = subs.find((s) => s.id === params.get('sub')) ? params.get('sub') : 'all';

  const isAr = () => document.documentElement.lang === 'ar';

  // Page + document title
  const titleEl = document.getElementById('categoryTitle');
  titleEl.dataset.en = category.en;
  titleEl.dataset.ar = category.ar;
  titleEl.textContent = isAr() ? category.ar : category.en;
  document.title = `BoboMart — ${category.en}`;

  function renderRail() {
    rail.innerHTML = '';
    subs.forEach((sub) => {
      const active = sub.id === activeSubId;
      const btn = document.createElement('button');
      btn.className = `bb-subcat-item w-full flex flex-col md:flex-row items-center gap-1 md:gap-3 px-1.5 md:px-3 py-2.5 text-center md:text-left transition ${
        active ? 'is-active' : 'hover:bg-gray-100'
      }`;
      btn.innerHTML = `
        <img src="${sub.img}" alt="" class="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover shrink-0 ${active ? 'ring-2 ring-brand-green' : ''}" />
        <span class="text-[10px] md:text-xs font-extrabold leading-tight ${active ? 'text-brand-green' : 'text-gray-600'}"
              data-en="${sub.en}" data-ar="${sub.ar}">${isAr() ? sub.ar : sub.en}</span>
      `;
      btn.addEventListener('click', () => {
        activeSubId = sub.id;
        // keep the URL shareable without reloading
        const url = new URL(location);
        url.searchParams.set('cat', catId || 'fruitsveg');
        url.searchParams.set('sub', sub.id);
        history.replaceState(null, '', url);
        renderRail();
        renderGrid();
      });
      rail.appendChild(btn);
    });
  }

  function renderGrid() {
    const grid = document.getElementById('subcatProducts');
    const emptyEl = document.getElementById('subcatEmpty');
    const sub = subs.find((s) => s.id === activeSubId);
    const ids = sub.products.filter((id) => PRODUCTS[id]);

    const subTitleEl = document.getElementById('subcatTitle');
    subTitleEl.dataset.en = sub.en;
    subTitleEl.dataset.ar = sub.ar;
    subTitleEl.textContent = isAr() ? sub.ar : sub.en;

    const countEl = document.getElementById('subcatCount');
    countEl.dataset.en = `${ids.length} items`;
    countEl.dataset.ar = `${ids.length} منتج`;
    countEl.textContent = isAr() ? countEl.dataset.ar : countEl.dataset.en;

    grid.innerHTML = '';
    emptyEl.classList.toggle('hidden', ids.length > 0);

    ids.forEach((id) => {
      const p = PRODUCTS[id];
      const card = document.createElement('div');
      card.className = 'bb-product-card bg-white border border-gray-100 rounded-2xl p-2.5 md:p-4 relative flex flex-col hover:shadow-md transition';
      const oldPrice = p.oldPrice
        ? `<span class="bb-price-old text-gray-400 text-xs line-through">${fmtKD(p.oldPrice)}</span>`
        : '';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.en}" class="bb-product-img aspect-square w-full object-cover rounded-xl" />
        <p class="bb-product-name text-sm font-bold mt-1" data-en="${p.en}" data-ar="${p.ar}">${isAr() ? p.ar : p.en}</p>
        <span class="bb-pack-size text-[11px] font-bold text-gray-400">${p.pack}</span>
        <div class="mt-1 flex items-center gap-2">
          <span class="bb-price text-brand-green font-extrabold text-sm">${fmtKD(p.price)} <small data-en="KD" data-ar="د.ك">${isAr() ? 'د.ك' : 'KD'}</small></span>
          ${oldPrice}
        </div>
        <div class="bb-cart-control mt-2 flex justify-end" data-product="${id}"></div>
      `;
      grid.appendChild(card);
      renderControl(card.querySelector('.bb-cart-control'));
    });
  }

  renderRail();
  renderGrid();
}

initCategoryPage();
