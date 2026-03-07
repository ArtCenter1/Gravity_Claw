import { NextResponse } from 'next/server';
import { getAllFacts, getFactCount, saveFact, deleteFact } from '@/lib/db';
import { isYouTubeUrl, fetchYouTubeMetadata } from '@/lib/youtube-metadata';

export async function GET() {
    try {
        const facts = getAllFacts();
        const count = getFactCount();

        // Format facts for the frontend
        const formattedFacts = facts.map(fact => ({
            id: fact.id,
            content: fact.fact,
            category: fact.category || extractCategory(fact.fact),
            type: (fact.type as 'note' | 'url' | 'file') || 'note',
            createdAt: fact.created_at,
            updatedAt: fact.updated_at,
            // Include URL metadata if available
            metadata: fact.metadata_title ? {
                title: fact.metadata_title,
                thumbnail: fact.metadata_thumbnail,
                channel: fact.metadata_channel,
                videoId: fact.metadata_video_id
            } : undefined
        }));

        return NextResponse.json({
            facts: formattedFacts,
            count,
        });
    } catch (error) {
        console.error('Error fetching facts:', error);
        return NextResponse.json({ error: 'Failed to fetch facts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { id, fact, type, category } = await request.json();

        if (!id || !fact) {
            return NextResponse.json({ error: 'Missing id or fact' }, { status: 400 });
        }

        // If it's a URL, try to fetch metadata
        let metadata;
        if (type === 'url' && isYouTubeUrl(fact)) {
            try {
                metadata = await fetchYouTubeMetadata(fact);
            } catch (error) {
                console.error('Failed to fetch YouTube metadata:', error);
            }
        }

        saveFact(id, fact, type || 'note', category || 'general', metadata ? {
            title: metadata.title,
            thumbnail: metadata.thumbnail,
            channel: metadata.channelName,
            videoId: metadata.videoId
        } : undefined);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving fact:', error);
        return NextResponse.json({ error: 'Failed to save fact' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        deleteFact(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting fact:', error);
        return NextResponse.json({ error: 'Failed to delete fact' }, { status: 500 });
    }
}

// Helper to extract category from fact content
function extractCategory(fact: string): string {
    const lowerFact = fact.toLowerCase();

    if (lowerFact.includes('preference') || lowerFact.includes('prefer')) return 'preferences';
    if (lowerFact.includes('http') || lowerFact.includes('www.')) return 'links';
    if (lowerFact.includes('deadline') || lowerFact.includes('task') || lowerFact.includes('todo')) return 'tasks';
    if (lowerFact.includes('project')) return 'projects';
    if (lowerFact.includes('meeting') || lowerFact.includes('schedule')) return 'schedule';

    return 'general';
}
