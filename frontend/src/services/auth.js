const TOKEN_KEY = 'flowtatooToken';
const USER_KEY = 'flowtatooUser';
const LEGACY_TOKEN_KEY = 'flowcrmToken';
const LEGACY_USER_KEY = 'flowcrmUser';

function migrateLegacySession() {
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  const legacyUser = localStorage.getItem(LEGACY_USER_KEY);

  if (!localStorage.getItem(TOKEN_KEY) && legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
  }

  if (!localStorage.getItem(USER_KEY) && legacyUser) {
    localStorage.setItem(USER_KEY, legacyUser);
  }

  if (legacyToken || legacyUser) {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  }
}

export function getToken() {
  migrateLegacySession();
  return localStorage.getItem(TOKEN_KEY);
}

export function getLoggedUser() {
  migrateLegacySession();

  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
}

export function saveSession({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
