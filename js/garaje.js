// Garaje (familia Checa): control de tu auto. Combustible, servicios, gastos y avisos, todo en este teléfono.
import { loadData, saveData, DEFAULTS } from './almacenamiento.js';
import { icon } from './iconos.js';
import { MESES, esc, money, num, plural, today, uid, fdate, fold, numOrNull, ym } from './utilidades.js';
import { TIPOS, PRESETS, odometro, delMes, total, rendimiento, rendimientoDe, costoPorKm, ordenAvisos, estadoAviso, ponerAlDia } from './calculos.js';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view'), top = $('#top'), sheet = $('#sheet');
let data = loadData();
const state = { filtro: 'todo' };

function save() { saveData(data, () => toast('No se pudo guardar en este teléfono')); }

/* ---------- Aviso breve con Deshacer ---------- */
let toastTimer;
function toast(msg, act) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${act ? `<button type="button">${esc(act.label)}</button>` : ''}`;
  t.classList.add('show');
  if (act) $('button', t).onclick = () => { act.fn(); t.classList.remove('show'); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), act ? 6000 : 2600);
}

/* ---------- Barra inferior ---------- */
const TABS = { inicio: ['home', 'Inicio'], avisos: ['bell', 'Avisos'], historial: ['list', 'Historial'], yo: ['user', 'Yo'] };
Object.entries(TABS).forEach(([k, [ic, name]]) => { $(`[data-tab=${k}]`).innerHTML = `${icon(ic)}${name}`; });
$('#mas').innerHTML = icon('plus');

const route = () => { const r = (location.hash || '#/').replace(/^#\/?/, '').split('/')[0]; return TABS[r] ? r : 'inicio'; };

/* ---------- Vistas ---------- */
const luz = (sev) => `<span class="luz s${sev}"></span>`;
const ahora = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; };

function vacioInicial() {
  return `<section class="vacio"><div class="luz-grande">${icon('garage', 30)}</div>
    <strong>Aquí vive tu auto</strong>
    <p>Registra tu primera carga o un servicio. Yo te aviso cuándo toca el siguiente.</p>
    <div class="acciones"><button type="button" class="btn" data-act="registrar">Registrar ahora</button>
    <button type="button" class="btn soft" data-act="nuevo-aviso">Crear avisos (aceite, seguro…)</button></div></section>`;
}

function filaAviso({ r, est }) {
  return `<button type="button" class="fila" data-act="aviso" data-id="${esc(r.id)}">${luz(est.sev)}<span class="n">${esc(r.title)}</span><span class="dato t${est.sev}">${est.corto.toLowerCase()}</span></button>`;
}

function renderInicio() {
  top.innerHTML = `<div class="brand"><span class="sello">${icon('garage', 22)}</span><b>Garaje</b></div>
    <a class="pill" href="#/yo">${esc(data.vehicle.name || 'Mi auto')}${icon('down', 16)}</a>`;
  if (!data.entries.length && !data.reminders.length) { view.innerHTML = vacioInicial(); return; }
  const { y, m } = ahora();
  const items = delMes(data, y, m);
  const c = total(items, 'combustible'), s = total(items, 'servicio'), g = total(items, 'gasto');
  const rend = rendimiento(data), ckm = costoPorKm(data, y, m);
  const avisos = ordenAvisos(data, today()).slice(0, 3);
  view.innerHTML = `
    <section class="card"><div class="eyebrow">${MESES[m]} · gasto del mes</div>
      <div class="big">${money(c + s + g)}</div>
      ${c + s + g > 0 ? `<div class="split"><i style="flex:${c};background:var(--hueso)"></i><i style="flex:${s};background:var(--gris-texto)"></i><i style="flex:${g};background:#6B6B78"></i></div>
      <div class="legend"><span><em style="background:var(--hueso)"></em>Combustible ${money(c)}</span><span><em style="background:var(--gris-texto)"></em>Servicio ${money(s)}</span><span><em style="background:#6B6B78"></em>Gastos ${money(g)}</span></div>`
      : '<p class="sub">Aún no hay movimientos este mes.</p>'}
    </section>
    <div class="tiles">
      <div class="tile"><div class="eyebrow">Rendimiento</div><div class="v">${rend ? num(rend, 1) : '—'}<small>km/l</small></div></div>
      <div class="tile"><div class="eyebrow">Costo por km</div><div class="v">${ckm ? money(Math.round(ckm * 100) / 100) : '—'}</div></div>
    </div>
    <div class="h2"><h2>Avisos</h2><a href="#/avisos">Ver todos</a></div>
    ${avisos.length ? `<div class="lista">${avisos.map(filaAviso).join('')}</div>`
      : '<div class="lista"><button type="button" class="fila" data-act="nuevo-aviso"><span class="n">Crea tu primer aviso<small>Aceite, verificación, seguro…</small></span>' + icon('right') + '</button></div>'}`;
}

function renderAvisos() {
  top.innerHTML = `<h1>Avisos</h1><button type="button" class="pill" data-act="nuevo-aviso">+ Nuevo</button>`;
  const lista = ordenAvisos(data, today());
  const odo = odometro(data);
  const sub = `<p class="sub">Te aviso antes de que se te pase.${odo ? ` Odómetro: <b class="mono" style="color:var(--hueso)">${num(odo)} km</b>` : ' Anota tu odómetro al registrar para avisarte por kilómetros.'}</p>`;
  if (!lista.length) {
    view.innerHTML = sub + `<section class="vacio"><div class="luz-grande">${icon('bell', 28)}</div><strong>Sin avisos todavía</strong><p>Elige uno de los comunes y pon cada cuánto toca.</p><button type="button" class="btn inline" data-act="nuevo-aviso">Crear un aviso</button></section>`;
    return;
  }
  view.innerHTML = sub + `<div style="margin-top:18px">${lista.map(({ r, est }) => `
    <button type="button" class="aviso" data-act="aviso" data-id="${esc(r.id)}">
      <span class="cab"><span>${luz(est.sev)}<span>${esc(r.title)}</span></span><span class="dato t${est.sev}">${est.corto}</span></span>
      <div class="det">${esc(est.sub)}</div>
      <div class="barra"><i class="s${est.sev}" style="width:${Math.round(est.pct * 100)}%"></i></div>
    </button>`).join('')}</div>`;
}

const GLIFO = { combustible: 'fuel', servicio: 'wrench', gasto: 'card' };
function filaMovimiento(e) {
  const d = new Date(e.date + 'T00:00:00');
  const titulo = e.type === 'combustible' ? 'Combustible' : (e.title || TIPOS[e.type]);
  const sub = e.type === 'combustible'
    ? [e.liters ? `${num(e.liters, 1)} L` : '', e.odo ? `${num(e.odo)} km` : ''].filter(Boolean).join(' · ')
    : [e.odo ? `${num(e.odo)} km` : '', e.note || ''].filter(Boolean).join(' · ') || TIPOS[e.type];
  return `<button type="button" class="fila" data-act="editar" data-id="${esc(e.id)}">
    <span class="fecha"><b>${String(d.getDate()).padStart(2, '0')}</b><small>${fdate(e.date).split(' ')[1]}</small></span>
    <span class="glifo ${e.type}">${icon(GLIFO[e.type])}</span>
    <span class="n">${esc(titulo)}<small>${esc(sub)}</small></span><span class="v">${money(e.amount)}</span></button>`;
}

const lista = () => data.entries
  .filter((e) => state.filtro === 'todo' || e.type === state.filtro)
  .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));

function renderHistorial() {
  top.innerHTML = `<h1>Historial</h1><button type="button" class="icon-btn" data-act="compartir" aria-label="Compartir el mes">${icon('share', 20)}</button>`;
  const chips = [['todo', 'Todo'], ['combustible', 'Combustible'], ['servicio', 'Servicio'], ['gasto', 'Gasto']]
    .map(([k, l]) => `<button type="button" class="chip" data-act="filtro" data-v="${k}" aria-pressed="${state.filtro === k}">${l}</button>`).join('');
  const items = lista();
  const meses = [...new Set(items.map((e) => ym(e.date)))];
  view.innerHTML = `<div class="chips">${chips}</div>` + (items.length ? meses.map((k) => {
    const del = items.filter((e) => ym(e.date) === k);
    const [yy, mm] = k.split('-').map(Number);
    return `<div class="mes"><span class="eyebrow">${MESES[mm - 1]} ${yy}</span><span class="tot">${money(total(del))}</span></div>
      <div class="lista">${del.map(filaMovimiento).join('')}</div>`;
  }).join('') : `<section class="vacio"><div class="luz-grande">${icon('list', 28)}</div><strong>Nada por aquí</strong><p>Lo que registres con el + aparece en esta lista.</p><button type="button" class="btn inline" data-act="registrar">Registrar</button></section>`);
}

function renderYo() {
  top.innerHTML = '<h1>Yo</h1>';
  view.innerHTML = `
    <div class="campos">
      <label class="campo ancho"><span>Nombre de tu auto</span><input type="text" id="v-name" value="${esc(data.vehicle.name)}" maxlength="30" autocomplete="off"></label>
      <label class="campo ancho"><span>Odómetro actual (km)</span><input type="number" id="v-odo" inputmode="numeric" min="0" value="${data.vehicle.odo || ''}" placeholder="${odometro(data) || '0'}"></label>
    </div>
    <p class="sub">Si dejas el odómetro vacío, uso el más alto que hayas anotado.</p>
    <div class="h2"><h2>Copia de mis datos</h2></div>
    <div class="lista">
      <button type="button" class="fila" data-act="exportar">${icon('download')}<span class="n">Descargar copia<small>Archivo JSON con todo</small></span></button>
      <label class="fila" style="cursor:pointer">${icon('upload')}<span class="n">Cargar una copia<small>Suma lo del archivo a lo que ya tienes</small></span><input type="file" id="v-file" accept="application/json,.json" hidden></label>
    </div>
    <p class="sub">Tus datos viven solo en este teléfono. Si lo cambias o borras la app, descarga una copia antes.</p>
    <div class="acciones"><button type="button" class="btn soft danger" data-act="borrar-todo">Borrar todos mis datos</button></div>
    <p class="pie"><span class="firma"><i><b style="background:var(--al-dia)"></b><b style="background:var(--pronto)"></b><b style="background:var(--vencido)"></b></i>Garaje · de la familia Checa</span></p>`;
}

function render() {
  const r = route();
  document.querySelectorAll('.tab').forEach((t) => (t.dataset.tab === r ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
  ({ inicio: renderInicio, avisos: renderAvisos, historial: renderHistorial, yo: renderYo })[r]();
}

/* ---------- Hojas ---------- */
function openSheet(html) {
  sheet.innerHTML = `<div class="sheet">${html}</div>`;
  if (!sheet.open) sheet.showModal();
}
const closeSheet = () => { if (sheet.open) sheet.close(); };
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
const cabecera = (t) => `<div class="sheet-h"><button type="button" class="icon-btn" data-act="cerrar" aria-label="Cerrar">${icon('close', 22)}</button><h2>${t}</h2><span style="width:44px"></span></div>`;

const SUG = {
  servicio: ['Aceite y filtro', 'Frenos', 'Rotación de llantas', 'Afinación', 'Batería', 'Alineación y balanceo', 'Suspensión'],
  gasto: ['Seguro', 'Verificación', 'Tenencia', 'Estacionamiento', 'Lavado', 'Multa', 'Peaje'],
};

function registrar(entry) {
  const editing = !!entry;
  const d = entry ? { ...entry } : { type: 'combustible', date: today(), full: true };
  const draw = () => {
    const t = d.type;
    openSheet(`${cabecera(editing ? 'Editar' : 'Registrar')}
      <div class="seg">${Object.entries(TIPOS).map(([k, l]) => `<button type="button" data-tipo="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div>
      <form id="f" novalidate>
        <label class="monto"><span class="eyebrow">¿Cuánto pagaste?</span><input name="amount" type="number" step="0.01" min="0" inputmode="decimal" placeholder="$0" value="${d.amount ?? ''}" aria-label="Monto pagado"></label>
        <div class="campos">
          ${t === 'combustible' ? `
            <label class="campo"><span>Litros</span><input name="liters" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0" value="${d.liters ?? ''}"></label>
            <label class="campo"><span>Odómetro (km)</span><input name="odo" type="number" min="0" inputmode="numeric" placeholder="${odometro(data) || '0'}" value="${d.odo ?? ''}"></label>`
          : `<label class="campo ancho"><span>¿Qué fue?</span><input name="title" type="text" list="sug" autocomplete="off" placeholder="${t === 'servicio' ? 'Ej. Aceite y filtro' : 'Ej. Seguro'}" value="${esc(d.title || '')}"></label>
            <datalist id="sug">${SUG[t].map((s) => `<option value="${esc(s)}"></option>`).join('')}</datalist>
            <label class="campo"><span>Odómetro (km)</span><input name="odo" type="number" min="0" inputmode="numeric" placeholder="${odometro(data) || '0'}" value="${d.odo ?? ''}"></label>
            <label class="campo"><span>Nota (opcional)</span><input name="note" type="text" autocomplete="off" placeholder="Taller…" value="${esc(d.note || '')}"></label>`}
          <label class="campo ancho"><span>Fecha</span><input name="date" type="date" value="${esc(d.date)}"></label>
        </div>
        ${t === 'combustible' ? `<label class="interruptor"><span><b>Llené el tanque</b><small>Así calculo tu rendimiento</small></span><input type="checkbox" name="full" role="switch" ${d.full ? 'checked' : ''}></label>` : ''}
        <p class="nota" id="nota"></p><p class="error" id="err" role="alert"></p>
        <div class="acciones"><button class="btn">${editing ? 'Guardar cambios' : 'Guardar'}</button>${editing ? '<button type="button" class="btn soft danger" data-del>Eliminar</button>' : ''}</div>
      </form>`);
    const f = $('#f', sheet);
    $$tipo(f);
    f.oninput = () => { leer(f); nota(); };
    f.onsubmit = (ev) => { ev.preventDefault(); guardar(f); };
    const del = $('[data-del]', f);
    if (del) del.onclick = () => eliminar(entry);
    nota();
  };
  const $$tipo = () => sheet.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => {
    if (b.dataset.tipo !== d.type) { leer($('#f', sheet)); d.type = b.dataset.tipo; draw(); }
  }));
  const leer = (f) => {
    const g = (n) => f.elements[n];
    d.amount = numOrNull(g('amount').value);
    d.date = g('date').value || today();
    d.odo = g('odo') ? numOrNull(g('odo').value) : d.odo;
    if (g('liters')) d.liters = numOrNull(g('liters').value);
    if (g('full')) d.full = g('full').checked;
    if (g('title')) d.title = g('title').value.trim();
    if (g('note')) d.note = g('note').value.trim();
  };
  const nota = () => {
    const el = $('#nota', sheet);
    if (!el || d.type !== 'combustible') { if (el) el.innerHTML = ''; return; }
    const ppl = d.amount > 0 && d.liters > 0 ? d.amount / d.liters : null;
    const rend = rendimientoDe(data, { ...d, id: d.id });
    el.innerHTML = [ppl ? `Precio por litro: <b>${money(Math.round(ppl * 100) / 100)}</b>` : '', rend ? `Rendimiento de esta carga: <b class="ok">${num(rend, 1)} km/l</b>` : ''].filter(Boolean).join(' · ');
  };
  const eliminar = (e) => {
    const copia = structuredClone(data);
    data.entries = data.entries.filter((x) => x.id !== e.id);
    save(); closeSheet(); render();
    toast('Registro eliminado', { label: 'Deshacer', fn: () => { data = copia; save(); render(); } });
  };
  const guardar = (f) => {
    leer(f);
    if (!(d.amount > 0)) { $('#err', sheet).textContent = 'Escribe cuánto pagaste.'; f.elements.amount.focus(); return; }
    const e = { id: d.id || uid(), type: d.type, date: d.date, amount: d.amount, createdAt: d.createdAt || Date.now() };
    if (d.type === 'combustible') Object.assign(e, { liters: d.liters || null, odo: d.odo || null, full: !!d.full });
    else Object.assign(e, { title: d.title || TIPOS[d.type], odo: d.odo || null, note: d.note || '' });
    const copia = structuredClone(data);
    if (editing) data.entries = data.entries.map((x) => (x.id === e.id ? e : x)); else data.entries.push(e);
    const aviso = e.type !== 'combustible' ? ponerAlDia(data, e, odometro(data), e.date) : null;
    save(); closeSheet(); render();
    toast(aviso ? `Guardado · aviso «${aviso.title}» al día` : (editing ? 'Cambios guardados' : 'Guardado'), { label: 'Deshacer', fn: () => { data = copia; save(); render(); } });
  };
  draw();
}

