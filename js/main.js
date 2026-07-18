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
