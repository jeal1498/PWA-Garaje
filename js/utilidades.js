// Utilidades de Garaje: fechas, dinero, texto. Todo puro, sin pantalla.
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('es-MX', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};
export const num = (n, d = 0) => Number(n).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
export const plural = (n, uno, varios) => `${num(n)} ${n === 1 ? uno : varios}`;

export const toISO = (d) => d.toLocaleDateString('en-CA');
export const today = () => toISO(new Date());
export const parse = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const addMonths = (s, n) => {
  const d = parse(s), day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toISO(d);
};
export const fdate = (s) => { const d = parse(s); return `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`; };
export const fdateFull = (s) => { const d = parse(s); return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`; };
export const ym = (s) => String(s).slice(0, 7);

/* Para comparar nombres: sin acentos ni mayúsculas. */
export const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const numOrNull = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return Number.isFinite(n) ? n : null; };
