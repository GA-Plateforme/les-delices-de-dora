/* ---------- Données produits ---------- */
/*
  Pour activer vos marqueurs ICI(1), ICI(2), ICI(3) vous pouvez ajouter
  des propriétés aux produits : status, status2, status3.
  Exemples :
    status: "stokepuise"       -> rend le produit non cliquable + badge "Stock épuisé"
    status2: "bientot"         -> badge "Bientôt épuisé"
    status3: "rabais(15.00)"   -> applique promo, affiche ancien prix barré et nouveau prix 15.00 $
*/
const PRODUCTS = [
  {id:'p01',name:"Chikwangues", subtitle:"(Carton de 20)",price:60.00,img:''},
  {id:'p02',name:"Safou", subtitle:"(1kg)",price:20.00,img:''},
  {id:'p03',name:"Fumbwa / Okok", subtitle:"(paquet)",price:5.00,img:''},
  {id:'p04',name:"Noix de palme", subtitle:"(paquet)",price:5.00,img:''},
  {id:'p05',name:"Saka Saka", subtitle:"(paquet)",price:5.00,img:''},
  {id:'p06',name:"Asperge Africaine", subtitle:"(paquet)",price:10.00,img:''},
  {id:'p07',name:"Poisson Fumé - Nzombo", subtitle:"(1kg)",price:12.00,img:''},
  {id:'p08',name:"Mboto", subtitle:"(1kg)",price:9.00,img:''},
  {id:'p09',name:"Poisson Salée - Bouaka Boueni", subtitle:"(1kg)",price:11.00,img:''},
  {id:'p10',name:"Arachides", subtitle:"(sac)",price:20.00,img:''},
  {id:'p11',name:"Foufou", subtitle:"(1kg)",price:8.00,img:''},
  {id:'p12',name:"Piment Africain", subtitle:"(1kg)",price:6.00,img:''},
  {id:'p13',name:"Gombo / Oka", subtitle:"(1kg)",price:6.00,img:''},
  {id:'p14',name:"Petit Kola", subtitle:"(paquet)",price:10.00,img:''},
  {id:'p15',name:"Tondolo", subtitle:"(paquet)",price:10.00,img:''},
  {id:'p16',name:"Aubergine", subtitle:"(1kg)",price:4.00,img:''},
  {id:'p17',name:"Citronnelle", subtitle:"(1kg)",price:3.50,img:''},
  {id:'p18',name:"Boukouloutou", subtitle:"(1kg)",price:7.00,img:''},
  {id:'p19',name:"Gaï Gaï", subtitle:"(sac)",price:5.00,img:''},
  {id:'p20',name:"Autre spécialité", subtitle:"",price:5.00,img:''}
];

const CART_KEY = 'demo_cart_v4';
let CART = load(CART_KEY, {});

/* Références UI */
const productGrid = document.getElementById('productGrid');
const cartBadge = document.getElementById('cartBadge');
const cartBadgeFloat = document.getElementById('cartBadgeFloat');
const openCartBtn = document.getElementById('openCart') || document.getElementById('openCartFloat');
const cartPanel = document.getElementById('cartPanel');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const checkoutCart = document.getElementById('checkoutCart');
const clearCartBtn = document.getElementById('clearCart');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const suggestionsEl = document.getElementById('suggestions');
const overlay = document.getElementById('overlay');

const orderModal = document.getElementById('orderModal');
const closeOrder = document.getElementById('closeOrder');
const orderCancel = document.getElementById('orderCancel');
const orderSend = document.getElementById('orderSend');
const orderForm = document.getElementById('orderForm');
const orderSummary = document.getElementById('orderSummary');
const orderFeedback = document.getElementById('orderFeedback');

const itemsHtmlField = document.getElementById('itemsHtmlField');
const totalField = document.getElementById('totalField');
const createdAtField = document.getElementById('createdAtField');

/* Initialisation EmailJS (silencieuse si absente) */
(function initEmailJS(){
  if(window.emailjs && typeof window.emailjs.init === 'function'){
    try{ emailjs.init('Q7rxLkalpH60S-9BU'); }catch(e){ console.warn('EmailJS init failed', e); }
  }
})();

/* Rendu initial */
renderProducts(PRODUCTS);
updateCartUI();