function avisoForm(r, preset) {
  const editing = !!r;
  const a = r || { title: preset?.title || '', everyKm: preset?.everyKm || '', everyMonths: preset?.everyMonths || '', lastKm: odometro(data) || '', lastDate: today(), dueDate: '' };
  openSheet(`${cabecera(editing ? 'Editar aviso' : 'Nuevo aviso')}
    <form id="f" novalidate>
      <div class="campos">
        <label class="campo ancho"><span>¿Qué te aviso?</span><input name="title" type="text" autocomplete="off" placeholder="Ej. Aceite y filtro" value="${esc(a.title)}"></label>
        <label class="campo"><span>Cada (km)</span><input name="everyKm" type="number" min="0" inputmode="numeric" placeholder="10000" value="${a.everyKm || ''}"></label>
        <label class="campo"><span>Cada (meses)</span><input name="everyMonths" type="number" min="0" inputmode="numeric" placeholder="6" value="${a.everyMonths || ''}"></label>
        <label class="campo"><span>Última vez (km)</span><input name="lastKm" type="number" min="0" inputmode="numeric" placeholder="0" value="${a.lastKm ?? ''}"></label>
        <label class="campo"><span>Última vez (fecha)</span><input name="lastDate" type="date" value="${esc(a.lastDate || '')}"></label>
        <label class="campo ancho"><span>Vence el (opcional)</span><input name="dueDate" type="date" value="${esc(a.dueDate || '')}"></label>
      </div>
      <p class="sub">Pon cada cuántos km o meses toca, o la fecha en que vence.</p>
      <p class="error" id="err" role="alert"></p>
      <div class="acciones"><button class="btn">${editing ? 'Guardar cambios' : 'Crear aviso'}</button>${editing ? '<button type="button" class="btn soft danger" data-del>Eliminar</button>' : ''}</div>
    </form>`);
  const f = $('#f', sheet);
  f.onsubmit = (ev) => {
    ev.preventDefault();
    const g = (n) => f.elements[n].value;
    const x = { id: a.id || uid(), title: g('title').trim(), everyKm: numOrNull(g('everyKm')) || null, everyMonths: numOrNull(g('everyMonths')) || null, lastKm: numOrNull(g('lastKm')) || 0, lastDate: g('lastDate') || '', dueDate: g('dueDate') || '' };
    if (!x.title) { $('#err', sheet).textContent = 'Ponle un nombre al aviso.'; return; }
    if (!x.everyKm && !x.everyMonths && !x.dueDate) { $('#err', sheet).textContent = 'Dime cada cuántos km o meses toca, o la fecha en que vence.'; return; }
    if (editing) data.reminders = data.reminders.map((y) => (y.id === x.id ? x : y)); else data.reminders.push(x);
    save(); closeSheet(); render(); toast(editing ? 'Aviso actualizado' : 'Aviso creado');
  };
  const del = $('[data-del]', f);
  if (del) del.onclick = () => {
    const copia = structuredClone(data);
    data.reminders = data.reminders.filter((y) => y.id !== r.id);
    save(); closeSheet(); render();
    toast('Aviso eliminado', { label: 'Deshacer', fn: () => { data = copia; save(); render(); } });
  };
}

