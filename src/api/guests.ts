import { apiFetch } from '@/api/http';

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  qr_token: string;
  status: 'valid' | 'used' | 'revoked';
  plus_one_count: number;
  entries_used: number;
  created_at: number;
  first_used_at?: number;
}

export interface CreateGuestData {
  name: string;
  email?: string;
  plus_one_count?: number;
}

export interface EntryLog {
  id: string;
  guest_id: string;
  guest_name: string;
  guest_email?: string | null;
  event_id: string;
  scanned_at: number;
  status: string;
  entries_count: number;
}

export interface VerificationResult {
  success: boolean;
  guest?: Guest;
  eventName?: string;
  message: string;
  entriesAllowed?: number;
  entriesUsed?: number;
  firstUse?: boolean;
}

export async function registerGuest(eventId: string, data: CreateGuestData): Promise<{ guest: Guest; qrUrl: string }> {
  return apiFetch(`/events/${eventId}/guests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getGuestsByEvent(eventId: string): Promise<Guest[]> {
  return apiFetch<Guest[]>(`/events/${eventId}/guests`);
}

export async function getEntryLogs(eventId: string): Promise<EntryLog[]> {
  return apiFetch<EntryLog[]>(`/events/${eventId}/logs`);
}

export async function verifyGuest(token: string): Promise<VerificationResult> {
  return apiFetch<VerificationResult>('/guests/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function revokeGuestPass(guestId: string): Promise<void> {
  await apiFetch(`/guests/${guestId}/revoke`, {
    method: 'POST',
  });
}

export async function restoreGuestPass(guestId: string): Promise<void> {
  await apiFetch(`/guests/${guestId}/restore`, {
    method: 'POST',
  });
}
