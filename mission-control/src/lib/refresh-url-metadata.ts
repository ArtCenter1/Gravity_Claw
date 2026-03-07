/**
 * Script to refresh metadata for existing URLs in the database
 * Run this to populate metadata for URLs that were added before the metadata feature
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { isYouTubeUrl, fetchYouTubeMetadata } from './youtube-metadata';

const DB_PATH = path.join(process.cwd(), '..', '.data', 'gravity_claw.sqlite');

if (!fs.existsSync(DB_PATH)) {
    console.error('Database file does not exist!');
    process.exit(1);
}

const db = new Database(DB_PATH);

async function refreshMetadata() {
    try {
        // Get all URLs that don't have metadata
        const urls = db.prepare(`
            SELECT id, fact 
            FROM core_facts 
            WHERE type = 'url' 
            AND (metadata_title IS NULL OR metadata_title = '')
        `).all() as { id: string; fact: string }[];

        console.log(`Found ${urls.length} URLs without metadata`);

        for (const url of urls) {
            if (isYouTubeUrl(url.fact)) {
                console.log(`Fetching metadata for: ${url.fact}`);
                try {
                    const metadata = await fetchYouTubeMetadata(url.fact);
                    if (metadata) {
                        db.prepare(`
                            UPDATE core_facts 
                            SET metadata_title = ?, metadata_thumbnail = ?, metadata_channel = ?, metadata_video_id = ?
                            WHERE id = ?
                        `).run(
                            metadata.title,
                            metadata.thumbnail,
                            metadata.channelName || null,
                            metadata.videoId || null,
                            url.id
                        );
                        console.log(`✓ Updated: ${metadata.title}`);
                    }
                } catch (error) {
                    console.error(`✗ Failed to fetch metadata for ${url.fact}:`, error);
                }
            }
        }

        console.log('\nMetadata refresh complete!');
    } catch (error) {
        console.error('Error refreshing metadata:', error);
    } finally {
        db.close();
    }
}

refreshMetadata();
