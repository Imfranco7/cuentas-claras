/* =========================================================
   Cuentas Claras — finanzas personales offline
   Datos 100% locales (IndexedDB). Sin servidores, sin cuentas.
   ========================================================= */
'use strict';

/* ---------------- utilidades ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WDS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ds(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ds(d); };
const pdate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const curMonth = () => today().slice(0, 7);
const dim = (y, m) => new Date(y, m + 1, 0).getDate();
const addMonth = (mk, n) => { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const monthLabel = mk => { const [y, m] = mk.split('-').map(Number); return cap(MONTHS[m - 1]) + ' ' + y; };
const monthName = mk => MONTHS[Number(mk.slice(5, 7)) - 1];
const dayLabel = s => {
  if (s === today()) return 'Hoy';
  if (s === yesterday()) return 'Ayer';
  const d = pdate(s);
  return `${cap(WDS[d.getDay()])} ${d.getDate()} ${MON[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}`;
};
const longDate = s => { const d = pdate(s); return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`; };
const shortDate = s => { const d = pdate(s); return `${d.getDate()} ${MON[d.getMonth()]}`; };

// Formato de pesos colombianos: $ 1.250.000 (sin decimales)
const group = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const money = (n, sign) => { n = Math.round(n || 0); const s = '$ ' + group(n); return n < 0 ? '−' + s : (sign && n > 0 ? '+' + s : s); };
const compact = n => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',').replace(',0', '') + ' M';
  if (a >= 1e3) return Math.round(n / 1e3) + ' mil';
  return String(Math.round(n));
};
const parseMoney = s => Number(String(s || '').replace(/\D/g, '')) || 0;

/* ---------------- íconos ---------------- */
const I = {
  home: '<path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  left: '<path d="M14.5 6l-6 6 6 6"/>',
  right: '<path d="M9.5 6l6 6-6 6"/>',
  chev: '<path d="M9.5 6l6 6-6 6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  repeat: '<path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"/>',
  del: '<path d="M9 6h11v12H9l-6-6z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
  down: '<path d="M17 7 7 17M7 9v8h8"/>',
  up: '<path d="M7 17 17 7M9 7h8v8"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><circle cx="16" cy="13.5" r="1"/>',
  tag: '<path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  upload: '<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  file: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z"/><path d="M14 3.5v5h5M9 13h6M9 16.5h6"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  spark: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 16.8v.2"/>',
  transfer: '<path d="M4 8.5h15l-3.5-3.5M20 15.5H5L8.5 19"/>',
  piggy: '<path d="M5 11a6 5 0 0 1 11-2.6L19 7v4l1.5 1v3H18l-1.5 3H14v-1.5h-3V18H8.5L7 15a5 5 0 0 1-2-4z"/><circle cx="15" cy="11" r=".8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#0d150b"/><circle cx="32" cy="32" r="16" fill="none" stroke="#243520" stroke-width="7"/><path d="M32 16a16 16 0 1 1-15.2 21" fill="none" stroke="#a3f04a" stroke-width="7" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="#a3f04a"/></svg>`;

const PALETTE = ['#a3f04a', '#6ee592', '#3fd0c9', '#4ec9ff', '#6aa8ff', '#9b8cff', '#c48bff', '#ff7eb6', '#ff6b6b', '#ff8a3d', '#ffb547', '#f5c84b', '#8b9687'];

/* ---------------- base de datos local (IndexedDB) ---------------- */
const STORES = ['accounts', 'categories', 'txs', 'goals', 'recurring', 'meta'];
const DB = {
  db: null, mem: false,
  async open() {
    if (!('indexedDB' in window)) { this.mem = true; return; }
    try {
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open('cuentas-claras', 1);
        r.onupgradeneeded = () => { const d = r.result; STORES.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('blocked'));
      });
    } catch (e) { console.warn('IndexedDB no disponible', e); this.mem = true; }
  },
  run(store, mode, fn) {
    if (this.mem) return Promise.resolve(null);
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => res(r && r.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  },
  all(s) { return this.run(s, 'readonly', st => st.getAll()).then(r => r || []); },
  put(s, o) { return this.run(s, 'readwrite', st => st.put(o)).catch(e => { console.error(e); toast('No se pudo guardar'); }); },
  del(s, id) { return this.run(s, 'readwrite', st => st.delete(id)).catch(console.error); },
  clear(s) { return this.run(s, 'readwrite', st => st.clear()); },
  bulk(s, arr) { return this.run(s, 'readwrite', st => { arr.forEach(o => st.put(o)); return null; }); },
};

/* ---------------- estado ---------------- */
const DEFAULT_SETTINGS = { id: 'settings', name: '', theme: 'auto', hormiga: 15000, payday: null, pinHash: null, onboarded: false, lastBackup: null };
const S = { accounts: [], categories: [], txs: [], goals: [], recurring: [], settings: { ...DEFAULT_SETTINGS } };
const UI = { tab: 'home', sub: null, anMonth: curMonth(), mvMonth: curMonth(), mvFilter: 'all', mvCat: null, mvQuery: '', catKind: 'expense' };

function seedAccounts() {
  return [
    { id: 'a_cash', name: 'Efectivo', type: 'cash', icon: '💵', color: '#a3f04a', initial: 0, order: 0 },
    { id: 'a_nequi', name: 'Nequi', type: 'digital', icon: '📱', color: '#c48bff', initial: 0, order: 1 },
    { id: 'a_debit', name: 'Tarjeta débito', type: 'debit', icon: '🏦', color: '#4ec9ff', initial: 0, order: 2 },
    { id: 'a_credit', name: 'Tarjeta crédito', type: 'credit', icon: '💳', color: '#ffb547', initial: 0, limit: 0, order: 3 },
  ];
}
function seedCategories() {
  const e = [
    ['mercado', 'Mercado', '🛒', '#a3f04a'],
    ['comida', 'Restaurantes y domicilios', '🍔', '#ff8a3d'],
    ['hormiga', 'Gastos hormiga', '🐜', '#f5c84b'],
    ['transporte', 'Transporte', '🚌', '#4ec9ff'],
    ['vivienda', 'Vivienda', '🏠', '#9b8cff'],
    ['servicios', 'Servicios y celular', '💡', '#3fd0c9'],
    ['cuidado', 'Cuidado personal', '🧴', '#ff7eb6'],
    ['salud', 'Salud', '💊', '#ff6b6b'],
    ['deporte', 'Gimnasio y deporte', '🏋️', '#6ee592'],
    ['ropa', 'Ropa y accesorios', '👕', '#c48bff'],
    ['ocio', 'Salidas y diversión', '🎉', '#ffb547'],
    ['suscripciones', 'Suscripciones', '📺', '#6aa8ff'],
    ['educacion', 'Educación', '📚', '#6ee592'],
    ['regalos', 'Regalos', '🎁', '#ff7eb6'],
    ['bancos', 'Intereses y comisiones', '🧾', '#8b9687'],
    ['otros', 'Otros gastos', '📦', '#8b9687'],
  ].map(([id, name, icon, color], i) => ({ id: 'c_' + id, kind: 'expense', name, icon, color, budget: 0, order: i }));
  const inc = [
    ['salario', 'Salario', '💼', '#6ee592'],
    ['extras', 'Extras y bonos', '💸', '#a3f04a'],
    ['ventas', 'Ventas', '🏷️', '#4ec9ff'],
    ['otrosing', 'Otros ingresos', '➕', '#8b9687'],
  ].map(([id, name, icon, color], i) => ({ id: 'c_' + id, kind: 'income', name, icon, color, budget: 0, order: i }));
  return [...e, ...inc];
}

async function load() {
  await DB.open();
  const [a, c, t, g, r, m] = await Promise.all(STORES.map(s => DB.all(s)));
  S.accounts = a; S.categories = c; S.txs = t; S.goals = g; S.recurring = r;
  S.settings = { ...DEFAULT_SETTINGS, ...(m.find(x => x.id === 'settings') || {}) };
  if (!S.categories.length) { S.categories = seedCategories(); await DB.bulk('categories', S.categories); }
  if (!S.accounts.length) { S.accounts = seedAccounts(); await DB.bulk('accounts', S.accounts); }
}
const saveSettings = () => DB.put('meta', S.settings);

