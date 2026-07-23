import fs from 'fs';
import path from 'path';
import { query } from '../src/config/database';

const schemaPath = path.join(__dirname, '../src/database/schema.sql');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await query(statement);
      console.log('✓', statement.substring(0, 50) + '...');
    }

    console.log('✅ Database schema initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
