import { apiFetch } from '@/api/http';
import { setAuthToken, type User } from '@/utils/auth';

export interface AuthResponse {
  user: User;
  token: string;
}

export async function registerUser(email: string, password: string, name: string): Promise<User | null> {
  const result = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  setAuthToken(result.user, result.token);
  return result.user;
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const result = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(result.user, result.token);
  return result.user;
}

export async function getCurrentUserFromApi(): Promise<User> {
  return apiFetch<{ user: User }>('/auth/me').then((body) => body.user);
}
