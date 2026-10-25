// Cálculos de Garaje: odómetro, rendimiento, costo por km y estado de los avisos. Puro, sin pantalla.
import { addMonths, daysBetween, fdate, fold, parse, plural, num, ym } from './utilidades.js';

export const TIPOS = { combustible: 'Combustible', servicio: 'Servicio', gasto: 'Gasto' };

export const odometro = (data) => Math.max(+data.vehicle.odo || 0, ...data.entries.map((e) => +e.odo || 0));

export const delMes = (data, year, month) => {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  return data.entries.filter((e) => ym(e.date) === key);
};

export const total = (items, type) => items.filter((e) => !type || e.type === type).reduce((t, e) => t + (+e.amount || 0), 0);

/* Rendimiento por tanque lleno: km entre dos llenados ÷ litros cargados desde el primero (incluido el segundo). */
function tramo(cargas, a, b) {
  const litros = cargas.filter((e) => e.odo > a.odo && e.odo <= b.odo).reduce((t, e) => t + e.liters, 0);
  return b.odo > a.odo && litros > 0 ? { km: b.odo - a.odo, litros } : null;
}
const cargasConDatos = (data, sin) => data.entries
  .filter((e) => e.type === 'combustible' && e.id !== sin && e.odo > 0 && e.liters > 0)
  .sort((a, b) => a.odo - b.odo);

export function rendimiento(data) {
  const cargas = cargasConDatos(data);
  const llenos = cargas.filter((e) => e.full);
  let km = 0, litros = 0;
  for (let i = 1; i < llenos.length; i++) {
    const t = tramo(cargas, llenos[i - 1], llenos[i]);
    if (t) { km += t.km; litros += t.litros; }
  }
  return litros > 0 ? km / litros : null;
}

/* Rendimiento de una carga que aún no se guarda (o que se edita): vs. el tanque lleno anterior. */
export function rendimientoDe(data, e) {
  if (!(e.full && e.odo > 0 && e.liters > 0)) return null;
  const cargas = cargasConDatos(data, e.id).concat([{ ...e, odo: +e.odo, liters: +e.liters }]).sort((a, b) => a.odo - b.odo);
  const antes = cargas.filter((c) => c.full && c.odo < +e.odo).pop();
  if (!antes) return null;
  const t = tramo(cargas, antes, { ...e, odo: +e.odo });
  return t ? t.km / t.litros : null;
}

/* Costo por km del mes: gasto del mes ÷ km recorridos según los odómetros anotados ese mes. */
export function costoPorKm(data, year, month) {
  const items = delMes(data, year, month);
  const odos = items.map((e) => +e.odo).filter((o) => o > 0);
  if (odos.length < 2) return null;
  const km = Math.max(...odos) - Math.min(...odos);
  return km > 0 ? total(items) / km : null;
}

/* ----- Avisos ----- */
export const PRESETS = [
  { title: 'Aceite y filtro', everyKm: 10000, everyMonths: 12 },
  { title: 'Verificación', everyMonths: 6 },
  { title: 'Seguro', everyMonths: 12 },
  { title: 'Rotación de llantas', everyKm: 10000 },
  { title: 'Frenos', everyKm: 30000 },
  { title: 'Tenencia', everyMonths: 12 },
  { title: 'Afinación', everyKm: 20000, everyMonths: 12 },
  { title: 'Batería', everyMonths: 36 },
];

/* sev: 0 al día, 1 pronto, 2 vencido. Se queda con lo peor entre los kilómetros y la fecha. */
export function estadoAviso(r, odo, hoy) {
  const cand = [];
  if (+r.everyKm > 0) {
    const falta = (+r.lastKm || 0) + +r.everyKm - odo;
    cand.push({
      sev: falta <= 0 ? 2 : falta <= Math.max(300, r.everyKm * 0.1) ? 1 : 0,
      pct: Math.min(1, Math.max(0, 1 - falta / r.everyKm)),
      corto: falta <= 0 ? `${num(-falta)} KM PASADO` : `${num(falta)} KM`,
      sub: `Toca a los ${num((+r.lastKm || 0) + +r.everyKm)} km · cada ${num(r.everyKm)} km`,
      orden: falta / r.everyKm,
    });
  }
  const sig = r.dueDate || (+r.everyMonths > 0 && r.lastDate ? addMonths(r.lastDate, +r.everyMonths) : null);
  if (sig) {
    const dias = daysBetween(hoy, sig);
    const ventana = r.lastDate ? Math.max(30, daysBetween(r.lastDate, sig)) : 365;
    cand.push({
      sev: dias < 0 ? 2 : dias <= 30 ? 1 : 0,
      pct: Math.min(1, Math.max(0, 1 - dias / ventana)),
      corto: dias < 0 ? `${plural(-dias, 'DÍA', 'DÍAS')} PASADO` : dias === 0 ? 'HOY' : plural(dias, 'DÍA', 'DÍAS'),
      sub: `${dias < 0 ? 'Venció' : 'Vence'} el ${fdate(sig)}${+r.everyMonths > 0 ? ` · cada ${+r.everyMonths === 12 ? 'año' : `${r.everyMonths} meses`}` : ''}`,
      orden: dias / ventana,
    });
  }
  if (!cand.length) return { sev: 0, pct: 0, corto: 'SIN FECHA', sub: 'Agrega cada cuántos km o meses', orden: Infinity };
  return cand.sort((a, b) => b.sev - a.sev || b.pct - a.pct)[0];
}

export const ordenAvisos = (data, hoy) => {
  const odo = odometro(data);
  return data.reminders
    .map((r) => ({ r, est: estadoAviso(r, odo, hoy) }))
    .sort((a, b) => b.est.sev - a.est.sev || a.est.orden - b.est.orden);
};

/* Al guardar un servicio o gasto con el nombre de un aviso, ese aviso se pone al día. */
export function ponerAlDia(data, entry, odo, hoy) {
  const nombre = fold(entry.title);
  const r = nombre && data.reminders.find((x) => fold(x.title) === nombre);
  if (!r) return null;
  r.lastKm = +entry.odo > 0 ? +entry.odo : odo;
  r.lastDate = entry.date || hoy;
  if (r.dueDate && +r.everyMonths > 0) r.dueDate = null;
  return r;
}

export { parse };