/* ---------------- consultas y cálculos ---------------- */
const accBy = id => S.accounts.find(a => a.id === id);
const catBy = id => S.categories.find(c => c.id === id);
const goalBy = id => S.goals.find(g => g.id === id);
const accName = id => accBy(id)?.name || 'Cuenta';
const activeAccounts = () => S.accounts.filter(a => !a.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const sortTx = list => [...list].sort((a, b) => (b.date.localeCompare(a.date)) || ((b.createdAt || 0) - (a.createdAt || 0)));

function accBalance(acc) {
  let b = acc.initial || 0;
  for (const t of S.txs) {
    if (t.accountId === acc.id) {
      if (t.type === 'income' || t.type === 'goal_out') b += t.amount;
      else b -= t.amount; // gasto, transferencia saliente, abono a meta
    }
    if (t.type === 'transfer' && t.toAccountId === acc.id) b += t.amount;
  }
  return b;
}
const available = () => activeAccounts().filter(a => a.type !== 'credit').reduce((s, a) => s + accBalance(a), 0);
const creditDebt = () => activeAccounts().filter(a => a.type === 'credit').reduce((s, a) => s + Math.max(0, -accBalance(a)), 0);
const goalSaved = id => S.txs.reduce((s, t) => t.goalId === id ? s + (t.type === 'goal_in' ? t.amount : t.type === 'goal_out' ? -t.amount : 0) : s, 0);
const goalsTotal = () => S.goals.reduce((s, g) => s + goalSaved(g.id), 0);

function monthTotals(mk) {
  let inc = 0, exp = 0;
  for (const t of S.txs) {
    if (!t.date.startsWith(mk)) continue;
    if (t.type === 'income') inc += t.amount;
    else if (t.type === 'expense') exp += t.amount;
  }
  return { inc, exp };
}
function expenseByCat(mk) {
  const m = new Map();
  for (const t of S.txs) if (t.type === 'expense' && t.date.startsWith(mk)) m.set(t.categoryId, (m.get(t.categoryId) || 0) + t.amount);
  return [...m.entries()].map(([id, sum]) => {
    const c = catBy(id) || { id, name: 'Sin categoría', icon: '❔', color: '#8b9687', budget: 0 };
    return { ...c, sum };
  }).sort((a, b) => b.sum - a.sum);
}
function daysElapsed(mk) {
  const cm = curMonth();
  if (mk === cm) return new Date().getDate();
  if (mk < cm) { const [y, m] = mk.split('-').map(Number); return dim(y, m - 1); }
  return 0;
}
function catUsage(kind) {
  const since = ds(new Date(Date.now() - 90 * 864e5)), m = {};
  for (const t of S.txs) if (t.categoryId && t.date >= since) m[t.categoryId] = (m[t.categoryId] || 0) + 1;
  return m;
}
function sortedCats(kind) {
  const u = catUsage(kind);
  return S.categories.filter(c => c.kind === kind && !c.archived)
    .sort((a, b) => ((u[b.id] || 0) - (u[a.id] || 0)) || ((a.order ?? 0) - (b.order ?? 0)));
}
function defaultAccount(noCredit) {
  const last = sortTx(S.txs).find(t => (t.type === 'expense' || t.type === 'income') && accBy(t.accountId) && !accBy(t.accountId).archived && (!noCredit || accBy(t.accountId).type !== 'credit'));
  return last ? last.accountId : (activeAccounts().find(a => a.type !== 'credit') || activeAccounts()[0])?.id;
}

// ¿Cuánto puedo gastar por día hasta el próximo pago (o fin de mes)?
function allowance() {
  const now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pd = S.settings.payday;
  let target, label;
  if (pd) {
    target = new Date(now.getFullYear(), now.getMonth(), Math.min(pd, dim(now.getFullYear(), now.getMonth())));
    if (target <= t0) { const nm = new Date(now.getFullYear(), now.getMonth() + 1, 1); target = new Date(nm.getFullYear(), nm.getMonth(), Math.min(pd, dim(nm.getFullYear(), nm.getMonth()))); }
    label = 'hasta tu pago';
  } else {
    target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    label = 'hasta fin de mes';
  }
  const days = Math.max(1, Math.round((target - t0) / 864e5));
  const mk = curMonth(), d = now.getDate(), tStr = ds(target);
  const pending = S.recurring.filter(r => r.active && r.type === 'expense' && r.lastMonth < mk && r.day >= d && `${mk}-${pad(Math.min(r.day, dim(now.getFullYear(), now.getMonth())))}` < tStr)
    .reduce((s, r) => s + r.amount, 0);
  const debt = creditDebt(), disp = available();
  const perDay = Math.max(0, disp - debt - pending) / days;
  const parts = [];
  if (debt > 0) parts.push(`deuda de tarjeta (${money(debt)})`);
  if (pending > 0) parts.push(`pagos fijos pendientes (${money(pending)})`);
  return { perDay, days, label, note: parts.length ? 'Ya descuenta ' + parts.join(' y ') + '.' : 'Calculado con tu saldo disponible.' };
}
function budgetAlerts(mk) {
  return expenseByCat(mk).filter(c => c.budget > 0 && c.sum / c.budget >= 0.8).slice(0, 3);
}

/* ---------------- movimientos recurrentes ---------------- */
async function runRecurring() {
  const now = new Date(), mk = curMonth(), dmax = dim(now.getFullYear(), now.getMonth());
  let n = 0;
  for (const r of S.recurring) {
    if (!r.active || (r.lastMonth && r.lastMonth >= mk)) continue;
    const day = Math.min(r.day, dmax);
    if (now.getDate() < day) continue;
    const tx = { id: uid(), type: r.type, amount: r.amount, accountId: r.accountId, categoryId: r.categoryId, date: `${mk}-${pad(day)}`, note: r.note || '', recurringId: r.id, createdAt: Date.now() };
    S.txs.push(tx); await DB.put('txs', tx);
    r.lastMonth = mk; await DB.put('recurring', r);
    n++;
  }
  if (n) toast(n === 1 ? 'Se registró 1 pago fijo del mes' : `Se registraron ${n} pagos fijos del mes`);
  return n;
}

/* ---------------- piezas de interfaz ---------------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2400);
}
function armed(el, label = 'Toca otra vez para confirmar') {
  if (el.dataset.armed === '1') return true;
  const old = el.innerHTML; el.dataset.armed = '1'; el.innerHTML = label; el.classList.add('armed');
  setTimeout(() => { if (el.isConnected) { el.dataset.armed = ''; el.innerHTML = old; el.classList.remove('armed'); } }, 3200);
  return false;
}
const empty = (title, text, extra = '', icon = '🌱') => `<div class="empty"><div class="e-ic">${icon}</div><b>${title}</b><p>${text}</p>${extra}</div>`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
const subHeader = (title, right = '') => `<header class="top sub"><button class="icon-btn" data-act="back" aria-label="Volver">${ic('back')}</button><h1>${title}</h1>${right || '<span style="width:42px"></span>'}</header>`;
const monthSwitch = key => `<div class="month-switch"><button class="icon-btn sm" data-act="month" data-k="${key}" data-d="-1" aria-label="Mes anterior">${ic('left')}</button><span>${monthLabel(UI[key])}</span><button class="icon-btn sm" data-act="month" data-k="${key}" data-d="1" aria-label="Mes siguiente" ${UI[key] >= curMonth() ? 'disabled' : ''}>${ic('right')}</button></div>`;

function txRow(t) {
  let icon, color, title, sub, amt, cls = t.type;
  if (t.type === 'transfer') {
    const to = accBy(t.toAccountId);
    icon = ic('transfer'); color = '#8b9687';
    title = to?.type === 'credit' ? 'Pago de tarjeta' : 'Transferencia';
    sub = `${accName(t.accountId)} → ${accName(t.toAccountId)}`; amt = money(t.amount); cls = 'neutral';
  } else if (t.type === 'goal_in' || t.type === 'goal_out') {
    const g = goalBy(t.goalId);
    icon = g?.icon || '🎯'; color = g?.color || '#a3f04a';
    title = (t.type === 'goal_in' ? 'Ahorro · ' : 'Retiro · ') + (g?.name || 'Meta');
    sub = (t.type === 'goal_in' ? 'Desde ' : 'Hacia ') + accName(t.accountId);
    amt = (t.type === 'goal_in' ? '→ ' : '← ') + money(t.amount); cls = 'neutral';
  } else {
    const c = catBy(t.categoryId) || { name: 'Sin categoría', icon: '❔', color: '#8b9687' };
    icon = c.icon; color = c.color;
    title = t.note || c.name;
    sub = t.note ? `${c.name} · ${accName(t.accountId)}` : accName(t.accountId);
    amt = t.type === 'income' ? '+' + money(t.amount) : '−' + money(t.amount);
  }
  return `<button class="tx" data-act="editTx" data-id="${t.id}"><span class="ci" style="--c:${color}">${icon}</span><span class="tx-main"><span class="tx-title">${esc(title)}</span><span class="tx-sub">${t.recurringId ? ic('repeat') : ''}${esc(sub)}</span></span><span class="tx-amt ${cls} num">${amt}</span></button>`;
}
function grouped(list) {
  const groups = [];
  let cur = null;
  for (const t of sortTx(list)) {
    if (!cur || cur.date !== t.date) { cur = { date: t.date, items: [] }; groups.push(cur); }
    cur.items.push(t);
  }
  return groups.map(g => {
    const out = g.items.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    return `<div class="day-head"><span>${dayLabel(g.date)}</span>${out ? `<span class="num">−${money(out)}</span>` : ''}</div><div class="card flush">${g.items.map(txRow).join('')}</div>`;
  }).join('');
}
function accCard(a) {
  const bal = accBalance(a);
  if (a.type === 'credit') {
    const debt = Math.max(0, -bal);
    return `<button class="acc" data-act="editAcc" data-id="${a.id}"><span class="ci sm" style="--c:${a.color}">${a.icon}</span><span class="acc-name">${esc(a.name)}</span><span class="acc-bal num">${debt > 0 ? money(debt) : money(0)}</span><span class="acc-sub">${debt > 0 ? 'Deuda' : 'Sin deuda'}${a.limit ? ' · libre ' + compact(Math.max(0, a.limit - debt)) : ''}</span></button>`;
  }
  return `<button class="acc" data-act="editAcc" data-id="${a.id}"><span class="ci sm" style="--c:${a.color}">${a.icon}</span><span class="acc-name">${esc(a.name)}</span><span class="acc-bal num ${bal < 0 ? 'neg' : ''}">${money(bal)}</span></button>`;
}

/* ================= VISTAS ================= */
const VIEWS = {
  home() {
    const mk = curMonth(), { inc, exp } = monthTotals(mk);
    const disp = available(), debt = creditDebt(), metas = goalsTotal(), al = allowance();
    const recent = sortTx(S.txs).slice(0, 6), alerts = budgetAlerts(mk);
    const needBackup = S.txs.length >= 15 && (!S.settings.lastBackup || Date.now() - S.settings.lastBackup > 14 * 864e5);
    return `
<header class="top"><div><div class="hello">${greeting()}</div><div class="hello-name">${esc(S.settings.name || 'Bienvenido')}</div></div>
<button class="icon-btn" data-act="go" data-sub="moves" aria-label="Buscar movimientos">${ic('search')}</button></header>
<section class="hero">
  <div class="hero-label">Saldo disponible</div>
  <div class="hero-big num">${money(disp)}</div>
  <div class="hero-chips">
    <span class="hchip">${ic('target')} En metas <b class="num">${money(metas)}</b></span>
    ${debt > 0 ? `<span class="hchip">${ic('card')} Deuda TC <b class="num">${money(debt)}</b></span>` : ''}
  </div>
</section>
<div class="grid2">
  <button class="stat stat-accent" data-act="goAnalysis"><span class="stat-ic">${ic('down')}</span><span class="stat-label">Ingresos de ${monthName(mk)}</span><span class="stat-val num">${money(inc)}</span></button>
  <button class="stat" data-act="goAnalysis"><span class="stat-ic">${ic('up')}</span><span class="stat-label">Gastos de ${monthName(mk)}</span><span class="stat-val num">${money(exp)}</span></button>
</div>
<div class="card">
  <div class="allow-top"><span class="muted">Puedes gastar al día</span><span class="pill">${al.days} ${al.days === 1 ? 'día' : 'días'} ${al.label}</span></div>
  <div class="allow-val num">${money(al.perDay)}</div>
  <div class="muted small">${al.note}</div>
</div>
${alerts.length ? `<div class="card"><div class="card-head"><h3>Presupuestos al límite</h3>${ic('alert', 'warn')}</div>${alerts.map(c => {
      const p = c.sum / c.budget * 100;
      return `<button class="alert-row" style="width:100%" data-act="catMoves" data-id="${c.id}" data-m="${mk}"><span class="ci sm" style="--c:${c.color}">${c.icon}</span><span class="alert-main"><span class="alert-top"><span>${esc(c.name)}</span><span class="num ${p >= 100 ? 'neg' : 'warn'}">${Math.round(p)}%</span></span><span class="bar"><span style="width:${Math.min(100, p)}%;background:${p >= 100 ? 'var(--expense)' : 'var(--warn)'}"></span></span></span></button>`;
    }).join('')}</div>` : ''}
${needBackup ? `<div class="card notice"><span class="ci sm" style="--c:#4ec9ff">${ic('download')}</span><div style="flex:1"><b>Haz una copia de seguridad</b><p>Tus datos solo viven en este celular.</p></div><button class="btn soft" data-act="exportBackup">Copiar</button></div>` : ''}
<div class="sec-head"><h2>Cuentas</h2><button class="link" data-act="go" data-sub="accounts">Gestionar</button></div>
<div class="acc-scroll">${activeAccounts().map(accCard).join('')}</div>
<div class="sec-head"><h2>Movimientos recientes</h2>${recent.length ? `<button class="link" data-act="go" data-sub="moves">Ver todo</button>` : ''}</div>
<div class="card flush">${recent.length ? recent.map(txRow).join('') : empty('Aún no hay movimientos', 'Toca el botón + para registrar tu primer gasto o ingreso.', '', '✨')}</div>`;
  },

  analysis() {
    const mk = UI.anMonth, { inc, exp } = monthTotals(mk), bal = inc - exp;
    const byCat = expenseByCat(mk), days = daysElapsed(mk) || 1;
    const prevMk = addMonth(mk, -1), prev = monthTotals(prevMk).exp;
    const exps = S.txs.filter(t => t.type === 'expense' && t.date.startsWith(mk));
    const biggest = exps.reduce((m, t) => (!m || t.amount > m.amount ? t : m), null);
    // día de la semana con más gasto (últimos 90 días)
    const since = ds(new Date(Date.now() - 90 * 864e5)), wd = Array(7).fill(0);
    S.txs.forEach(t => { if (t.type === 'expense' && t.date >= since) wd[pdate(t.date).getDay()] += t.amount; });
    const topWd = wd.some(v => v > 0) ? wd.indexOf(Math.max(...wd)) : -1;
    const maxCat = byCat[0]?.sum || 1;
    let rateHtml = '';
    if (inc > 0) {
      const r = Math.round(bal / inc * 100), rr = Math.max(0, Math.min(100, r)), C = 2 * Math.PI * 18;
      rateHtml = `<div class="card rate"><svg class="rate-ring" viewBox="0 0 46 46"><circle cx="23" cy="23" r="18" fill="none" stroke="var(--surface-3)" stroke-width="6"/><circle cx="23" cy="23" r="18" fill="none" stroke="${r >= 0 ? 'var(--accent)' : 'var(--expense)'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C * rr / 100} ${C}" transform="rotate(-90 23 23)"/></svg>
      <p>${r >= 0 ? `Te quedó el <b>${r}%</b> de lo que ganaste en ${monthName(mk)}.${r >= 20 ? ' ¡Muy bien!' : r < 10 ? ' Intenta guardar al menos un 10%.' : ''}` : `Gastaste <b>${money(-bal)}</b> más de lo que ingresó este mes.`}</p></div>`;
    }
    return `
<header class="top"><h1>Análisis</h1></header>
${monthSwitch('anMonth')}
<div class="card summary">
  <div><span class="muted small">Ingresos</span><b class="num inc">${money(inc)}</b></div>
  <div><span class="muted small">Gastos</span><b class="num">${money(exp)}</b></div>
  <div><span class="muted small">Balance</span><b class="num ${bal < 0 ? 'neg' : ''}">${money(bal, true)}</b></div>
</div>
${rateHtml}
<div class="card">
  <div class="card-head"><h3>¿En qué se va tu plata?</h3></div>
  ${exp ? donut(byCat, exp) + `<div class="legend">${byCat.map(c => {
      const pct = Math.round(c.sum / exp * 100);
      const over = c.budget ? c.sum / c.budget : 0;
      const w = c.budget ? Math.min(100, over * 100) : c.sum / maxCat * 100;
      const color = c.budget ? (over >= 1 ? 'var(--expense)' : over >= .8 ? 'var(--warn)' : c.color) : c.color;
      return `<button class="lg-row" data-act="catMoves" data-id="${c.id}" data-m="${mk}"><span class="ci sm" style="--c:${c.color}">${c.icon}</span><span class="lg-main"><span class="lg-top"><span>${esc(c.name)}</span><b class="num">${money(c.sum)}</b></span><span class="bar"><span style="width:${w}%;background:${color}"></span></span><span class="lg-sub">${pct}% del gasto${c.budget ? ` · ${Math.round(over * 100)}% de tu presupuesto de ${money(c.budget)}` : ''}</span></span></button>`;
    }).join('')}</div>` : empty('Sin gastos este mes', 'Cuando registres gastos verás aquí en qué categorías se va tu dinero.', '', '📊')}
</div>
${hormigaCard(mk)}
<div class="card">
  <h3>Últimos 6 meses</h3>
  ${trendChart(mk)}
  <div class="legend-inline"><span><i class="dot inc"></i>Ingresos</span><span><i class="dot exp"></i>Gastos</span></div>
</div>
<div class="grid2">
  <div class="mini"><span>Promedio diario</span><b class="num">${money(exp / days)}</b><em>en ${days} ${days === 1 ? 'día' : 'días'}</em></div>
  <div class="mini"><span>vs ${monthName(prevMk)}</span>${prev > 0 ? (() => { const p = Math.round((exp - prev) / prev * 100); return `<b class="num ${p > 0 ? 'neg' : 'inc'}">${p > 0 ? '↑' : '↓'} ${Math.abs(p)}%</b><em>${p > 0 ? 'más gasto' : 'menos gasto'}${mk === curMonth() ? ' (mes en curso)' : ''}</em>`; })() : `<b>—</b><em>sin datos previos</em>`}</div>
  <div class="mini"><span>Gasto más grande</span>${biggest ? `<b class="num">${money(biggest.amount)}</b><em>${esc(biggest.note || catBy(biggest.categoryId)?.name || '')}</em>` : '<b>—</b><em>sin gastos</em>'}</div>
  <div class="mini"><span>Día que más gastas</span>${topWd >= 0 ? `<b>${cap(WD[topWd])}</b><em>últimos 3 meses</em>` : '<b>—</b><em>sin datos</em>'}</div>
</div>`;
  },

  goals() {
    const gs = S.goals.filter(g => !g.archived).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return `
<header class="top"><h1>Metas</h1><button class="icon-btn" data-act="newGoal" aria-label="Nueva meta">${ic('plus')}</button></header>
<section class="hero">
  <div class="hero-label">Total ahorrado</div>
  <div class="hero-big num">${money(goalsTotal())}</div>
  <div class="hero-chips"><span class="hchip">${ic('target')} ${gs.length} ${gs.length === 1 ? 'meta activa' : 'metas activas'}</span></div>
</section>
${gs.length ? gs.map(goalCard).join('') : `<div class="card">${empty('Crea tu primera meta', 'Separa dinero para un viaje, un computador, una moto o tu fondo de emergencias.', '<button class="btn primary" data-act="newGoal">' + ic('plus') + ' Crear meta</button>', '🎯')}</div>`}`;
  },

  more() {
    const s = S.settings, nr = S.recurring.filter(r => r.active).length;
    const lb = s.lastBackup ? (() => { const d = Math.floor((Date.now() - s.lastBackup) / 864e5); return d === 0 ? 'Última: hoy' : `Última: hace ${d} ${d === 1 ? 'día' : 'días'}`; })() : 'Nunca has hecho una copia';
    const navRow = (sub, icon, title, val) => `<button class="row" data-act="go" data-sub="${sub}"><span class="row-ic">${ic(icon)}</span><span class="row-main">${title}</span><span class="row-val">${val}</span>${ic('chev', 'chev')}</button>`;
    return `
<header class="top"><h1>Ajustes</h1></header>
<div class="group-label">Perfil</div>
<div class="card flush">
  <label class="row"><span class="row-ic">${ic('user')}</span><span class="row-main">Tu nombre</span><input class="row-input" data-set="name" value="${esc(s.name)}" placeholder="Escribe tu nombre" maxlength="24"></label>
  <label class="row"><span class="row-ic">${ic('cal')}</span><span class="row-main">Día de pago<span class="row-sub">Para calcular cuánto gastar al día</span></span>
    <select class="row-select" data-set="payday"><option value="">Fin de mes</option>${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${s.payday === i + 1 ? 'selected' : ''}>Día ${i + 1}</option>`).join('')}</select></label>
</div>
<div class="group-label">Apariencia</div>
<div class="seg mt">${[['auto', 'Automático'], ['dark', 'Oscuro'], ['light', 'Claro']].map(([k, l]) => `<button class="${s.theme === k ? 'on' : ''}" data-act="theme" data-v="${k}">${l}</button>`).join('')}</div>
<div class="group-label">Organización</div>
<div class="card flush">
  ${navRow('accounts', 'wallet', 'Cuentas', activeAccounts().length)}
  ${navRow('categories', 'tag', 'Categorías y presupuestos', S.categories.filter(c => !c.archived).length)}
  ${navRow('recurring', 'repeat', 'Pagos fijos mensuales', nr ? nr + ' activos' : 'Ninguno')}
  <label class="row"><span class="row-ic">🐜</span><span class="row-main">Gasto hormiga<span class="row-sub">Compras de este valor o menos</span></span><span class="money-wrap sm">$<input class="money-in" inputmode="numeric" data-set="hormiga" value="${group(s.hormiga)}"></span></label>
</div>
<div class="group-label">Seguridad y respaldo</div>
<div class="card flush">
  <button class="row" data-act="togglePin"><span class="row-ic">${ic('lock')}</span><span class="row-main">Bloqueo con PIN<span class="row-sub">${s.pinHash ? 'Se pide al abrir la app' : 'Desactivado'}</span></span><span class="switch ${s.pinHash ? 'on' : ''}"></span></button>
  <button class="row" data-act="exportBackup"><span class="row-ic">${ic('download')}</span><span class="row-main">Crear copia de seguridad<span class="row-sub">${lb}</span></span>${ic('chev', 'chev')}</button>
  <button class="row" data-act="importBackup"><span class="row-ic">${ic('upload')}</span><span class="row-main">Restaurar copia<span class="row-sub">Reemplaza los datos actuales</span></span>${ic('chev', 'chev')}</button>
  <button class="row" data-act="exportCSV"><span class="row-ic">${ic('file')}</span><span class="row-main">Exportar a Excel (CSV)<span class="row-sub">Todos tus movimientos</span></span>${ic('chev', 'chev')}</button>
</div>
<div class="group-label">Zona de cuidado</div>
<div class="card flush"><button class="row danger" data-act="resetAll"><span class="row-ic">${ic('trash')}</span><span class="row-main">Borrar todos los datos</span></button></div>
<p class="foot muted small">Cuentas Claras 1.0 · Tus datos viven solo en este dispositivo${DB.mem ? '<br><b>Modo vista previa: los datos no se guardan</b>' : ''}</p>`;
  },

  moves() {
    const f = [['all', 'Todos'], ['expense', 'Gastos'], ['income', 'Ingresos'], ['transfer', 'Transferencias'], ['goals', 'Metas']];
    const c = UI.mvCat && catBy(UI.mvCat);
    return `${subHeader('Movimientos')}
${monthSwitch('mvMonth')}
<div class="search">${ic('search')}<input id="mvSearch" type="search" placeholder="Buscar nota, categoría o cuenta" value="${esc(UI.mvQuery)}" autocomplete="off"></div>
<div class="filters">${c ? `<button class="chip on" data-act="clearCat">${c.icon} ${esc(c.name)} ${ic('x', 'x')}</button>` : ''}${f.map(([k, l]) => `<button class="chip ${UI.mvFilter === k && !c ? 'on' : ''}" data-act="mvFilter" data-v="${k}">${l}</button>`).join('')}</div>
<div id="mvList">${movesList()}</div>`;
  },

  accounts() {
    return `${subHeader('Cuentas', `<button class="icon-btn" data-act="editAcc" aria-label="Nueva cuenta">${ic('plus')}</button>`)}
<div class="card flush">${activeAccounts().map(a => {
      const b = accBalance(a), cr = a.type === 'credit';
      return `<button class="row" data-act="editAcc" data-id="${a.id}"><span class="ci sm" style="--c:${a.color}">${a.icon}</span><span class="row-main">${esc(a.name)}<span class="row-sub">${{ cash: 'Efectivo', digital: 'Billetera digital', debit: 'Cuenta / débito', credit: 'Tarjeta de crédito' }[a.type] || ''}${cr && a.limit ? ' · cupo ' + money(a.limit) : ''}</span></span><span class="row-val num ${!cr && b < 0 ? 'neg' : ''}">${cr ? (b < 0 ? 'Debes ' + money(-b) : 'Al día') : money(b)}</span>${ic('chev', 'chev')}</button>`;
    }).join('')}</div>
<p class="hint">Toca una cuenta para ajustar su saldo real. Para pagar la tarjeta de crédito usa <b>Transferir</b> desde Nequi o débito hacia la tarjeta.</p>`;
  },

  categories() {
    const k = UI.catKind, list = S.categories.filter(c => c.kind === k && !c.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const spent = k === 'expense' ? Object.fromEntries(expenseByCat(curMonth()).map(c => [c.id, c.sum])) : {};
    return `${subHeader('Categorías', `<button class="icon-btn" data-act="editCat" aria-label="Nueva categoría">${ic('plus')}</button>`)}
<div class="seg">${[['expense', 'Gastos'], ['income', 'Ingresos']].map(([v, l]) => `<button class="${k === v ? 'on' : ''}" data-act="catKind" data-v="${v}">${l}</button>`).join('')}</div>
<div class="card flush">${list.map(c => `<button class="row" data-act="editCat" data-id="${c.id}"><span class="ci sm" style="--c:${c.color}">${c.icon}</span><span class="row-main">${esc(c.name)}${k === 'expense' ? `<span class="row-sub">${c.budget ? `Presupuesto ${money(c.budget)} · llevas ${money(spent[c.id] || 0)}` : 'Sin presupuesto'}</span>` : ''}</span>${ic('chev', 'chev')}</button>`).join('')}</div>
${k === 'expense' ? '<p class="hint">Ponle un presupuesto mensual a las categorías que quieras controlar. Te avisaremos al llegar al 80%.</p>' : ''}`;
  },

  recurring() {
    const list = [...S.recurring].sort((a, b) => a.day - b.day);
    return `${subHeader('Pagos fijos')}
${list.length ? `<div class="card flush">${list.map(r => {
      const c = catBy(r.categoryId) || { icon: '❔', color: '#8b9687', name: '' };
      return `<button class="row" data-act="editRec" data-id="${r.id}" style="${r.active ? '' : 'opacity:.5'}"><span class="ci sm" style="--c:${c.color}">${c.icon}</span><span class="row-main">${esc(r.note || c.name)}<span class="row-sub">Día ${r.day} de cada mes · ${esc(accName(r.accountId))}${r.active ? '' : ' · pausado'}</span></span><span class="row-val num ${r.type === 'income' ? 'inc' : ''}">${r.type === 'income' ? '+' : '−'}${money(r.amount)}</span></button>`;
    }).join('')}</div>` : `<div class="card">${empty('Sin pagos fijos', 'Arriendo, plan de celular, gimnasio, suscripciones… regístralos una vez y la app los anotará sola cada mes.', '', '🔁')}</div>`}
<button class="btn soft block" style="margin-top:12px" data-act="newRec">${ic('plus')} Agregar pago fijo</button>
<p class="hint">Se registran automáticamente el día indicado cuando abres la app. También puedes marcar “Cada mes” al crear cualquier gasto o ingreso.</p>`;
  },

  onboard() {
    const plain = S.accounts.filter(a => a.type !== 'credit');
    return `<div class="onb">
<div class="onb-logo">${LOGO}</div>
<h1>Hola, empecemos<br>con tus cuentas</h1>
<p class="muted">Pon tus saldos de hoy. Todo se guarda solo en tu celular, sin internet.</p>
<div class="card">
  <label class="fl">¿Cómo te llamas?<input id="o-name" class="in" placeholder="Tu nombre" maxlength="24" autocomplete="given-name"></label>
  <div class="field-label" style="margin-top:20px">Saldos actuales</div>
  ${plain.map(a => `<label class="acc-in"><span class="ci sm" style="--c:${a.color}">${a.icon}</span><span class="lbl">${esc(a.name)}</span><span class="money-wrap">$<input class="money-in" inputmode="numeric" data-acc="${a.id}" placeholder="0"></span></label>`).join('')}
  <div class="field-label" style="margin-top:20px">Tarjeta de crédito</div>
  <label class="acc-in"><span class="ci sm" style="--c:#ffb547">💳</span><span class="lbl">Deuda actual</span><span class="money-wrap">$<input class="money-in" inputmode="numeric" id="o-debt" placeholder="0"></span></label>
  <label class="acc-in"><span class="ci sm" style="--c:#ffb547">📈</span><span class="lbl">Cupo total</span><span class="money-wrap">$<input class="money-in" inputmode="numeric" id="o-limit" placeholder="0"></span></label>
  <label class="fl" style="margin-top:20px">¿Qué día te pagan el sueldo?
    <select id="o-payday" class="in"><option value="">No es fijo / fin de mes</option>${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">Día ${i + 1}</option>`).join('')}</select></label>
</div>
<button class="btn primary block" style="margin-top:16px" data-act="finishOnboard">Empezar</button>
<p class="muted small center" style="margin-top:12px">Puedes cambiar todo esto luego en Ajustes.</p>
</div>`;
  },
};

function movesList() {
  let list = S.txs.filter(t => t.date.startsWith(UI.mvMonth));
  if (UI.mvCat) list = list.filter(t => t.categoryId === UI.mvCat);
  else if (UI.mvFilter === 'goals') list = list.filter(t => t.type === 'goal_in' || t.type === 'goal_out');
  else if (UI.mvFilter !== 'all') list = list.filter(t => t.type === UI.mvFilter);
  const q = UI.mvQuery.trim().toLowerCase();
  if (q) list = list.filter(t => [t.note, catBy(t.categoryId)?.name, accName(t.accountId), t.toAccountId && accName(t.toAccountId), goalBy(t.goalId)?.name, String(t.amount)].join(' ').toLowerCase().includes(q));
  if (!list.length) return `<div class="card">${empty('Nada por aquí', q ? 'No hay movimientos que coincidan con tu búsqueda.' : 'No hay movimientos en este mes con este filtro.', '', '🔍')}</div>`;
  const out = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const inn = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  return `<div class="totals-line"><span>${list.length} ${list.length === 1 ? 'movimiento' : 'movimientos'}</span><span>${inn ? `<b class="inc num">+${money(inn)}</b> · ` : ''}<b class="num">−${money(out)}</b></span></div>${grouped(list)}`;
}

function goalCard(g) {
  const saved = goalSaved(g.id), pct = g.target ? Math.min(100, saved / g.target * 100) : 0, left = Math.max(0, g.target - saved);
  const done = g.target > 0 && saved >= g.target;
  let plan = '';
  if (g.deadline && left > 0) {
    const daysTo = (pdate(g.deadline) - pdate(today())) / 864e5;
    if (daysTo > 0) { const m = Math.max(1, Math.ceil(daysTo / 30.44)); plan = `Ahorra <b>${money(left / m)}</b> al mes para lograrla a tiempo (${m} ${m === 1 ? 'mes' : 'meses'}).`; }
    else plan = 'La fecha que pusiste ya pasó. Puedes editar la meta para ajustarla.';
  }
  return `<div class="card">
  <button class="goal-top" data-act="editGoal" data-id="${g.id}"><span class="ci lg" style="--c:${g.color}">${g.icon}</span><span class="goal-main"><span class="goal-name">${esc(g.name)}</span><span class="muted small">${g.deadline ? 'Para el ' + longDate(g.deadline) : 'Sin fecha límite'}</span></span><span class="goal-pct num">${Math.floor(pct)}%</span></button>
  <div class="progress"><span style="width:${pct}%;background:${g.color}"></span></div>
  <div class="goal-nums"><span class="num"><b>${money(saved)}</b> <span class="muted">de ${money(g.target)}</span></span>${done ? '<span class="tag ok">¡Meta cumplida! 🎉</span>' : `<span class="muted small num">Faltan ${money(left)}</span>`}</div>
  ${plan ? `<div class="tip">${ic('spark')}<span>${plan}</span></div>` : ''}
  <div class="goal-actions"><button class="btn soft" data-act="goalMove" data-id="${g.id}" data-dir="in">${ic('plus')} Abonar</button><button class="btn ghost" data-act="goalMove" data-id="${g.id}" data-dir="out" ${saved <= 0 ? 'disabled' : ''}>Retirar</button></div>
</div>`;
}

function hormigaCard(mk) {
  const th = S.settings.hormiga || 15000;
  const small = S.txs.filter(t => t.type === 'expense' && t.date.startsWith(mk) && t.amount <= th);
  const sum = small.reduce((s, t) => s + t.amount, 0), days = daysElapsed(mk) || 1;
  const yearly = mk === curMonth() ? sum / days * 365 : sum * 12;
  const m = new Map(); small.forEach(t => m.set(t.categoryId, (m.get(t.categoryId) || 0) + t.amount));
  const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, s]) => ({ ...(catBy(id) || { icon: '❔', name: 'Otro' }), s }));
  return `<div class="card">
  <div class="h-top"><span class="ci" style="--c:#f5c84b">🐜</span><div><h3>Gastos hormiga</h3><span class="muted small">Compras de ${money(th)} o menos</span></div></div>
  ${small.length ? `<div class="h-grid"><div><b class="num">${money(sum)}</b><span>este mes</span></div><div><b class="num">${small.length}</b><span>compras pequeñas</span></div><div><b class="num">${compact(yearly)}</b><span>al año a este ritmo</span></div></div>
  <div class="h-cats">${top.map(c => `<span class="tag">${c.icon} ${esc(c.name)} · ${money(c.s)}</span>`).join('')}</div>
  <div class="tip">${ic('spark')}<span>Recortar la mitad de estos gastos te dejaría unos <b>${money(yearly / 2)}</b> al año para tus metas.</span></div>`
      : `<p class="muted small" style="margin:12px 0 0">No hay compras pequeñas registradas en este mes. 👌</p>`}
</div>`;
}

/* ---------------- gráficas (SVG propio, funciona sin internet) ---------------- */
function donut(items, total) {
  const r = 72, C = 2 * Math.PI * r;
  let off = 0;
  const segs = items.map(it => {
    const len = it.sum / total * C, gap = items.length > 1 ? Math.min(3, len / 3) : 0;
    const s = `<circle r="${r}" cx="90" cy="90" fill="none" stroke="${it.color}" stroke-width="20" stroke-dasharray="${Math.max(0.01, len - gap)} ${C}" stroke-dashoffset="${-off}"/>`;
    off += len; return s;
  }).join('');
  return `<div class="donut"><svg viewBox="0 0 180 180"><g transform="rotate(-90 90 90)"><circle r="${r}" cx="90" cy="90" fill="none" stroke="var(--surface-2)" stroke-width="20"/>${segs}</g></svg>
<div class="donut-c"><span class="muted small">Total gastado</span><b class="num">${money(total)}</b><span class="muted small">${items.length} ${items.length === 1 ? 'categoría' : 'categorías'}</span></div></div>`;
}
function trendChart(mk) {
  const months = Array.from({ length: 6 }, (_, i) => addMonth(mk, i - 5));
  const vals = months.map(m => monthTotals(m)), max = Math.max(1, ...vals.flatMap(v => [v.inc, v.exp]));
  const W = 330, H = 150, base = 118, top = 18, gw = W / 6, bw = 13;
  let out = `<line x1="0" x2="${W}" y1="${base + .5}" y2="${base + .5}" stroke="var(--border-strong)"/>`;
  out += `<text x="${W}" y="10" text-anchor="end" font-size="10" fill="var(--muted)">máx ${compact(max)}</text>`;
  months.forEach((m, i) => {
    const cx = gw * i + gw / 2, v = vals[i];
    [[v.inc, 'var(--accent)', cx - bw - 1.5], [v.exp, 'var(--exp-bar)', cx + 1.5]].forEach(([val, col, x]) => {
      const h = val > 0 ? Math.max(3, val / max * (base - top)) : 0;
      if (h) out += `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" rx="4" fill="${col}"/>`;
    });
    const sel = m === mk;
    out += `<text x="${cx}" y="${base + 20}" text-anchor="middle" font-size="11.5" font-weight="${sel ? 700 : 500}" fill="${sel ? 'var(--text)' : 'var(--muted)'}">${cap(MON[Number(m.slice(5)) - 1])}</text>`;
  });
  return `<svg class="trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos y gastos de los últimos 6 meses">${out}</svg>`;
}

