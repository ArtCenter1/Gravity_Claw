import { NextResponse } from 'next/server';
import { getAllFacts, getFactCount, saveFact, deleteFact } from '@/lib/db';

export async function GET() {
    try {
        const facts = getAllFacts();
        const count = getFactCount();

        // Format facts for the frontend
        const formattedFacts = facts.map(fact => ({
            id: fact.id,
            content: fact.fact,
            category: extractCategory(fact.fact),
            type: 'note' as const,
            createdAt: fact.created_at,
            updatedAt: fact.updated_at,
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
        const { id, fact } = await request.json();

        if (!id || !fact) {
            return NextResponse.json({ error: 'Missing id or fact' }, { status: 400 });
        }

        saveFact(id, fact);

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
