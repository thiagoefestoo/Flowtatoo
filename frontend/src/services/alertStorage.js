const STORAGE_KEY = 'flowtatoo.read-alerts.v1';
const CHANGE_EVENT = 'flowtatoo:alerts-changed';

function safeParse(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function getReadAlertIds() {
  return new Set(safeParse(localStorage.getItem(STORAGE_KEY)));
}

function saveReadAlertIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-1000)));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function markAlertRead(alertId) {
  const ids = getReadAlertIds();
  ids.add(alertId);
  saveReadAlertIds(ids);
}

export function markAlertUnread(alertId) {
  const ids = getReadAlertIds();
  ids.delete(alertId);
  saveReadAlertIds(ids);
}

export function markAlertsRead(alertIds = []) {
  const ids = getReadAlertIds();
  alertIds.forEach((alertId) => ids.add(alertId));
  saveReadAlertIds(ids);
}

export function isAlertRead(alertId) {
  return getReadAlertIds().has(alertId);
}

export function subscribeToAlertChanges(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