/* ================= HOJAS (formularios) ================= */
function openSheet(html) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="backdrop" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
}
function setSheet(html) { const s = $('#sheet-root .sheet'); if (s) s.innerHTML = `<div class="grab"></div>${html}`; }
function closeSheet() {
  const root = $('#sheet-root');
  root.classList.remove('open'); document.body.classList.remove('sheet-open');
  setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 320);
}
const pickedIn = sel => $(sel + ' .on')?.dataset.id;
const accChips = (role, sel, noCredit) => `<div class="acc-chips" data-role="${role}">${activeAccounts().filter(a => !noCredit || a.type !== 'credit').map(a => `<button class="chip ${a.id === sel ? 'on' : ''}" data-act="pick" data-id="${a.id}">${a.icon} ${esc(a.name)}</button>`).join('')}</div>`;
const swatches = sel => `<div class="swatches">${PALETTE.map(c => `<button class="sw ${c === sel ? 'on' : ''}" style="--c:${c}" data-act="pick" data-id="${c}" aria-label="Color"></button>`).join('')}</div>`;
const emojiRow = list => `<div class="emoji-row">${list.map(e => `<button data-act="emoji" data-v="${e}">${e}</button>`).join('')}</div>`;

/* ---- registrar / editar movimiento ---- */
let D = null;
function openTx(opts = {}) {
  const t = opts.id ? S.txs.find(x => x.id === opts.id) : null;
  if (t && (t.type === 'goal_in' || t.type === 'goal_out')) return openGoalMove(t.goalId, t.type === 'goal_in' ? 'in' : 'out', t.id);
  D = t ? { ...t, amount: String(t.amount), repeat: false }
    : { id: null, type: opts.type || 'expense', amount: '', categoryId: opts.categoryId || null, accountId: defaultAccount(), toAccountId: null, date: today(), note: '', repeat: !!opts.repeat };
  openSheet(txSheetHtml());
}
function txSheetHtml() {
  const isT = D.type === 'transfer', kind = D.type === 'income' ? 'income' : 'expense';
  const custom = D.date !== today() && D.date !== yesterday();
  const types = D.id ? [[D.type, { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' }[D.type]]] : [['expense', 'Gasto'], ['income', 'Ingreso'], ['transfer', 'Transferir']];
  return `<div class="seg">${types.map(([k, l]) => `<button class="${D.type === k ? 'on' : ''}" data-act="txType" data-v="${k}">${l}</button>`).join('')}</div>
<div class="amount num ${D.type} ${D.amount ? '' : 'empty-amt'}" id="amt">${money(Number(D.amount || 0))}</div>
<input class="note-in" id="txNote" placeholder="${isT ? 'Nota (opcional)' : 'Agregar nota: ej. tinto, Uber, almuerzo'}" value="${esc(D.note)}" maxlength="60" autocomplete="off">
${isT ? `<div class="field-label">Desde</div>${accChips('from', D.accountId)}<div class="field-label">Hacia</div>${accChips('to', D.toAccountId)}`
      : `<div class="field-label">Categoría</div><div class="cat-scroll" id="catPick">${sortedCats(kind).map(c => `<button class="cat-chip ${D.categoryId === c.id ? 'on' : ''}" data-act="pick" data-id="${c.id}"><span class="ci sm" style="--c:${c.color}">${c.icon}</span><span>${esc(c.name)}</span></button>`).join('')}</div>
<div class="field-label">${D.type === 'income' ? 'Entra a' : 'Pagado con'}</div>${accChips('from', D.accountId, D.type === 'income')}`}
<div class="row-chips" id="dateChips">
  <button class="chip ${D.date === today() ? 'on' : ''}" data-act="txDay" data-v="0">Hoy</button>
  <button class="chip ${D.date === yesterday() ? 'on' : ''}" data-act="txDay" data-v="1">Ayer</button>
  <label class="chip date-chip ${custom ? 'on' : ''}">${ic('cal')}<span id="dateLbl">${custom ? shortDate(D.date) : 'Otra fecha'}</span><input type="date" id="txDate" value="${D.date}" max="${today()}"></label>
  ${!D.id && !isT ? `<button class="chip ${D.repeat ? 'on' : ''}" data-act="toggleRepeat">${ic('repeat')} Cada mes</button>` : ''}
</div>
<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(k => `<button data-act="key" data-k="${k}" aria-label="${k === 'del' ? 'Borrar' : k}">${k === 'del' ? ic('del') : k}</button>`).join('')}</div>
<button class="btn primary block" data-act="saveTx">${D.id ? 'Guardar cambios' : 'Guardar ' + { expense: 'gasto', income: 'ingreso', transfer: 'transferencia' }[D.type]}</button>
${D.id ? `<button class="btn ghost danger block" data-act="deleteTx">${ic('trash')} Eliminar</button>` : ''}`;
}
function refreshAmount() {
  const el = $('#amt'); if (!el) return;
  el.textContent = money(Number(D.amount || 0));
  el.classList.toggle('empty-amt', !D.amount);
}
function refreshDateChips() {
  const custom = D.date !== today() && D.date !== yesterday();
  $$('#dateChips [data-act="txDay"]').forEach(b => b.classList.toggle('on', (b.dataset.v === '0' && D.date === today()) || (b.dataset.v === '1' && D.date === yesterday())));
  const lbl = $('#dateLbl'); if (lbl) { lbl.textContent = custom ? shortDate(D.date) : 'Otra fecha'; lbl.parentElement.classList.toggle('on', custom); }
}
async function saveTx() {
  const amount = Number(D.amount || 0);
  if (!amount) return toast('Escribe el monto');
  const isT = D.type === 'transfer';
  const accountId = pickedIn('.acc-chips[data-role="from"]');
  const categoryId = isT ? null : pickedIn('#catPick');
  const toAccountId = isT ? pickedIn('.acc-chips[data-role="to"]') : null;
  if (!accountId) return toast(isT ? 'Elige la cuenta de origen' : 'Elige la cuenta');
  if (!isT && !categoryId) return toast('Elige una categoría');
  if (isT && (!toAccountId || toAccountId === accountId)) return toast('Elige una cuenta de destino diferente');
  const old = D.id ? S.txs.find(t => t.id === D.id) : null;
  const tx = { ...(old || {}), id: D.id || uid(), type: D.type, amount, accountId, categoryId, toAccountId, date: D.date, note: D.note.trim(), createdAt: old?.createdAt || Date.now() };
  if (D.repeat && !D.id) {
    const r = { id: uid(), type: D.type, amount, accountId, categoryId, note: tx.note, day: Number(D.date.slice(8)), lastMonth: D.date.slice(0, 7), active: true };
    S.recurring.push(r); await DB.put('recurring', r); tx.recurringId = r.id;
  }
  if (old) Object.assign(old, tx); else S.txs.push(tx);
  await DB.put('txs', tx);
  closeSheet(); render();
  toast(old ? 'Cambios guardados' : { expense: 'Gasto registrado', income: 'Ingreso registrado', transfer: 'Transferencia registrada' }[D.type] + (D.repeat ? ' · se repetirá cada mes' : ''));
  const c = catBy(categoryId);
  if (!old && D.type === 'expense' && c?.budget) {
    const spent = expenseByCat(tx.date.slice(0, 7)).find(x => x.id === c.id)?.sum || 0;
    if (spent >= c.budget) setTimeout(() => toast(`⚠️ Superaste tu presupuesto de ${c.name}`), 2500);
    else if (spent >= c.budget * .8) setTimeout(() => toast(`Ya usaste el ${Math.round(spent / c.budget * 100)}% del presupuesto de ${c.name}`), 2500);
  }
}

/* ---- metas ---- */
let GE = null; // meta en edición
function openGoal(id) {
  const g = id ? goalBy(id) : null;
  GE = g ? { ...g } : { id: null, name: '', icon: '🎯', color: '#a3f04a', target: 0, deadline: '' };
  openSheet(`<h3 class="plain">${g ? 'Editar meta' : 'Nueva meta de ahorro'}</h3>
<div class="fl">Nombre e ícono<div class="icon-name"><input class="in emoji" id="f-icon" value="${esc(GE.icon)}" maxlength="4"><input class="in" id="f-name" value="${esc(GE.name)}" placeholder="Ej: Viaje a San Andrés" maxlength="40"></div></div>
${emojiRow(['🎯', '✈️', '🏍️', '💻', '📱', '🏠', '🚗', '🎓', '🛡️', '🎁', '💍', '🏖️'])}
<label class="fl">¿Cuánto necesitas?<span class="money-wrap">$<input class="money-in" id="f-target" inputmode="numeric" value="${GE.target ? group(GE.target) : ''}" placeholder="0"></span></label>
<label class="fl">¿Para cuándo? (opcional)<input type="date" class="in" id="f-deadline" value="${GE.deadline || ''}" min="${today()}"></label>
<div class="fl">Color</div>${swatches(GE.color)}
<div class="form-actions"><button class="btn primary block" data-act="saveGoal">${g ? 'Guardar cambios' : 'Crear meta'}</button>
${g ? `<button class="btn ghost danger block" data-act="deleteGoal">${ic('trash')} Eliminar meta</button>` : ''}</div>`);
}
async function saveGoal() {
  const name = $('#f-name').value.trim(), target = parseMoney($('#f-target').value);
  if (!name) return toast('Ponle un nombre a la meta');
  if (!target) return toast('Indica cuánto necesitas');
  const g = { ...(GE.id ? goalBy(GE.id) : { createdAt: Date.now() }), id: GE.id || uid(), name, target, icon: $('#f-icon').value.trim() || '🎯', deadline: $('#f-deadline').value || '', color: pickedIn('.swatches') || GE.color };
  const i = S.goals.findIndex(x => x.id === g.id);
  if (i >= 0) S.goals[i] = g; else S.goals.push(g);
  await DB.put('goals', g); closeSheet(); render(); toast(GE.id ? 'Meta actualizada' : 'Meta creada 🎯');
}
async function deleteGoal(el) {
  if (goalSaved(GE.id) > 0) return toast('Primero retira el dinero ahorrado en esta meta');
  if (!armed(el)) return;
  const ids = S.txs.filter(t => t.goalId === GE.id).map(t => t.id);
  S.txs = S.txs.filter(t => t.goalId !== GE.id); for (const id of ids) await DB.del('txs', id);
  S.goals = S.goals.filter(g => g.id !== GE.id); await DB.del('goals', GE.id);
  closeSheet(); render(); toast('Meta eliminada');
}
let GM = null;
function openGoalMove(goalId, dir, txId) {
  const g = goalBy(goalId); if (!g) return;
  const t = txId ? S.txs.find(x => x.id === txId) : null;
  GM = { goalId, dir, txId };
  const saved = goalSaved(goalId) - (t && dir === 'out' ? -t.amount : 0);
  openSheet(`<div class="sheet-title"><span class="ci lg" style="--c:${g.color}">${g.icon}</span><div><h3>${dir === 'in' ? 'Abonar a' : 'Retirar de'} ${esc(g.name)}</h3><span class="muted small">Ahorrado: ${money(goalSaved(goalId))} de ${money(g.target)}</span></div></div>
<label class="fl">Monto<span class="money-wrap big">$<input id="gm-amt" class="money-in" inputmode="numeric" value="${t ? group(t.amount) : ''}" placeholder="0"></span></label>
${dir === 'in' && !t ? `<div class="row-chips">${[10000, 20000, 50000, 100000].map(v => `<button class="chip" data-act="gmQuick" data-v="${v}">+ ${compact(v)}</button>`).join('')}</div>` : ''}
<div class="field-label">${dir === 'in' ? 'El dinero sale de' : 'El dinero vuelve a'}</div>${accChips('from', t?.accountId || defaultAccount(true), true)}
<label class="fl">Fecha<input type="date" class="in" id="gm-date" value="${t?.date || today()}" max="${today()}"></label>
<div class="form-actions"><button class="btn primary block" data-act="saveGoalMove">${t ? 'Guardar cambios' : dir === 'in' ? 'Abonar' : 'Retirar'}</button>
${t ? `<button class="btn ghost danger block" data-act="deleteTx" data-id="${t.id}">${ic('trash')} Eliminar movimiento</button>` : ''}</div>`);
  GM.maxOut = dir === 'out' ? saved : Infinity;
}
async function saveGoalMove() {
  const amount = parseMoney($('#gm-amt').value), accountId = pickedIn('.acc-chips[data-role="from"]');
  if (!amount) return toast('Escribe el monto');
  if (!accountId) return toast('Elige la cuenta');
  if (GM.dir === 'out') {
    const t = GM.txId ? S.txs.find(x => x.id === GM.txId) : null;
    const avail = goalSaved(GM.goalId) + (t ? t.amount : 0);
    if (amount > avail) return toast(`Solo tienes ${money(avail)} en esta meta`);
  }
  const old = GM.txId ? S.txs.find(x => x.id === GM.txId) : null;
  const tx = { ...(old || {}), id: GM.txId || uid(), type: GM.dir === 'in' ? 'goal_in' : 'goal_out', goalId: GM.goalId, amount, accountId, date: $('#gm-date').value || today(), note: '', createdAt: old?.createdAt || Date.now() };
  if (old) Object.assign(old, tx); else S.txs.push(tx);
  await DB.put('txs', tx); closeSheet(); render();
  const g = goalBy(GM.goalId), s = goalSaved(GM.goalId);
  toast(GM.dir === 'in' ? (s >= g.target ? `¡Cumpliste la meta ${g.name}! 🎉` : `Abonaste ${money(amount)} a ${g.name}`) : `Retiraste ${money(amount)}`);
}

/* ---- cuentas ---- */
let AE = null;
function openAccount(id) {
  const a = id ? accBy(id) : null;
  AE = a ? { ...a } : { id: null, name: '', type: 'digital', icon: '🏦', color: '#4ec9ff', initial: 0, limit: 0 };
  const bal = a ? accBalance(a) : 0, cr = AE.type === 'credit';
  const used = a && S.txs.some(t => t.accountId === a.id || t.toAccountId === a.id);
  openSheet(`<div id="accForm" class="${cr ? 'is-credit' : ''}">
<h3 class="plain">${a ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
${a ? '' : `<div class="fl">Tipo</div><div class="seg" id="accType" style="margin-top:6px">${[['cash', 'Efectivo'], ['digital', 'Digital'], ['debit', 'Débito'], ['credit', 'Crédito']].map(([k, l]) => `<button class="${AE.type === k ? 'on' : ''}" data-act="accType" data-v="${k}">${l}</button>`).join('')}</div>`}
<div class="fl">Nombre e ícono<div class="icon-name"><input class="in emoji" id="f-icon" value="${esc(AE.icon)}" maxlength="4"><input class="in" id="f-name" value="${esc(AE.name)}" placeholder="Ej: Daviplata, Bancolombia" maxlength="30"></div></div>
${emojiRow(['💵', '📱', '🏦', '💳', '🐷', '💰', '🪙', '🏧'])}
<label class="fl no-credit">Saldo actual real<span class="money-wrap">$<input class="money-in" id="f-bal" inputmode="numeric" value="${!cr && bal > 0 ? group(bal) : ''}" placeholder="0"></span></label>
<label class="fl credit-only">Deuda actual<span class="money-wrap">$<input class="money-in" id="f-debt" inputmode="numeric" value="${cr && bal < 0 ? group(-bal) : ''}" placeholder="0"></span></label>
<label class="fl credit-only">Cupo total<span class="money-wrap">$<input class="money-in" id="f-limit" inputmode="numeric" value="${AE.limit ? group(AE.limit) : ''}" placeholder="0"></span></label>
${a ? '<p class="hint">Si cambias el saldo, la app hace el ajuste sin tocar tus movimientos.</p>' : ''}
<div class="fl">Color</div>${swatches(AE.color)}
<div class="form-actions"><button class="btn primary block" data-act="saveAcc">${a ? 'Guardar' : 'Crear cuenta'}</button>
${a ? `<button class="btn ghost danger block" data-act="deleteAcc">${ic('trash')} ${used ? 'Archivar cuenta' : 'Eliminar cuenta'}</button>` : ''}</div></div>`);
}
async function saveAcc() {
  const name = $('#f-name').value.trim();
  if (!name) return toast('Ponle un nombre a la cuenta');
  const existing = AE.id ? accBy(AE.id) : null;
  const a = existing || { id: uid(), type: AE.type, initial: 0, order: S.accounts.length, createdAt: Date.now() };
  if (!existing) a.type = AE.type;
  a.name = name; a.icon = $('#f-icon').value.trim() || '🏦'; a.color = pickedIn('.swatches') || AE.color;
  const target = a.type === 'credit' ? -parseMoney($('#f-debt').value) : parseMoney($('#f-bal').value);
  if (a.type === 'credit') a.limit = parseMoney($('#f-limit').value);
  if (!existing) S.accounts.push(a);
  a.initial = (a.initial || 0) + (target - accBalance(a));
  await DB.put('accounts', a); closeSheet(); render(); toast(existing ? 'Cuenta actualizada' : 'Cuenta creada');
}
async function deleteAcc(el) {
  const a = accBy(AE.id); if (!a) return;
  if (activeAccounts().length <= 1) return toast('Necesitas al menos una cuenta');
  if (!armed(el)) return;
  const used = S.txs.some(t => t.accountId === a.id || t.toAccountId === a.id);
  if (used) { a.archived = true; await DB.put('accounts', a); }
  else { S.accounts = S.accounts.filter(x => x.id !== a.id); await DB.del('accounts', a.id); }
  closeSheet(); render(); toast(used ? 'Cuenta archivada (su historial se conserva)' : 'Cuenta eliminada');
}

/* ---- categorías ---- */
let CE = null;
function openCategory(id) {
  const c = id ? catBy(id) : null;
  CE = c ? { ...c } : { id: null, kind: UI.catKind, name: '', icon: '🏷️', color: '#a3f04a', budget: 0 };
  const used = c && S.txs.some(t => t.categoryId === c.id);
  openSheet(`<h3 class="plain">${c ? 'Editar categoría' : CE.kind === 'expense' ? 'Nueva categoría de gasto' : 'Nueva categoría de ingreso'}</h3>
<div class="fl">Nombre e ícono<div class="icon-name"><input class="in emoji" id="f-icon" value="${esc(CE.icon)}" maxlength="4"><input class="in" id="f-name" value="${esc(CE.name)}" placeholder="Ej: Mascotas" maxlength="30"></div></div>
${emojiRow(CE.kind === 'expense' ? ['🐶', '☕', '🍺', '⛽', '🅿️', '💈', '🎮', '🧹', '👶', '✂️', '🚕', '🍕'] : ['💼', '💸', '🏷️', '🎁', '📈', '🧾'])}
${CE.kind === 'expense' ? `<label class="fl">Presupuesto mensual (opcional)<span class="money-wrap">$<input class="money-in" id="f-budget" inputmode="numeric" value="${CE.budget ? group(CE.budget) : ''}" placeholder="Sin límite"></span></label>` : ''}
<div class="fl">Color</div>${swatches(CE.color)}
<div class="form-actions"><button class="btn primary block" data-act="saveCat">${c ? 'Guardar' : 'Crear categoría'}</button>
${c ? `<button class="btn ghost danger block" data-act="deleteCat">${ic('trash')} ${used ? 'Ocultar categoría' : 'Eliminar categoría'}</button>` : ''}</div>`);
}
async function saveCat() {
  const name = $('#f-name').value.trim();
  if (!name) return toast('Ponle un nombre');
  const existing = CE.id ? catBy(CE.id) : null;
  const c = existing || { id: uid(), kind: CE.kind, order: S.categories.filter(x => x.kind === CE.kind).length };
  c.name = name; c.icon = $('#f-icon').value.trim() || '🏷️'; c.color = pickedIn('.swatches') || CE.color;
  c.budget = c.kind === 'expense' ? parseMoney($('#f-budget')?.value) : 0;
  if (!existing) S.categories.push(c);
  await DB.put('categories', c); closeSheet(); render(); toast(existing ? 'Categoría actualizada' : 'Categoría creada');
}
async function deleteCat(el) {
  const c = catBy(CE.id); if (!c) return;
  if (!armed(el)) return;
  const used = S.txs.some(t => t.categoryId === c.id);
  if (used) { c.archived = true; await DB.put('categories', c); }
  else { S.categories = S.categories.filter(x => x.id !== c.id); await DB.del('categories', c.id); }
  S.recurring.filter(r => r.categoryId === c.id).forEach(r => { r.active = false; DB.put('recurring', r); });
  closeSheet(); render(); toast(used ? 'Categoría oculta (el historial se conserva)' : 'Categoría eliminada');
}

/* ---- pagos fijos ---- */
let RE = null;
function openRecurring(id) {
  const r = S.recurring.find(x => x.id === id); if (!r) return;
  RE = { ...r };
  const c = catBy(r.categoryId) || { icon: '❔', color: '#8b9687', name: '' };
  openSheet(`<div class="sheet-title"><span class="ci" style="--c:${c.color}">${c.icon}</span><div><h3>${esc(r.note || c.name)}</h3><span class="muted small">${r.type === 'income' ? 'Ingreso' : 'Gasto'} fijo mensual</span></div></div>
<label class="fl">Nombre<input class="in" id="f-note" value="${esc(r.note)}" placeholder="${esc(c.name)}" maxlength="60"></label>
<label class="fl">Monto<span class="money-wrap">$<input class="money-in" id="f-amt" inputmode="numeric" value="${group(r.amount)}"></span></label>
<label class="fl">Día del mes<select class="in" id="f-day">${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${r.day === i + 1 ? 'selected' : ''}>Día ${i + 1}${i + 1 > 28 ? ' (o último día del mes)' : ''}</option>`).join('')}</select></label>
<div class="field-label">Cuenta</div>${accChips('from', r.accountId, r.type === 'income')}
<button class="row" style="padding:12px 2px;margin-top:8px" data-act="recToggle"><span class="row-main">Activo<span class="row-sub">Pausa este pago sin borrarlo</span></span><span class="switch ${r.active ? 'on' : ''}" id="recSwitch"></span></button>
<div class="form-actions"><button class="btn primary block" data-act="saveRec">Guardar</button>
<button class="btn ghost danger block" data-act="deleteRec">${ic('trash')} Eliminar pago fijo</button></div>`);
}
async function saveRec() {
  const r = S.recurring.find(x => x.id === RE.id); if (!r) return;
  const amount = parseMoney($('#f-amt').value); if (!amount) return toast('Escribe el monto');
  r.note = $('#f-note').value.trim(); r.amount = amount; r.day = Number($('#f-day').value);
  r.accountId = pickedIn('.acc-chips[data-role="from"]') || r.accountId; r.active = RE.active;
  await DB.put('recurring', r); closeSheet(); await runRecurring(); render(); toast('Pago fijo actualizado');
}
async function deleteRec(el) {
  if (!armed(el)) return;
  S.recurring = S.recurring.filter(x => x.id !== RE.id); await DB.del('recurring', RE.id);
  S.txs.forEach(t => { if (t.recurringId === RE.id) { delete t.recurringId; DB.put('txs', t); } });
  closeSheet(); render(); toast('Pago fijo eliminado (los registros anteriores se conservan)');
}

/* ---- PIN ---- */
let PIN = { val: '', mode: 'unlock', first: '' };
async function hashPin(s) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cuentas-claras:' + s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch { let h = 7; for (const c of 'cc' + s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'w' + h; }
}
const pinHtml = title => `<div class="pin-wrap"><div class="onb-logo">${LOGO}</div><div class="pin-title">${title}</div><div class="pin-dots">${'<i></i>'.repeat(4)}</div>
<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(k => `<button class="${k === '' ? 'blank' : ''}" data-act="pinKey" data-k="${k}" aria-label="${k === 'del' ? 'Borrar' : k}">${k === 'del' ? ic('del') : k}</button>`).join('')}</div></div>`;
const pinRoot = () => $('#lock.on') || $('#sheet-root .sheet');
function pinDots() { $$('.pin-dots i', pinRoot()).forEach((d, i) => d.classList.toggle('on', i < PIN.val.length)); }
function showLock() { PIN = { val: '', mode: 'unlock', first: '' }; const L = $('#lock'); L.innerHTML = pinHtml('Ingresa tu PIN'); L.classList.add('on'); }
async function pinDone() {
  const root = pinRoot(), title = $('.pin-title', root), wrap = $('.pin-dots', root);
  const fail = msg => { wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake'); PIN.val = ''; if (msg) title.textContent = msg; setTimeout(pinDots, 120); };
  if (PIN.mode === 'unlock') {
    if (await hashPin(PIN.val) === S.settings.pinHash) { $('#lock').classList.remove('on'); $('#lock').innerHTML = ''; }
    else fail('PIN incorrecto');
  } else if (PIN.mode === 'set1') {
    PIN.first = PIN.val; PIN.val = ''; PIN.mode = 'set2'; title.textContent = 'Confírmalo'; pinDots();
  } else if (PIN.mode === 'set2') {
    if (PIN.val === PIN.first) {
      S.settings.pinHash = await hashPin(PIN.val); await saveSettings(); closeSheet(); render(); toast('PIN activado 🔒');
    } else { PIN.mode = 'set1'; PIN.first = ''; fail('No coinciden. Crea tu PIN otra vez'); }
  }
}

/* ---- respaldo ---- */
async function shareOrDownload(file) {
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: file.name }); return true; }
  } catch (e) { if (e.name === 'AbortError') return false; }
  const url = URL.createObjectURL(file), a = document.createElement('a');
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
async function exportBackup() {
  const data = { app: 'cuentas-claras', version: 1, exportedAt: new Date().toISOString(), accounts: S.accounts, categories: S.categories, txs: S.txs, goals: S.goals, recurring: S.recurring, settings: { ...S.settings, pinHash: null } };
  const file = new File([JSON.stringify(data)], `cuentas-claras-${today()}.json`, { type: 'application/json' });
  if (await shareOrDownload(file)) { S.settings.lastBackup = Date.now(); await saveSettings(); render(); toast('Copia creada. Guárdala en Archivos o iCloud'); }
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'cuentas-claras' || !Array.isArray(data.txs)) return toast('Ese archivo no es una copia de Cuentas Claras');
    if (!confirm(`Se reemplazarán tus datos actuales por la copia del ${(data.exportedAt || '').slice(0, 10)} (${data.txs.length} movimientos). ¿Continuar?`)) return;
    for (const s of STORES) await DB.clear(s);
    const pin = S.settings.pinHash;
    S.accounts = data.accounts || []; S.categories = data.categories || []; S.txs = data.txs; S.goals = data.goals || []; S.recurring = data.recurring || [];
    S.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), id: 'settings', pinHash: pin, onboarded: true };
    await DB.bulk('accounts', S.accounts); await DB.bulk('categories', S.categories); await DB.bulk('txs', S.txs);
    await DB.bulk('goals', S.goals); await DB.bulk('recurring', S.recurring); await saveSettings();
    applyTheme(); render(true); toast('Copia restaurada ✅');
  } catch (e) { console.error(e); toast('No se pudo leer el archivo'); }
}
async function exportCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const tipo = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia', goal_in: 'Abono a meta', goal_out: 'Retiro de meta' };
  const rows = [['Fecha', 'Tipo', 'Monto', 'Categoría', 'Cuenta', 'Cuenta destino', 'Meta', 'Nota']]
    .concat(sortTx(S.txs).map(t => [t.date, tipo[t.type], t.type === 'expense' ? -t.amount : t.amount, catBy(t.categoryId)?.name || '', accName(t.accountId), t.toAccountId ? accName(t.toAccountId) : '', goalBy(t.goalId)?.name || '', t.note || '']));
  const csv = '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n');
  await shareOrDownload(new File([csv], `movimientos-${today()}.csv`, { type: 'text/csv' }));
}

/* ---- tema ---- */
const mql = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme || 'auto', dark = t === 'dark' || (t === 'auto' && mql.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#060806' : '#f3f5f0');
  try { localStorage.setItem('cc-theme', t); } catch { }
}
mql.addEventListener?.('change', () => S.settings.theme === 'auto' && applyTheme());

/* ================= RENDER ================= */
function render(anim) {
  const view = $('#view'), nav = $('#nav');
  if (!S.settings.onboarded) { view.innerHTML = VIEWS.onboard(); nav.hidden = true; return; }
  nav.hidden = false;
  view.innerHTML = VIEWS[UI.sub || UI.tab]();
  $$('#nav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  if (anim) { view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter'); window.scrollTo(0, 0); }
}

/* ================= ACCIONES ================= */
const A = {
  go(el) {
    if (el.dataset.tab) { UI.tab = el.dataset.tab; UI.sub = null; }
    if (el.dataset.sub) {
      if (el.dataset.sub === 'moves') { UI.mvCat = null; UI.mvMonth = curMonth(); UI.mvFilter = 'all'; UI.mvQuery = ''; }
      UI.prevTab = UI.tab; UI.sub = el.dataset.sub;
    }
    render(true);
  },
  back() { UI.sub = null; render(true); },
  goAnalysis() { UI.tab = 'analysis'; UI.sub = null; UI.anMonth = curMonth(); render(true); },
  month(el) { const k = el.dataset.k; UI[k] = addMonth(UI[k], Number(el.dataset.d)); if (UI[k] > curMonth()) UI[k] = curMonth(); render(); },
  catMoves(el) { UI.sub = 'moves'; UI.mvMonth = el.dataset.m || curMonth(); UI.mvCat = el.dataset.id; UI.mvFilter = 'all'; UI.mvQuery = ''; render(true); },
  clearCat() { UI.mvCat = null; render(); },
  mvFilter(el) { UI.mvFilter = el.dataset.v; UI.mvCat = null; render(); },
  catKind(el) { UI.catKind = el.dataset.v; render(); },
  closeSheet,

  // movimiento
  newTx() { openTx(); },
  newRec() { openTx({ repeat: true }); },
  editTx(el) { openTx({ id: el.dataset.id }); },
  txType(el) {
    if (D.id || el.dataset.v === D.type) return;
    D.accountId = pickedIn('.acc-chips[data-role="from"]') || D.accountId;
    D.type = el.dataset.v; D.categoryId = null; D.toAccountId = null;
    if (D.type === 'income' && accBy(D.accountId)?.type === 'credit') D.accountId = defaultAccount(true);
    setSheet(txSheetHtml());
  },
  pick(el) { const p = el.parentElement; $$('.on', p).forEach(x => x.classList.remove('on')); el.classList.add('on'); },
  key(el) {
    const k = el.dataset.k;
    if (k === 'del') D.amount = D.amount.slice(0, -1);
    else if ((D.amount + k).replace(/^0+/, '').length <= 10) D.amount = (D.amount + k).replace(/^0+/, '');
    refreshAmount();
  },
  txDay(el) { D.date = el.dataset.v === '0' ? today() : yesterday(); const inp = $('#txDate'); if (inp) inp.value = D.date; refreshDateChips(); },
  toggleRepeat(el) { D.repeat = !D.repeat; el.classList.toggle('on', D.repeat); },
  saveTx,
  async deleteTx(el) {
    const id = el.dataset.id || D?.id; if (!id) return;
    if (!armed(el)) return;
    S.txs = S.txs.filter(t => t.id !== id); await DB.del('txs', id);
    closeSheet(); render(); toast('Movimiento eliminado');
  },

  // metas
  newGoal() { openGoal(); },
  editGoal(el) { openGoal(el.dataset.id); },
  saveGoal, deleteGoal,
  goalMove(el) { openGoalMove(el.dataset.id, el.dataset.dir); },
  gmQuick(el) { const i = $('#gm-amt'); i.value = group(parseMoney(i.value) + Number(el.dataset.v)); },
  saveGoalMove,
  emoji(el) { const i = $('#f-icon'); if (i) i.value = el.dataset.v; },

  // cuentas / categorías / fijos
  editAcc(el) { openAccount(el.dataset.id); },
  accType(el) {
    AE.type = el.dataset.v; A.pick(el);
    $('#accForm').classList.toggle('is-credit', AE.type === 'credit');
    const defs = { cash: ['💵', '#a3f04a'], digital: ['📱', '#c48bff'], debit: ['🏦', '#4ec9ff'], credit: ['💳', '#ffb547'] }[AE.type];
    $('#f-icon').value = defs[0];
    $$('.swatches .sw').forEach(s => s.classList.toggle('on', s.dataset.id === defs[1]));
  },
  saveAcc, deleteAcc,
  editCat(el) { openCategory(el.dataset.id); },
  saveCat, deleteCat,
  editRec(el) { openRecurring(el.dataset.id); },
  recToggle() { RE.active = !RE.active; $('#recSwitch').classList.toggle('on', RE.active); },
  saveRec, deleteRec,

  // ajustes
  theme(el) { S.settings.theme = el.dataset.v; applyTheme(); saveSettings(); render(); },
  togglePin(el) {
    if (S.settings.pinHash) {
      if (!armed(el, '<span class="row-main" style="padding-left:44px">Toca otra vez para desactivar el PIN</span>')) return;
      S.settings.pinHash = null; saveSettings(); render(); toast('PIN desactivado');
    } else { PIN = { val: '', mode: 'set1', first: '' }; openSheet(pinHtml('Crea un PIN de 4 dígitos')); }
  },
  pinKey(el) {
    const k = el.dataset.k;
    if (k === 'del') PIN.val = PIN.val.slice(0, -1);
    else if (k && PIN.val.length < 4) PIN.val += k;
    pinDots();
    if (PIN.val.length === 4) setTimeout(pinDone, 120);
  },
  exportBackup, exportCSV,
  importBackup() { $('#importFile').click(); },
  async resetAll(el) {
    if (!armed(el, '<span class="row-main" style="padding-left:44px">Toca otra vez: se borrará TODO</span>')) return;
    for (const s of STORES) await DB.clear(s);
    try { localStorage.removeItem('cc-theme'); } catch { }
    location.reload();
  },
  async finishOnboard() {
    S.settings.name = $('#o-name').value.trim();
    for (const inp of $$('[data-acc]')) { const a = accBy(inp.dataset.acc); a.initial = parseMoney(inp.value); await DB.put('accounts', a); }
    const cr = S.accounts.find(a => a.type === 'credit');
    if (cr) { cr.initial = -parseMoney($('#o-debt').value); cr.limit = parseMoney($('#o-limit').value); await DB.put('accounts', cr); }
    const p = $('#o-payday').value; S.settings.payday = p ? Number(p) : null;
    S.settings.onboarded = true; await saveSettings();
    render(true); toast('¡Listo! Registra tu primer movimiento con el botón +');
  },
};

/* ---------------- eventos globales ---------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.classList.contains('money-in')) { const d = t.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10); t.value = d ? group(Number(d)) : ''; }
  if (t.id === 'txNote' && D) D.note = t.value;
  if (t.id === 'mvSearch') { UI.mvQuery = t.value; $('#mvList').innerHTML = movesList(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'txDate' && D) { D.date = t.value && t.value <= today() ? t.value : today(); refreshDateChips(); }
  if (t.id === 'importFile' && t.files[0]) { importBackup(t.files[0]); t.value = ''; }
  if (t.dataset.set) {
    const k = t.dataset.set; let v = t.value;
    if (k === 'hormiga') v = parseMoney(v) || 15000;
    if (k === 'payday') v = v ? Number(v) : null;
    if (k === 'name') v = v.trim();
    S.settings[k] = v; saveSettings(); toast('Guardado');
  }
});
let hiddenAt = 0;
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (S.settings.pinHash && hiddenAt && Date.now() - hiddenAt > 60000) showLock();
  if (await runRecurring()) render();
  else if (hiddenAt && Date.now() - hiddenAt > 3600000) render(); // refresca saludo y fechas
});

/* ---------------- inicio ---------------- */
(async function init() {
  await load();
  applyTheme();
  if (S.settings.pinHash) showLock();
  if (S.settings.onboarded) await runRecurring();
  render(true);
  if (DB.mem) toast('Vista previa: los datos no se guardarán');
  try { navigator.storage?.persist?.(); } catch { }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
})();
