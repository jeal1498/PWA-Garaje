// Persistencia local de Garaje: todo vive en este teléfono (localStorage, clave «garaje»).
export const KEY = 'garaje';

export const DEFAULTS = {
  app: 'garaje',
  vehicle: { name: 'Mi auto', odo: 0 },
  entries: [], // {id, type: combustible|servicio|gasto, date, amount, title, odo, liters, full, note}
  reminders: [], // {id, title, everyKm, everyMonths, lastKm, lastDate, dueDate}
};

export function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && typeof d === 'object') {
      return {
        ...structuredClone(DEFAULTS),
        ...d,
        vehicle: { ...DEFAULTS.vehicle, ...d.vehicle },
        entries: Array.isArray(d.entries) ? d.entries : [],
        reminders: Array.isArray(d.reminders) ? d.reminders : [],
      };
    }
  } catch { /* datos dañados: se empieza vacío */ }
  return structuredClone(DEFAULTS);
}

export function saveData(data, onError = () => {}) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { onError(); }
}
