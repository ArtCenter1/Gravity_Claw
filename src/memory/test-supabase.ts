import { config } from '../config.js';
import { generateEmbedding } from './embeddings.js';
import { saveToSemanticMemory, searchSemanticMemory } from './semantic.js';

async function runTest() {
    console.log("=== Testing Supabase Semantic Memory ===");
    console.log(`Supabase URL configured: ${!!config.supabaseUrl}`);
    console.log(`Supabase Key configured: ${!!config.supabaseServiceKey}`);

    const fact1 = "My favorite color is neon green, and I love drinking black coffee.";
    const fact2 = "I am allergic to peanuts.";

    console.log("\n[1/4] Generating Embeddings...");
    const embed1 = await generateEmbedding(fact1);
    const embed2 = await generateEmbedding(fact2);

    if (!embed1 || !embed2) {
        console.error("❌ Failed to generate embeddings. Check OpenAI/OpenRouter API keys.");
        return;
    }
    console.log("✅ Embeddings generated successfully.");

    console.log("\n[2/4] Saving to Supabase pgvector...");
    await saveToSemanticMemory('user', fact1, embed1);
    await saveToSemanticMemory('user', fact2, embed2);
    console.log("✅ Saved successfully.");

    console.log("\n[3/4] Testing Semantic Search (RAG)...");
    const query = "What kind of coffee do I like?";
    console.log(`    Query: "${query}"`);

    const queryEmbed = await generateEmbedding(query);
    if (!queryEmbed) {
        console.error("❌ Failed to generate embedding for search query.");
        return;
    }

    const results = await searchSemanticMemory(queryEmbed, 1);

    console.log("\n[4/4] Results:");
    if (results.length > 0) {
        console.log(`✅ MATCH FOUND: "${results[0].content}"`);
        console.log(`   Similarity Score: ${results[0].similarity}`);
        if (results[0].content === fact1) {
            console.log("\n🎉 SUPABASE INTEGRATION IS 100% WORKING!");
        } else {
            console.log("⚠️ Found a match, but it wasn't the expected one.");
        }
    } else {
        console.error("❌ No matches found. Make sure the SQL schema was created correctly.");
    }
}

runTest().catch(console.error);
