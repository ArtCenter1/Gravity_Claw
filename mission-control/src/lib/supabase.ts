import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Activity Log types
export interface ActivityLog {
    id: string;
    action_type: string;
    details: Record<string, unknown>;
    created_at: string;
}

// Fetch recent activity logs
export async function getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching activity:', error);
        return [];
    }

    return data || [];
}

// Subscribe to real-time activity
export function subscribeToActivity(callback: (payload: any) => void) {
    return supabase
        .channel('activity_log')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, callback)
        .subscribe();
}

// Log an activity
export async function logActivity(actionType: string, details: Record<string, unknown> = {}) {
    const { error } = await supabase
        .from('activity_log')
        .insert([{ action_type: actionType, details }]);

    if (error) {
        console.error('Error logging activity:', error);
    }
}

// Bot Facts types
export interface BotFact {
    id: string;
    fact: string;
    category?: string;
    created_at: string;
    updated_at: string;
}

// Fetch all bot facts
export async function getBotFacts(): Promise<BotFact[]> {
    const { data, error } = await supabase
        .from('bot_facts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching facts:', error);
        return [];
    }

    return data || [];
}

// Add a new fact
export async function addBotFact(fact: string, category?: string) {
    const { error } = await supabase
        .from('bot_facts')
        .insert([{ fact, category }]);

    if (error) {
        console.error('Error adding fact:', error);
    }
}

// Delete a fact
export async function deleteBotFact(id: string) {
    const { error } = await supabase
        .from('bot_facts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting fact:', error);
    }
}