/* Assurer que modal/overlay restent cachés au chargement */
if (orderModal) { orderModal.style.display = 'none'; orderModal.setAttribute('aria-hidden','true'); }
if (overlay) { overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true'); }

/* Événements UI */
openCartBtn && openCartBtn.addEventListener('click', ()=>{ toggleCart(); });
closeCartBtn && closeCartBtn.addEventListener('click', ()=>closeCart());
clearCartBtn && clearCartBtn.addEventListener('click', ()=>{ 
  if(clearCartBtn.disabled) return;
  showConfirm('Vider le panier ?', ()=>{
    CART={}; persist(CART_KEY,CART); updateCartUI();
    showTimedAlert('Panier vidé.');
  }, ()=>{});
});
checkoutCart && checkoutCart.addEventListener('click', ()=>openOrder());
searchInput && searchInput.addEventListener('input', (e)=>{ handleSearchInput(e.target.value); });
clearSearch && clearSearch.addEventListener('click', ()=>{ searchInput.value=''; handleSearchInput(''); });
closeOrder && closeOrder.addEventListener('click', closeOrderModal);
orderCancel && orderCancel.addEventListener('click', closeOrderModal);
overlay && overlay.addEventListener('click', ()=>{ closeOrderModal(); });

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.about-toggle');
  if(!btn) return;
  const id = btn.getAttribute('aria-controls');
  const content = document.getElementById(id);
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  content.hidden = expanded;
});

/* Fermer suggestions lorsqu'on clique à l'extérieur */
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.search') && !e.target.closest('#suggestions')) {
    suggestionsEl.classList.remove('open');
  }
});

/* Navigation clavier pour suggestions */
let suggestionIndex = -1;
searchInput.addEventListener('keydown', (e)=>{
  const items = suggestionsEl.querySelectorAll('.item');
  if(!items.length) return;
  if(e.key === 'ArrowDown'){ e.preventDefault(); suggestionIndex = Math.min(suggestionIndex+1, items.length-1); updateSuggestionActive(); }
  if(e.key === 'ArrowUp'){ e.preventDefault(); suggestionIndex = Math.max(suggestionIndex-1, 0); updateSuggestionActive(); }
  if(e.key === 'Enter'){ e.preventDefault(); const active = suggestionsEl.querySelector('.item.active'); if(active) { selectSuggestion(active.dataset.id); } }
});
function updateSuggestionActive(){
  const items = suggestionsEl.querySelectorAll('.item');
  items.forEach((it,i)=> it.classList.toggle('active', i === suggestionIndex));
  if(suggestionIndex >= 0){
    const el = items[suggestionIndex];
    if(el) el.scrollIntoView({block:'nearest'});
  }
}

/* Recherche + suggestions */
function handleSearchInput(q){
  const val = (q||'').trim().toLowerCase();
  if(!val){ renderProducts(PRODUCTS); suggestionsEl.classList.remove('open'); return; }
  const filtered = PRODUCTS.filter(p=>p.name.toLowerCase().includes(val) || (p.subtitle||'').toLowerCase().includes(val));
  renderProducts(filtered);
  renderSuggestions(filtered.slice(0,8));
}
function renderSuggestions(list){
  suggestionsEl.innerHTML = '';
  if(!list || list.length === 0){ suggestionsEl.classList.remove('open'); return; }
  list.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.setAttribute('role','option');
    div.dataset.id = p.id;
    div.innerHTML = `<span style="font-weight:600">${escapeHtml(p.name)}</span><span style="color:var(--muted);font-size:13px">${formatCurrency(p.price)}</span>`;
    div.addEventListener('click', ()=> selectSuggestion(p.id));
    suggestionsEl.appendChild(div);
  });
  suggestionIndex = -1;
  suggestionsEl.classList.add('open');
}
function selectSuggestion(id){
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if(card){
    card.scrollIntoView({behavior:'smooth',block:'center'});
    const qEl = card.querySelector('.qty');
    if(qEl) qEl.textContent = (CART[id] ? CART[id].qty : 1);
  }
  suggestionsEl.classList.remove('open');
}

