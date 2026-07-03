export function getToken() {
  return localStorage.getItem('flowcrmToken');
}

export function getLoggedUser() {
  try {
    const user = localStorage.getItem('flowcrmUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
}

export function saveSession({ token, user }) {
  if (token) {
    localStorage.setItem('flowcrmToken', token);
  }

  if (user) {
    localStorage.setItem('flowcrmUser', JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem('flowcrmToken');
  localStorage.removeItem('flowcrmUser');
}

export function isAuthenticated() {
  return Boolean(getToken());
}