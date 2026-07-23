import EventRepository from './event.repository';
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
  Participation,
} from '../../types/event.interface';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

export class EventService {
  async createEvent(hostId: string, data: CreateEventRequest): Promise<Event> {
    if (data.end_time <= data.start_time) {
      throw new ValidationError('End time must be after start time');
    }

    const event = await EventRepository.createEvent(
      hostId,
      data.title,
      data.type,
      data.location,
      data.city,
      data.start_time,
      data.end_time,
      data.max_participants,
      {
        description: data.description,
        min_participants: data.min_participants,
        skill_level: data.skill_level,
        surface_type: data.surface_type,
        price: data.price,
      },
    );

    return event;
  }

  async getEventById(id: string): Promise<Event> {
    const event = await EventRepository.getEventById(id);

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  async listEvents(filters: EventFilters): Promise<{ events: Event[]; total: number; page: number; pages: number }> {
    const result = await EventRepository.listEvents(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const pages = Math.ceil(result.total / limit);

    return {
      events: result.events,
      total: result.total,
      page,
      pages,
    };
  }

  async updateEvent(id: string, hostId: string, data: UpdateEventRequest): Promise<Event> {
    const event = await this.getEventById(id);

    if (event.host_id !== hostId) {
      throw new ValidationError('Only event host can update event');
    }

    if (data.end_time && data.start_time && data.end_time <= data.start_time) {
      throw new ValidationError('End time must be after start time');
    }

    const updated = await EventRepository.updateEvent(id, data);
    return updated;
  }

  async deleteEvent(id: string, hostId: string): Promise<void> {
    const event = await this.getEventById(id);

    if (event.host_id !== hostId) {
      throw new ValidationError('Only event host can delete event');
    }

    await EventRepository.deleteEvent(id);
  }

  async joinEvent(userId: string, eventId: string, preferredPosition?: string): Promise<Participation> {
    const event = await this.getEventById(eventId);

    const isParticipant = await EventRepository.isParticipant(userId, eventId);
    if (isParticipant) {
      throw new ConflictError('User already joined this event');
    }

    if (event.current_participants >= event.max_participants) {
      throw new ConflictError('Event is full');
    }

    const participation = await EventRepository.addParticipant(userId, eventId, preferredPosition);
    return participation;
  }

  async leaveEvent(userId: string, eventId: string): Promise<void> {
    const isParticipant = await EventRepository.isParticipant(userId, eventId);
    if (!isParticipant) {
      throw new NotFoundError('User not part of this event');
    }

    await EventRepository.removeParticipant(userId, eventId);
  }

  async getEventParticipants(eventId: string): Promise<Participation[]> {
    await this.getEventById(eventId);
    return EventRepository.getParticipants(eventId);
  }

  async publishEvent(id: string, hostId: string): Promise<Event> {
    const event = await this.getEventById(id);

    if (event.host_id !== hostId) {
      throw new ValidationError('Only event host can publish event');
    }

    return EventRepository.updateEvent(id, { status: 'published' } as any);
  }

  async cancelEvent(id: string, hostId: string): Promise<Event> {
    const event = await this.getEventById(id);

    if (event.host_id !== hostId) {
      throw new ValidationError('Only event host can cancel event');
    }

    return EventRepository.updateEvent(id, { status: 'cancelled' } as any);
  }
}

export default new EventService();