/* Fenêtres dynamiques (alertes / confirm / chargement) */
function closeAllWindowsAndModals(){ document.querySelectorAll('.dynamic-overlay, .dynamic-alert, .loading-overlay').forEach(el=>el.remove()); }
function showAlert(message){
  closeAllWindowsAndModals();
  const overlay = document.createElement('div'); overlay.className = 'dynamic-overlay';
  const alertBox = document.createElement('div'); alertBox.className = 'dynamic-alert';
  alertBox.innerHTML = `<div>${message}</div>`;
  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);
  alertBox.setAttribute('tabindex','-1');
  setTimeout(()=>alertBox.focus(),50);
  function onDocClickClose(e){ if (!alertBox.contains(e.target)) { overlay.remove(); document.removeEventListener('click', onDocClickClose); } }
  setTimeout(()=>document.addEventListener('click', onDocClickClose),50);
}
function showTimedAlert(message, duration = 2500){ showAlert(message); setTimeout(()=>{ const lastOverlay = document.querySelector('.dynamic-overlay'); if(lastOverlay) lastOverlay.remove(); }, duration); }
function showConfirm(message, onConfirm, onCancel){
  closeAllWindowsAndModals();
  const overlay = document.createElement('div'); overlay.className = 'dynamic-overlay';
  const alertBox = document.createElement('div'); alertBox.className = 'dynamic-alert';
  alertBox.innerHTML = `
    <div style="text-align:center;">
      <div style="margin-bottom:12px;">${message}</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn ghost" id="confirm-no">Non</button>
        <button class="btn primary" id="confirm-yes">Oui</button>
      </div>
    </div>
  `;
  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);
  const yes = alertBox.querySelector('#confirm-yes');
  const no = alertBox.querySelector('#confirm-no');
  yes.onclick = () => { overlay.remove(); if (onConfirm) onConfirm(); };
  no.onclick = () => { overlay.remove(); if (onCancel) onCancel(); };
  alertBox.setAttribute('tabindex','-1');
  setTimeout(()=>alertBox.focus(),50);
}
function showLoading(message = 'Envoi en cours...'){
  closeAllWindowsAndModals();
  const overlay = document.createElement('div'); overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-box" role="status" aria-live="polite">
      <div class="spinner" aria-hidden style="width:48px;height:48px;border-radius:50%;border:6px solid rgba(11,116,222,0.12);border-top-color:var(--accent);animation:spin 1s linear infinite"></div>
      <div style="font-weight:700;color:#07304a">${message}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  return { close: ()=>{ const el = document.querySelector('.loading-overlay'); if(el) el.remove(); } };
}

/* ---------- Helpers robustes pour le panier et formatage ---------- */
function load(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
function persist(key, obj){ try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){ console.warn('persist failed', e); } }

/* formatCurrency robuste: tolère undefined/null/chaînes */
function formatCurrency(v){
  const n = Number(v);
  if (!isFinite(n)) return '0.00 $';
  return n.toFixed(2) + ' $';
}

/* cartCount tolérant */
function cartCount(){ return Object.values(CART).reduce((s,it)=> s + (Number(it.qty) || 0), 0); }

/* cartAmount tolérant */
function cartAmount(){
  return Object.values(CART).reduce((s,it)=>{
    const p = Number(it.price);
    const q = Number(it.qty) || 0;
    return s + (isFinite(p) ? p * q : 0);
  }, 0);
}

/* Parse utility for status fields */
function parseStatusField(val){
  if(!val) return null;
  const v = String(val).toLowerCase();
  if(v.includes('stokepuise') || v.includes('stockepuise') || v.includes('epuis')) return {type:'soldout'};
  if(v.includes('bientot') || v.includes('dimstok') || v.includes('low')) return {type:'soon'};
  const rabaisMatch = v.match(/rabais\((\d+(\.\d+)?)\)/);
  if(rabaisMatch) return {type:'promo', newPrice: parseFloat(rabaisMatch[1])};
  return null;
}

