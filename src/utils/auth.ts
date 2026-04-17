const TOKEN_KEY = 'gatepass_auth_token';
const USER_KEY = 'gatepass_user';

export interface User {
  id: string;
  email: string;
  name: string;
}

export function setAuthToken(user: User, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getCurrentUser();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
