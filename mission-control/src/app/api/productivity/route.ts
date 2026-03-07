import { NextResponse } from 'next/server';
import { 
    getTodos, saveTodo, deleteTodo, 
    getHabits, saveHabit, 
    getProductivityNotes, saveProductivityNote, deleteProductivityNote 
} from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'todos') {
            return NextResponse.json({ todos: getTodos() });
        }
        if (type === 'habits') {
            return NextResponse.json({ habits: getHabits() });
        }
        if (type === 'notes') {
            return NextResponse.json({ notes: getProductivityNotes() });
        }

        // Return all by default
        return NextResponse.json({
            todos: getTodos(),
            habits: getHabits(),
            notes: getProductivityNotes()
        });
    } catch (error) {
        console.error('Error fetching productivity data:', error);
        return NextResponse.json({ error: 'Failed to fetch productivity data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, action, data } = body;

        if (type === 'todo') {
            if (action === 'save') {
                saveTodo(data);
                return NextResponse.json({ success: true });
            }
            if (action === 'delete') {
                deleteTodo(data.id);
                return NextResponse.json({ success: true });
            }
        }

        if (type === 'habit') {
            if (action === 'save') {
                saveHabit(data.day_index, data.status);
                return NextResponse.json({ success: true });
            }
        }

        if (type === 'note') {
            if (action === 'save') {
                saveProductivityNote(data.id, data.content);
                return NextResponse.json({ success: true });
            }
            if (action === 'delete') {
                deleteProductivityNote(data.id);
                return NextResponse.json({ success: true });
            }
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Error saving productivity data:', error);
        return NextResponse.json({ error: 'Failed to save productivity data' }, { status: 500 });
    }
}
