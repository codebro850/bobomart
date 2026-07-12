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

document.getElementById('langToggle').addEventListener('click', () => {
  const next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
  applyLanguage(next);
});

// Restore saved language on load
applyLanguage(localStorage.getItem(LANG_KEY) || 'en');

/* ============================================================
   2. DEAL OF THE DAY — countdown to midnight (today only)
   .NET later: end time comes from the deal record in DB.
============================================================ */
function updateCountdown() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // end of today

  let diff = Math.max(0, Math.floor((midnight - now) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  document.getElementById('cdHours').textContent = String(h).padStart(2, '0');
  document.getElementById('cdMins').textContent = String(m).padStart(2, '0');
  document.getElementById('cdSecs').textContent = String(s).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ============================================================
   3. ADD TO CART + STEPPER
   Direct "Add to cart" button on every card. After adding, it
   becomes a − qty + stepper: quantity changes only by 1 at a
   time, capped at MAX_QTY per item.
   .NET later: buttons post to a cart controller/API.
============================================================ */
const MAX_QTY = 10;
const cart = {}; // productId -> qty

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
    btn.textContent = document.documentElement.lang === 'ar' ? '+ أضف' : '+ Add';
    btn.addEventListener('click', () => {
      cart[id] = 1;
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
      renderControl(container);
      updateBadges();
    });

    stepper.append(minus, count, plus);
    container.appendChild(stepper);
  }
}

document.querySelectorAll('.bb-cart-control').forEach(renderControl);
updateBadges();

// Re-render Add buttons when language changes so their label translates
document.getElementById('langToggle').addEventListener('click', () => {
  document.querySelectorAll('.bb-cart-control').forEach(renderControl);
});
