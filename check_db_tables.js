const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), '.data', 'gravity_claw.sqlite');

console.log('Checking database at:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
    console.error('Database file does not exist!');
    process.exit(1);
}

const db = new Database(DB_PATH);

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables.map(t => t.name).join(', '));

    const expectedTables = ['todos', 'habit_logs', 'productivity_notes'];
    const missingTables = expectedTables.filter(name => !tables.find(t => t.name === name));

    if (missingTables.length > 0) {
        console.log('Missing tables:', missingTables.join(', '));
        console.log('Applying schema fixes...');
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS habit_logs (
                day_index INTEGER PRIMARY KEY,
                status TEXT NOT NULL, -- JSON array of booleans
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS productivity_notes (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Schema fixes applied successfully.');
    } else {
        console.log('All expected tables are present.');
    }
} catch (error) {
    console.error('Error during database check:', error);
} finally {
    db.close();
}
