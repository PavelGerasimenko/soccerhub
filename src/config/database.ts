import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'soccerhub_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const getConnection = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`Query took ${duration}ms: ${text}`);
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
