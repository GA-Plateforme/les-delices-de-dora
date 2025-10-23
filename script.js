// ---------- Données produits ----------
const PRODUCTS = [
  { id: 'p01', name: "Chikwangues", subtitle: "(Carton de 20)", price: 60.00, img: "" },
  { id: 'p02', name: "Safou", subtitle: "(1kg)", price: 20.00, img: "" },
  { id: 'p03', name: "Fumbwa / Okok", subtitle: "(paquet)", price: 5.00, img: "" },
  { id: 'p04', name: "Noix de palme", subtitle: "(paquet)", price: 5.00, img: "" },
  { id: 'p05', name: "Saka Saka", subtitle: "(paquet)", price: 5.00, img: "" },
  { id: 'p06', name: "Asperge Africaine", subtitle: "(paquet)", price: 10.00, img: "" },
  { id: 'p07', name: "Poisson Fumé - Nzombo", subtitle: "(1kg)", price: 12.00, img: "" },
  { id: 'p08', name: "Mboto", subtitle: "(1kg)", price: 9.00, img: "" },
  { id: 'p09', name: "Poisson Salée - Bouaka Boueni", subtitle: "(1kg)", price: 11.00, img: "" },
  { id: 'p10', name: "Arachides", subtitle: "(sac)", price: 20.00, img: "" },
  { id: 'p11', name: "Foufou", subtitle: "(1kg)", price: 8.00, img: "" },
  { id: 'p12', name: "Piment Africain", subtitle: "(1kg)", price: 6.00, img: "" },
  { id: 'p13', name: "Gombo / Oka", subtitle: "(1kg)", price: 6.00, img: "" },
  { id: 'p14', name: "Petit Kola", subtitle: "(paquet)", price: 10.00, img: "" },
  { id: 'p15', name: "Tondolo", subtitle: "(paquet)", price: 10.00, img: "" },
  { id: 'p16', name: "Aubergine", subtitle: "(1kg)", price: 4.00, img: "" },
  { id: 'p17', name: "Citronnelle", subtitle: "(1kg)", price: 3.50, img: "" },
  { id: 'p18', name: "Boukouloutou", subtitle: "(1kg)", price: 7.00, img: "" },
  { id: 'p19', name: "Gaï Gaï", subtitle: "(sac)", price: 5.00, img: "" },
  { id: 'p20', name: "Autre spécialité", subtitle: "", price: 5.00, img: "" }
];

// ---------- Initialisation EmailJS ----------
(function initEmailJS() {
  if (window.emailjs && typeof window.emailjs.init === 'function') {
    try {
      emailjs.init('Q7rxLkalpH60S-9BU'); // Remplace par ta clé publique EmailJS
    } catch (e) { /* silent */ }
  }
})();

// ---------- Fonctions utilitaires ----------
function formatCurrency(val) {
  return `${val.toFixed(2)} $`;
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

// ---------- Panier ----------
const CART_KEY = 'demo_cart_v4';
let CART = JSON.parse(localStorage.getItem(CART_KEY) || '{}');

function persist(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const count = Object.values(CART).reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = count;
  renderCartItems();
}
function renderCartItems() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  container.innerHTML = '';
  let total = 0;
  let count = 0;
  for (const id in CART) {
    const item = CART[id];
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) continue;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="ci-thumb" style="background-image:url('${product.img || ''}')"></div>
      <div style="flex:1">
        <div style="font-weight:600">${product.name}</div>
        <div class="small">${item.qty} × ${formatCurrency(product.price)}</div>
      </div>
      <button class="remove" data-id="${id}">✖</button>
    `;
    container.appendChild(div);
    total += item.qty * product.price;
    count += item.qty;
  }
  totalEl.textContent = formatCurrency(total);
  countEl.textContent = count;
  persist(CART_KEY, CART);
  document.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', () => {
      delete CART[btn.dataset.id];
      updateCartUI();
    });
  });
}

// ---------- Recherche ----------
document.getElementById('searchInput').addEventListener('input', e => {
  const val = e.target.value.toLowerCase();
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(val) || (p.subtitle || '').toLowerCase().includes(val)
  );
  renderProducts(filtered);
});

// ---------- Rendu produits ----------
function renderProducts(list) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="img" style="background-image:url('${p.img || ''}')"></div>
      <div class="card-header">
        <div>
          <div class="card-title">${p.name}</div>
          <div class="card-sub">${p.subtitle}</div>
        </div>
        <div class="price">${formatCurrency(p.price)}</div>
      </div>
      <div class="controls">
        <button class="btn-primary" data-id="${p.id}">Ajouter</button>
      </div>
    `;
    grid.appendChild(card);
  });
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (!CART[id]) CART[id] = { qty: 1 };
      else CART[id].qty += 1;
      updateCartUI();
    });
  });
}

// ---------- Panier toggle ----------
document.getElementById('openCart').addEventListener('click', () => {
  document.getElementById('cartPanel').classList.add('open');
});
document.getElementById('closeCart').addEventListener('click', () => {
  document.getElementById('cartPanel').classList.remove('open');
});
document.getElementById('clearCart').addEventListener('click', () => {
  CART = {};
  updateCartUI();
});

// ---------- Initialisation ----------
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(PRODUCTS);
  updateCartUI();
});
