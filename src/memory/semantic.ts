import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabase: SupabaseClient | null = null;

if (config.supabaseUrl && config.supabaseServiceKey) {
    supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
}

// Minimal placeholder function until we integrate OpenAI for embeddings
// We will call this in agent.ts later.
export async function saveToSemanticMemory(role: string, content: string, embedding: number[]) {
    if (!supabase) return;

    try {
        await supabase.from('semantic_memory').insert({
            role,
            content,
            embedding
        });
    } catch (e) {
        console.error('[Semantic Memory] Error saving:', e);
    }
}

export async function searchSemanticMemory(queryEmbedding: number[], limit: number = 5): Promise<{ role: string, content: string, similarity?: number }[]> {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase.rpc('match_semantic_memory', {
            query_embedding: queryEmbedding,
            match_threshold: 0.4, // Set to 0.4 based on RAG testing
            match_count: limit,
        });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('[Semantic Memory] Error searching:', e);
        return [];
    }
}