function nuevoAviso() {
  const libres = PRESETS.filter((p) => !data.reminders.some((r) => fold(r.title) === fold(p.title)));
  openSheet(`${cabecera('Nuevo aviso')}
    <p class="sub">Elige uno común o crea el tuyo.</p>
    <div class="lista" style="margin-top:14px">${libres.map((p, i) => `<button type="button" class="fila" data-act="preset" data-i="${PRESETS.indexOf(p)}"><span class="n">${esc(p.title)}<small>${[p.everyKm ? `cada ${num(p.everyKm)} km` : '', p.everyMonths ? `cada ${p.everyMonths === 12 ? 'año' : `${p.everyMonths} meses`}` : ''].filter(Boolean).join(' · ')}</small></span>${icon('right')}</button>`).join('')}
      <button type="button" class="fila" data-act="aviso-libre"><span class="n">Otro aviso<small>Tú pones qué y cada cuánto</small></span>${icon('plus')}</button></div>`);
}

function avisoDetalle(id) {
  const r = data.reminders.find((x) => x.id === id);
  if (!r) return;
  const est = estadoAviso(r, odometro(data), today());
  openSheet(`${cabecera(esc(r.title))}
    <div class="aviso" style="margin-top:14px"><span class="cab"><span>${luz(est.sev)}<span>${est.sev === 2 ? 'Vencido' : est.sev === 1 ? 'Pronto' : 'Al día'}</span></span><span class="dato t${est.sev}">${est.corto}</span></span>
      <div class="det">${esc(est.sub)}</div><div class="barra"><i class="s${est.sev}" style="width:${Math.round(est.pct * 100)}%"></i></div></div>
    <div class="acciones"><button type="button" class="btn" data-act="hecho" data-id="${esc(r.id)}">Ya lo hice</button>
    <button type="button" class="btn soft" data-act="editar-aviso" data-id="${esc(r.id)}">Editar</button></div>`);
}

