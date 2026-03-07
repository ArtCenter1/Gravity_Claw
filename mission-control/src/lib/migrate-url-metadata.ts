/**
 * Migration script to add URL metadata columns to core_facts table
 * Run this once to update the database schema
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), '..', '.data', 'gravity_claw.sqlite');

if (!fs.existsSync(DB_PATH)) {
    console.error('Database file does not exist!');
    process.exit(1);
}

const db = new Database(DB_PATH);

try {
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(core_facts)").all() as { name: string }[];
    const existingColumns = tableInfo.map(col => col.name);

    const columnsToAdd = [
        { name: 'metadata_title', type: 'TEXT' },
        { name: 'metadata_thumbnail', type: 'TEXT' },
        { name: 'metadata_channel', type: 'TEXT' },
        { name: 'metadata_video_id', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
        if (!existingColumns.includes(col.name)) {
            console.log(`Adding column: ${col.name}`);
            db.exec(`ALTER TABLE core_facts ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✓ Added ${col.name} column`);
        } else {
            console.log(`Column ${col.name} already exists, skipping`);
        }
    }

    console.log('\nMigration completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}