/* Rendu des produits (gère soldout/soon/promo) */
function renderProducts(list){
  productGrid.innerHTML = '';
  list.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('data-id', p.id);

    const s1 = parseStatusField(p.status);
    const s2 = parseStatusField(p.status2);
    const s3 = parseStatusField(p.status3);
    const statuses = [s1,s2,s3].filter(Boolean);
    let state = null;
    if(statuses.some(s=>s.type === 'soldout')) state = {type:'soldout'};
    else if(statuses.some(s=>s.type === 'promo')) state = statuses.find(s=>s.type === 'promo');
    else if(statuses.some(s=>s.type === 'soon')) state = {type:'soon'};

    let displayPriceHtml = '';
    if(state && state.type === 'promo' && typeof state.newPrice === 'number' && isFinite(state.newPrice)){
      const old = formatCurrency(p.price);
      const neu = formatCurrency(state.newPrice);
      displayPriceHtml = `<span class="price-old">${old}</span><span class="price-new">${neu}</span>`;
    } else {
      displayPriceHtml = `<span class="price">${formatCurrency(p.price)}</span>`;
    }

    const isSoldOut = state && state.type === 'soldout';
    if (isSoldOut) { card.style.opacity = '0.5'; card.style.pointerEvents = 'none'; }

    card.innerHTML = `
      <div class="card-header">
        <div style="flex:1">
          <div class="card-title">${escapeHtml(p.name)}</div>
          ${p.subtitle ? `<div class="card-sub">${escapeHtml(p.subtitle)}</div>` : ''}
        </div>
        <div style="text-align:right">
          ${displayPriceHtml}
        </div>
      </div>

      <div class="img" style="background-image:url('${p.img || ''}');"></div>

      <div class="controls">
        <div class="qtybox" aria-label="Quantité">
          <button class="decr" data-id="${p.id}" aria-label="Réduire la quantité">-</button>
          <span class="qty" id="qty-${p.id}">${CART[p.id] ? CART[p.id].qty : 1}</span>
          <button class="incr" data-id="${p.id}" aria-label="Augmenter la quantité">+</button>
        </div>
        <button class="btn-primary addcart" data-id="${p.id}">Ajouter au panier</button>
      </div>
    `;
    productGrid.appendChild(card);

    if(state){
      const imgDiv = card.querySelector('.img');
      if(imgDiv){
        const badge = document.createElement('div');
        badge.className = 'product-badge';
        if(state.type === 'soldout'){ badge.textContent = 'Stock épuisé'; }
        else if(state.type === 'soon'){ badge.classList.add('soon'); badge.textContent = 'Bientôt épuisé'; }
        else if(state.type === 'promo'){ badge.classList.add('promo'); badge.textContent = 'Produit en rabais'; }
        imgDiv.appendChild(badge);
      }
    }

    if(!isSoldOut){
      card.querySelector('.incr').addEventListener('click', ()=>{
        const qEl = card.querySelector('.qty');
        qEl.textContent = parseInt(qEl.textContent || '1') + 1;
      });
      card.querySelector('.decr').addEventListener('click', ()=>{
        const qEl = card.querySelector('.qty');
        const val = Math.max(1, parseInt(qEl.textContent || '1') - 1);
        qEl.textContent = val;
      });
      card.querySelector('.addcart').addEventListener('click', (e)=>{
        const id = e.currentTarget.getAttribute('data-id');
        const q = parseInt(card.querySelector('.qty').textContent || '1');

        let priceToAdd = Number(p.price);
        if(state && state.type === 'promo' && typeof state.newPrice === 'number' && isFinite(state.newPrice)){
          priceToAdd = Number(state.newPrice);
        }

        addToCart(p.id, p.name, priceToAdd, p.img, q);
        showTimedAlert(`<div style="text-align:center;font-weight:700">${escapeHtml(p.name)}</div><div style="text-align:center;margin-top:6px">ajouté au panier.</div>`, 1800);
      });
    } else {
      const controls = card.querySelector('.controls');
      if(controls){
        controls.innerHTML = `<div class="small muted">Indisponible</div>`;
      }
    }
  });
}

/* Ajout/suppression articles */
function addToCart(id,name,price,img,qty){
  const priceNum = Number(price);
  if (!isFinite(priceNum)){
    console.warn('addToCart: prix invalide pour', id, price);
    return;
  }
  if(qty <= 0) return;
  if(!CART[id]) CART[id] = {id,name,price: priceNum,img,qty};
  else { CART[id].qty = qty; CART[id].price = priceNum; }
  persist(CART_KEY,CART);
  updateCartUI();
}

function removeFromCart(id){
  if(!CART[id]) return;
  delete CART[id];
  persist(CART_KEY,CART);
  updateCartUI();
}

