import { db } from './src/lib/db';

async function verify() {
  console.log('--- Mission Control Real-time Verification ---');

  // Verify Schema
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables.map((t: any) => t.name).join(', '));
  } catch (err) {
    console.error('Schema verification failed:', err);
  }

  // Verify Data Fetching (Mocking API behavior)
  try {
    const todos = db.prepare('SELECT COUNT(*) as count FROM todos').get() as any;
    console.log('Todos in DB:', todos.count);

    const habits = db.prepare('SELECT COUNT(*) as count FROM habit_logs').get() as any;
    console.log('Habit logs in DB:', habits.count);

    const notes = db.prepare('SELECT COUNT(*) as count FROM productivity_notes').get() as any;
    console.log('Productivity notes in DB:', notes.count);
  } catch (err) {
    console.error('Data verification failed:', err);
  }

  console.log('--- Verification Complete ---');
}

verify();
