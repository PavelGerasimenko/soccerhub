export type EventType = 'game' | 'tournament' | 'league';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type ParticipationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  location: string;
  city: string;
  start_time: Date;
  end_time: Date;
  field_id?: string;
  host_id: string;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  skill_level?: string;
  surface_type?: string;
  price: number;
  status: EventStatus;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Participation {
  id: string;
  user_id: string;
  event_id: string;
  status: ParticipationStatus;
  preferred_position?: string;
  team_assignment?: string;
  joined_at: Date;
  updated_at: Date;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  location: string;
  city: string;
  start_time: Date;
  end_time: Date;
  min_participants?: number;
  max_participants: number;
  skill_level?: string;
  surface_type?: string;
  price?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  city?: string;
  start_time?: Date;
  end_time?: Date;
  min_participants?: number;
  max_participants?: number;
  skill_level?: string;
  surface_type?: string;
  price?: number;
  status?: EventStatus;
}

export interface EventFilters {
  city?: string;
  type?: EventType;
  skill_level?: string;
  surface_type?: string;
  start_date?: Date;
  end_date?: Date;
  min_price?: number;
  max_price?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'soonest' | 'price_low' | 'price_high';
}

export interface EventResponse extends Event {
  participants_list?: { user_id: string; status: ParticipationStatus }[];
  host?: { id: string; first_name: string; last_name: string; rating: number };
}