function yaLoHice(id) {
  const r = data.reminders.find((x) => x.id === id);
  if (!r) return;
  if (r.dueDate && !(+r.everyMonths > 0)) { r.dueDate = ''; avisoForm(r); $('#err', sheet).textContent = 'Pon la nueva fecha en «Vence el».'; return; }
  const copia = structuredClone(data);
  r.lastKm = odometro(data); r.lastDate = today();
  if (+r.everyMonths > 0) r.dueDate = '';
  save(); closeSheet(); render();
  toast(`«${r.title}» al día`, { label: 'Deshacer', fn: () => { data = copia; save(); render(); } });
}

/* ---------- Compartir, copias y borrado ---------- */
async function compartir() {
  const { y, m } = ahora();
  const items = delMes(data, y, m).sort((a, b) => a.date.localeCompare(b.date));
  const texto = [`Garaje · ${MESES[m]} ${y}`, `Gasto del mes: ${money(total(items))}`, '',
    ...items.map((e) => `• ${fdate(e.date)} · ${e.type === 'combustible' ? 'Combustible' : e.title} — ${money(e.amount)}`)].join('\n');
  try {
    if (navigator.share) await navigator.share({ title: `Garaje · ${MESES[m]}`, text: texto });
    else { await navigator.clipboard.writeText(texto); toast('Resumen copiado'); }
  } catch (e) { if (e.name !== 'AbortError') toast('No se pudo compartir'); }
}

