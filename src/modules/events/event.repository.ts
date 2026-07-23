import { query } from '../../config/database';
import { Event, EventFilters, Participation } from '../../types/event.interface';
import { generateId } from '../../utils/id';

export class EventRepository {
  async createEvent(
    hostId: string,
    title: string,
    eventType: string,
    location: string,
    city: string,
    startTime: Date,
    endTime: Date,
    maxParticipants: number,
    additionalData?: any,
  ): Promise<Event> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO events.events (
        id, title, description, type, location, city, start_time, end_time,
        host_id, min_participants, max_participants, skill_level, surface_type,
        price, status, created_at, updated_at, state, zip_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, title, description, type, location, city, start_time, end_time,
        field_id, host_id, min_participants, max_participants, current_participants,
        skill_level, surface_type, price, status, is_active, state, zip_code, created_at, updated_at`,
      [
        id,
        title,
        additionalData?.description || null,
        eventType,
        location,
        city,
        startTime,
        endTime,
        hostId,
        additionalData?.min_participants || 2,
        maxParticipants,
        additionalData?.skill_level || null,
        additionalData?.surface_type || null,
        additionalData?.price || 0,
        'draft',
        now,
        now,
        additionalData?.state || null,
        additionalData?.zip_code || null,
      ],
    );

    return result.rows[0] as Event;
  }

  async getEventById(id: string): Promise<Event | null> {
    const result = await query(
      `SELECT id, title, description, type, location, city, start_time, end_time,
        field_id, host_id, min_participants, max_participants, current_participants,
        skill_level, surface_type, price, status, is_active, state, zip_code, created_at, updated_at
      FROM events.events WHERE id = $1 AND is_active = true`,
      [id],
    );

    return result.rows[0] || null;
  }

  async listEvents(filters: EventFilters): Promise<{ events: Event[]; total: number }> {
    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.city) {
      whereClause += ` AND city = $${paramCount}`;
      params.push(filters.city);
      paramCount += 1;
    }

    if (filters.type) {
      whereClause += ` AND type = $${paramCount}`;
      params.push(filters.type);
      paramCount += 1;
    }

    if (filters.skill_level) {
      whereClause += ` AND skill_level = $${paramCount}`;
      params.push(filters.skill_level);
      paramCount += 1;
    }

    if (filters.surface_type) {
      whereClause += ` AND surface_type = $${paramCount}`;
      params.push(filters.surface_type);
      paramCount += 1;
    }

    if (filters.start_date) {
      whereClause += ` AND start_time >= $${paramCount}`;
      params.push(filters.start_date);
      paramCount += 1;
    }

    if (filters.end_date) {
      whereClause += ` AND start_time <= $${paramCount}`;
      params.push(filters.end_date);
      paramCount += 1;
    }

    if (filters.min_price !== undefined) {
      whereClause += ` AND price >= $${paramCount}`;
      params.push(filters.min_price);
      paramCount += 1;
    }

    if (filters.max_price !== undefined) {
      whereClause += ` AND price <= $${paramCount}`;
      params.push(filters.max_price);
      paramCount += 1;
    }

    if (filters.search) {
      whereClause += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount += 1;
    }

    let orderClause = 'ORDER BY created_at DESC';
    if (filters.sort === 'soonest') {
      orderClause = 'ORDER BY start_time ASC';
    } else if (filters.sort === 'price_low') {
      orderClause = 'ORDER BY price ASC';
    } else if (filters.sort === 'price_high') {
      orderClause = 'ORDER BY price DESC';
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) as count FROM events.events ${whereClause}`,
      params,
    );

    const result = await query(
      `SELECT id, title, description, type, location, city, start_time, end_time,
        field_id, host_id, min_participants, max_participants, current_participants,
        skill_level, surface_type, price, status, is_active, state, zip_code, created_at, updated_at
      FROM events.events ${whereClause} ${orderClause} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset],
    );

    return {
      events: result.rows as Event[],
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'host_id') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount += 1;
      }
    });

    if (updates.length === 0) {
      return this.getEventById(id) as Promise<Event>;
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const result = await query(
      `UPDATE events.events SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1} AND is_active = true
      RETURNING id, title, description, type, location, city, start_time, end_time,
        field_id, host_id, min_participants, max_participants, current_participants,
        skill_level, surface_type, price, status, is_active, state, zip_code, created_at, updated_at`,
      values,
    );

    return result.rows[0] as Event;
  }

  async deleteEvent(id: string): Promise<void> {
    await query(
      `UPDATE events.events SET is_active = false, updated_at = $1 WHERE id = $2`,
      [new Date(), id],
    );
  }

  async addParticipant(
    userId: string,
    eventId: string,
    preferredPosition?: string,
  ): Promise<Participation> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO events.participation (id, user_id, event_id, preferred_position, joined_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, event_id, status, preferred_position, team_assignment, joined_at, updated_at`,
      [id, userId, eventId, preferredPosition || null, now, now],
    );

    return result.rows[0] as Participation;
  }

  async removeParticipant(userId: string, eventId: string): Promise<void> {
    await query(
      `UPDATE events.participation SET status = 'cancelled', updated_at = $1
      WHERE user_id = $2 AND event_id = $3`,
      [new Date(), userId, eventId],
    );
  }

  async getParticipants(eventId: string): Promise<Participation[]> {
    const result = await query(
      `SELECT id, user_id, event_id, status, preferred_position, team_assignment, joined_at, updated_at
      FROM events.participation WHERE event_id = $1 AND status != 'cancelled'`,
      [eventId],
    );

    return result.rows as Participation[];
  }

  async isParticipant(userId: string, eventId: string): Promise<boolean> {
    const result = await query(
      `SELECT COUNT(*) FROM events.participation
      WHERE user_id = $1 AND event_id = $2 AND status != 'cancelled'`,
      [userId, eventId],
    );

    return result.rows[0].count > 0;
  }

  async updateParticipationStatus(
    userId: string,
    eventId: string,
    status: string,
  ): Promise<void> {
    await query(
      `UPDATE events.participation SET status = $1, updated_at = $2
      WHERE user_id = $3 AND event_id = $4`,
      [status, new Date(), userId, eventId],
    );
  }
}

export default new EventRepository();