/* Mise à jour interface panier */
function updateCartUI(){
  const count = cartCount();
  if(cartBadge) cartBadge.textContent = count;
  if(cartBadgeFloat) cartBadgeFloat.textContent = count;
  if(!cartItemsEl) return;
  cartItemsEl.innerHTML = '';
  const items = Object.values(CART);
  if(items.length === 0){
    cartItemsEl.innerHTML = '<div class="small muted">Votre panier est vide.</div>';
  } else {
    items.forEach(it=>{
      const node = document.createElement('div');
      node.className = 'cart-item';
      node.innerHTML = `
        <div class="ci-thumb" style="background-image:url('${it.img || ''}')"></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight:600">${escapeHtml(it.name)}</div>
            <div class="small muted">${formatCurrency(it.price)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
            <div class="qtybox">
              <button class="cart-decr" data-id="${it.id}">-</button>
              <span style="min-width:36px;text-align:center">${it.qty}</span>
              <button class="cart-incr" data-id="${it.id}">+</button>
            </div>
            <div class="small muted">Sous-total: <strong>${formatCurrency(it.qty * it.price)}</strong></div>
            <button class="remove" title="Supprimer" data-id="${it.id}">✖</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(node);
      node.querySelector('.cart-incr').addEventListener('click', (e)=>{
        const pid = e.currentTarget.getAttribute('data-id');
        CART[pid].qty += 1; persist(CART_KEY,CART); updateCartUI();
      });
      node.querySelector('.cart-decr').addEventListener('click', (e)=>{
        const pid = e.currentTarget.getAttribute('data-id');
        CART[pid].qty = Math.max(1, CART[pid].qty - 1); persist(CART_KEY,CART); updateCartUI();
      });
      node.querySelector('.remove').addEventListener('click', (e)=>{
        const pid = e.currentTarget.getAttribute('data-id');
        showConfirm('Supprimer "'+it.name+'"?', ()=>{
          removeFromCart(pid);
          showTimedAlert(`"${it.name}" supprimé.`,1400);
        }, ()=>{});
      });
    });
  }

  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  if(countEl) countEl.textContent = cartCount();
  if(totalEl) totalEl.textContent = formatCurrency(cartAmount());

  if(Object.keys(CART).length === 0){
    clearCartBtn.disabled = true;
    clearCartBtn.setAttribute('aria-disabled','true');
  } else {
    clearCartBtn.disabled = false;
    clearCartBtn.removeAttribute('aria-disabled');
  }
}

/* Ouverture / fermeture panier & modal */
function toggleCart(){ if(cartPanel.classList.contains('open')) closeCart(); else openCart(); }
function openCart(){ cartPanel.classList.add('open'); cartPanel.setAttribute('aria-hidden','false'); }
function closeCart(){ cartPanel.classList.remove('open'); cartPanel.setAttribute('aria-hidden','true'); }

function openOrder(){
  const items = Object.values(CART);
  if(items.length === 0){ showAlert('Panier vide'); return; }
  renderOrderSummary();
  orderFeedback.textContent = '';
  clearFieldErrors();
  orderModal.style.display = 'flex'; overlay.style.display = 'flex'; orderModal.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow = 'hidden';
  orderModal.scrollTop = 0;
}
function closeOrderModal(){
  orderModal.style.display = 'none'; overlay.style.display = 'none'; orderModal.setAttribute('aria-hidden','true'); overlay.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow = '';
}

/* Validation */
function normalizedLettersCount(s){
  return (s || '').replace(/\s+/g,'').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,'').length;
}
function isValidCanadianPhone(v){
  const digits = (v || '').replace(/\D/g,'');
  if(digits.length === 11 && digits.startsWith('1')) return true;
  if(digits.length === 10) return true;
  return false;
}
function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
}

/* Field errors */
function setFieldError(id, message){
  const el = document.getElementById('err-'+id);
  if(el){ el.textContent = message; el.style.display = 'block'; }
}
function clearFieldError(id){
  const el = document.getElementById('err-'+id);
  if(el){ el.style.display = 'none'; }
}
function clearFieldErrors(){
  ['fullName','phone','email','address'].forEach(clearFieldError);
}

/* Récapitulatif commande */
function renderOrderSummary(){
  const items = Object.values(CART);
  if(items.length === 0){ orderSummary.innerHTML = '<div class="small muted">Panier vide.</div>'; return; }
  const rows = items.map(it=>{
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(it.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(it.price)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(it.price * it.qty)}</td>
    </tr>`;
  }).join('');
  orderSummary.innerHTML = `<div style="overflow:auto"><table style="width:100%; border-collapse:collapse;">
    <thead><tr><th style="text-align:left;padding:6px">Article</th><th style="text-align:center;padding:6px">Qté</th><th style="text-align:right;padding:6px">PU</th><th style="text-align:right;padding:6px">Sous-total</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2"></td><td style="padding:10px; font-weight:700; text-align:right; border-top:2px solid #ddd">Total</td><td style="padding:10px; font-weight:800; text-align:right; border-top:2px solid #ddd">${formatCurrency(cartAmount())}</td></tr></tfoot>
    </table></div>`;
}

/* Envoi commande (EmailJS avec fallback REST) */
orderSend && orderSend.addEventListener('click', async ()=>{
  clearFieldErrors();
  orderFeedback.classList.remove('error');
  orderFeedback.style.color = '#6b7280';
  orderFeedback.textContent = 'Validation en cours...';

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();

  let hasError = false;
  if(normalizedLettersCount(fullName) < 4){ setFieldError('fullName','Le nom doit contenir au moins 4 lettres.'); hasError = true; }
  if(!isValidCanadianPhone(phone)){ setFieldError('phone','Numéro invalide pour le Canada.'); hasError = true; }
  if(email && !isValidEmail(email)){ setFieldError('email','Adresse courriel invalide.'); hasError = true; }
  if(address.length === 0){ setFieldError('address','Adresse de livraison requise.'); hasError = true; }

  if(hasError){ orderFeedback.classList.add('error'); orderFeedback.textContent = 'Veuillez corriger les erreurs indiquées.'; return; }

  const items = Object.values(CART);
  if(items.length === 0){ orderFeedback.classList.add('error'); orderFeedback.textContent = 'Panier vide.'; return; }

  const itemsHtml = items.map(it => `<tr>
    <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(it.name)}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.qty}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(it.price)}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(it.price * it.qty)}</td>
  </tr>`).join('');

  itemsHtmlField.value = itemsHtml;
  totalField.value = formatCurrency(cartAmount());
  createdAtField.value = new Date().toISOString();

  const serviceID = 'service_zuxbk1u';
  const templateID = 'template_694b5mh';
  const PUBLIC_KEY = 'Q7rxLkalpH60S-9BU';

  const loader = showLoading('Envoi de la commande');
  orderFeedback.textContent = 'Envoi en cours...';

  try {
    if(window.emailjs && typeof emailjs.sendForm === 'function'){
      await emailjs.sendForm(serviceID, templateID, orderForm, PUBLIC_KEY);
      loader.close();
      const successMessage = `<div style="text-align:center;">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Merci de votre commande</div>
        <div style="margin-bottom:10px;">Les Délices de Dora vous contactera dès que possible pour confirmer votre demande.</div>
      </div>`;
      showAlert(successMessage);
      CART = {}; persist(CART_KEY, CART); updateCartUI(); orderForm.reset(); setTimeout(()=>{ closeOrderModal(); }, 900);
      return;
    }
  } catch (sdkErr) {
    loader.close();
    console.warn('EmailJS SDK sendForm échoué', sdkErr);
  }

  // Fallback REST
  try {
    const templateParams = {
      full_name: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      address: document.getElementById('address').value.trim(),
      notes: document.getElementById('notes').value.trim() || '',
      total: totalField.value,
      items_html: itemsHtmlField.value,
      created_at: createdAtField.value
    };

    const payload = {
      service_id: serviceID,
      template_id: templateID,
      user_id: PUBLIC_KEY,
      template_params: templateParams
    };

    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    loader.close();

    if (resp.ok) {
      const successMessage = `<div style="text-align:center;">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Merci de votre commande</div>
        <div style="margin-bottom:10px;">Les Délices de Dora vous contactera sous peu pour confirmer votre demande.</div>
      </div>`;
      showAlert(successMessage);
      CART = {}; persist(CART_KEY, CART); updateCartUI(); orderForm.reset(); setTimeout(()=>{ closeOrderModal(); }, 900);
      return;
    } else {
      orderFeedback.classList.add('error');
      orderFeedback.textContent = 'Erreur serveur EmailJS (' + resp.status + '). Voir console pour détails.';
      showAlert(`<div style="text-align:center"><div style="font-weight:700;color:#ef4444">Échec d'envoi</div><div style="margin-top:8px">Impossible d'envoyer la commande pour le moment. Veuillez réessayer.</div></div>`);
      return;
    }
  } catch (fetchErr) {
    loader.close();
    orderFeedback.classList.add('error');
    orderFeedback.textContent = 'Échec d’envoi (SDK et REST). Vérifiez la console réseau et Allowed Origins dans EmailJS.';
    showAlert(`<div style="text-align:center"><div style="font-weight:700;color:#ef4444">Échec d'envoi</div><div style="margin-top:8px">Impossible d'envoyer la commande pour le moment. Vérifiez votre connexion et réessayez.</div></div>`);
    return;
  }
});

/* Utilitaires */
function showTimedAlert(message, duration = 2500){ showAlert(message); setTimeout(()=>{ const o = document.querySelector('.dynamic-overlay'); if(o) o.remove(); }, duration); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/* Raccourci clavier : fermer modals */
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ closeCart(); closeOrderModal(); closeAllWindowsAndModals(); } });

