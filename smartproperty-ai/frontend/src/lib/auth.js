// Simple client-side auth state helper for SmartProperty AI

const AUTH_KEY = 'smartproperty_active_user';

export function getActiveUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setActiveUser(user) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