function exportar() {
  const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `garaje-${today()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Copia descargada');
}

async function importar(file) {
  try {
    const d = JSON.parse(await file.text());
    if (d.app !== 'garaje') throw new Error();
    const copia = structuredClone(data);
    for (const k of ['entries', 'reminders']) {
      const m = new Map(data[k].map((x) => [x.id, x]));
      for (const x of d[k] || []) m.set(x.id, x);
      data[k] = [...m.values()];
    }
    if (d.vehicle) data.vehicle = { ...data.vehicle, ...d.vehicle };
    save(); render();
    toast('Copia cargada', { label: 'Deshacer', fn: () => { data = copia; save(); render(); } });
  } catch { toast('Ese archivo no es una copia de Garaje'); }
}

/* ---------- Eventos ---------- */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const id = t.dataset.id;
  switch (t.dataset.act) {
    case 'registrar': registrar(); break;
    case 'nuevo-aviso': nuevoAviso(); break;
    case 'preset': avisoForm(null, PRESETS[+t.dataset.i]); break;
    case 'aviso-libre': avisoForm(); break;
    case 'aviso': avisoDetalle(id); break;
    case 'editar-aviso': avisoForm(data.reminders.find((x) => x.id === id)); break;
    case 'hecho': yaLoHice(id); break;
    case 'editar': registrar(data.entries.find((x) => x.id === id)); break;
    case 'filtro': state.filtro = t.dataset.v; render(); break;
    case 'compartir': compartir(); break;
    case 'exportar': exportar(); break;
    case 'cerrar': closeSheet(); break;
    case 'borrar-todo':
      if (confirm('Esto borra todos tus registros y avisos de este teléfono. ¿Seguro?')) {
        const copia = structuredClone(data);
        data = structuredClone(DEFAULTS); save(); render();
        toast('Datos borrados', { label: 'Deshacer', fn: () => { data = copia; save(); render(); } });
      }
      break;
  }
});
$('#mas').addEventListener('click', () => registrar());
document.addEventListener('change', (ev) => {
  if (ev.target.id === 'v-name') { data.vehicle.name = ev.target.value.trim() || 'Mi auto'; save(); toast('Guardado'); }
  else if (ev.target.id === 'v-odo') { data.vehicle.odo = numOrNull(ev.target.value) || 0; save(); toast('Guardado'); }
  else if (ev.target.id === 'v-file' && ev.target.files[0]) { importar(ev.target.files[0]); ev.target.value = ''; }
});
addEventListener('hashchange', () => { closeSheet(); render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });

render();