/* Spinner keyframes (injecté une seule fois) */
(function addSpinnerKeyframes(){
  const style = document.createElement('style');
  style.textContent = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
})();

/* Couleur du texte du hero adaptative (meilleur effort, ignore erreurs CORS) */
(function adaptHeroTextColor(){
  try {
    const hero = document.getElementById('heroBlock');
    const bg = getComputedStyle(hero, '::before').backgroundImage || getComputedStyle(hero).backgroundImage;
    const urlMatch = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    if(!urlMatch) return;
    const imgUrl = urlMatch[1];
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgUrl;
    const onSample = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = Math.min(200, img.naturalWidth || 200);
        const h = Math.min(100, img.naturalHeight || 100);
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.naturalWidth-w)/2, (img.naturalHeight-h)/2, w, h, 0, 0, w, h);
        const data = ctx.getImageData(Math.floor(w/2), Math.floor(h/2), 1, 1).data;
        const r = data[0], g = data[1], b = data[2];
        const luminance = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
        if(luminance < 0.45){
          document.documentElement.style.setProperty('--hero-foreground', '#ffffff');
        } else {
          document.documentElement.style.setProperty('--hero-foreground', '#012438');
        }
      } catch(e){ /* fallback silencieux */ }
    };
    if(img.complete) onSample(); else { img.onload = onSample; img.onerror = ()=>{}; }
  } catch(e){ /* silent */ }
})();

