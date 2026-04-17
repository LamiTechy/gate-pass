import { apiFetch } from '@/api/http';

export interface Event {
  id: string;
  host_id: string;
  name: string;
  description?: string;
  date: number;
  location?: string;
  max_guests?: number;
  allow_plus_one: boolean;
  plus_one_limit: number;
  registration_open: boolean;
  created_at: number;
}

export interface CreateEventData {
  name: string;
  description?: string;
  date: number;
  location?: string;
  max_guests?: number;
  allow_plus_one?: boolean;
  plus_one_limit?: number;
}

export async function createEvent(data: CreateEventData): Promise<Event> {
  return apiFetch<Event>('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getEventById(id: string): Promise<Event | null> {
  return apiFetch<Event>(`/events/${id}`);
}

export async function getEventsByHost(): Promise<Event[]> {
  return apiFetch<Event[]>('/events');
}

export async function updateEvent(id: string, data: Partial<CreateEventData & { registration_open?: boolean }>): Promise<Event> {
  return apiFetch<Event>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleRegistration(id: string, open: boolean): Promise<Event> {
  return updateEvent(id, { registration_open: open });
}

export async function deleteEvent(id: string): Promise<void> {
  await apiFetch(`/events/${id}`, {
    method: 'DELETE',
  });
}

export async function getEventStats(eventId: string): Promise<{
  totalGuests: number;
  checkedIn: number;
  validPasses: number;
  usedPasses: number;
  revokedPasses: number;
}> {
  return apiFetch(`/events/${eventId}/stats`);
}
