import { query } from '../../config/database';
import { User } from '../../types/user.interface';
import { generateId } from '../../utils/id';
import { hashPassword } from '../../utils/password';

export class UserRepository {
  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    additionalData?: any,
  ): Promise<User> {
    const id = generateId();
    const hashedPassword = await hashPassword(password);
    const now = new Date();

    const result = await query(
      `INSERT INTO users.users (
        id, email, password_hash, first_name, last_name,
        phone, bio, gender, skill_level, preferred_positions, location, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, email, first_name, last_name, phone, bio, gender,
        skill_level, preferred_positions, location, rating, created_at, updated_at`,
      [
        id,
        email,
        hashedPassword,
        firstName,
        lastName,
        additionalData?.phone || null,
        additionalData?.bio || null,
        additionalData?.gender || null,
        additionalData?.skill_level || null,
        additionalData?.preferred_positions || null,
        additionalData?.location || null,
        now,
        now,
      ],
    );

    return result.rows[0] as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, bio, gender,
        skill_level, preferred_positions, location, rating, profile_picture, created_at, updated_at
      FROM users.users WHERE id = $1 AND is_active = true`,
      [id],
    );

    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, bio, gender,
        skill_level, preferred_positions, location, rating, profile_picture, created_at, updated_at
      FROM users.users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()],
    );

    return result.rows[0] || null;
  }

  async getPasswordHash(email: string): Promise<string | null> {
    const result = await query(
      `SELECT password_hash FROM users.users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()],
    );

    return result.rows[0]?.password_hash || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id'
        && key !== 'created_at'
        && key !== 'password_hash'
      ) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount += 1;
      }
    });

    if (updates.length === 0) {
      return this.getUserById(id) as Promise<User>;
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const result = await query(
      `UPDATE users.users SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1} AND is_active = true
      RETURNING id, email, first_name, last_name, phone, bio, gender,
        skill_level, preferred_positions, location, rating, profile_picture, created_at, updated_at`,
      values,
    );

    return result.rows[0] as User;
  }

  async deleteUser(id: string): Promise<void> {
    await query(
      `UPDATE users.users SET is_active = false, updated_at = $1
      WHERE id = $2`,
      [new Date(), id],
    );
  }

  async emailExists(email: string): Promise<boolean> {
    const result = await query(
      `SELECT COUNT(*) FROM users.users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()],
    );

    return result.rows[0].count > 0;
  }
}

export default new UserRepository();