/* Assurer suggestions positionnées au-dessus (move node to body and reposition) */
(function ensureSuggestionsOnTop(){
  const suggestions = document.getElementById('suggestions');
  const search = document.querySelector('.search');
  if(!suggestions || !search) return;
  const placeholder = document.createElement('div');
  placeholder.style.display = 'none';
  suggestions.parentNode.insertBefore(placeholder, suggestions);
  document.body.appendChild(suggestions);
  function positionSuggestions(){
    const rect = search.getBoundingClientRect();
    suggestions.style.left = rect.left + 'px';
    suggestions.style.width = rect.width + 'px';
    suggestions.style.top = (rect.bottom + 8) + 'px';
  }
  window.addEventListener('resize', positionSuggestions);
  window.addEventListener('scroll', positionSuggestions, {passive:true});
  const observer = new MutationObserver(positionSuggestions);
  observer.observe(suggestions, {attributes:true, attributeFilter:['class']});
  search.addEventListener('input', positionSuggestions);
  positionSuggestions();
})();


  (function syncHeaderSpacing(){
    const header = document.querySelector('header.appbar');
    if(!header) return;
    function update(){
      const h = Math.ceil(header.getBoundingClientRect().height) || 72;
      document.documentElement.style.setProperty('--header-height', h + 'px');
      document.body.style.paddingTop = h + 'px';
    }
    update();
    new ResizeObserver(update).observe(header);
    window.addEventListener('load', update);
    window.addEventListener('resize', update);
  })();

