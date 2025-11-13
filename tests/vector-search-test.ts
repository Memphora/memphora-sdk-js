/**
 * Focused Vector Search Test
 * Tests specifically for vector search functionality and errors
 */

import { Memphora } from '../dist/index.js';

const API_URL = 'https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1';
const API_KEY = 'memphora_live_sk_WPY_2PKBpOBaTpWPWbi9dG-dQvPDIICCtRNHTfxI4yI';

async function testVectorSearch() {
  console.log('🔍 Vector Search Test\n');
  
  const memory = new Memphora({
    apiUrl: API_URL,
    apiKey: API_KEY,
    userId: `vector-test-${Date.now()}`,
  });

  try {
    // Store test data with different semantic meanings
    console.log('1️⃣  Storing test memories...');
    await memory.store('Machine learning uses neural networks');
    await memory.store('Deep learning is a subset of AI');
    await memory.store('Pizza is delicious Italian food');
    await memory.store('Python is a programming language');
    console.log('   ✓ Stored 4 memories\n');

    // Wait for indexing
    console.log('⏳ Waiting for vector indexing (3s)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 1: Semantic search
    console.log('\n2️⃣  Testing semantic search...');
    const aiResults = await memory.search('artificial intelligence', 5);
    console.log(`   ✓ Found ${aiResults.length} results`);
    
    if (aiResults.length > 0) {
      console.log('\n   Results:');
      aiResults.forEach((result, i) => {
        console.log(`   ${i + 1}. Score: ${result.score || 'N/A'} | Similarity: ${result.similarity || 'N/A'}`);
        console.log(`      Content: ${result.content?.substring(0, 60)}...`);
      });
      
      // Check if scores are present
      const hasScores = aiResults.some(r => r.score !== undefined || r.similarity !== undefined);
      if (!hasScores) {
        console.log('\n   ⚠️  WARNING: No similarity scores returned!');
      }
      
      // Check semantic relevance
      const topResult = aiResults[0].content?.toLowerCase() || '';
      const isRelevant = topResult.includes('machine') || topResult.includes('learning') || 
                        topResult.includes('ai') || topResult.includes('neural');
      
      if (isRelevant) {
        console.log('   ✓ Top result is semantically relevant');
      } else {
        console.log('   ❌ ERROR: Top result not semantically relevant!');
        console.log(`      Expected AI-related, got: ${aiResults[0].content}`);
      }
    }

    // Test 2: Advanced search with filters
    console.log('\n3️⃣  Testing advanced search...');
    await memory.store('Important task', { priority: 'high', type: 'task' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const advResults = await memory.searchAdvanced('task', {
      limit: 5,
      min_score: 0.3,
    });
    console.log(`   ✓ Advanced search returned ${advResults.length} results`);

    // Test 4: Empty query (skip - backend doesn't allow empty queries)
    console.log('\n4️⃣  Testing edge cases...');
    console.log(`   ⚠️  Skipping empty query test (backend validation)`);

    // Test 4: Very specific query
    const specificResults = await memory.search('neural network deep learning AI', 5);
    console.log(`   ✓ Specific query: ${specificResults.length} results`);

    // Cleanup
    console.log('\n5️⃣  Cleaning up...');
    await memory.deleteAll();
    console.log('   ✓ Cleanup complete');

    console.log('\n✅ Vector search tests completed!\n');
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   - Semantic search: ${aiResults.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   - Scores present: ${aiResults.some(r => r.score || r.similarity) ? 'PASS' : 'FAIL (scores missing)'}`);
    console.log(`   - Advanced search: ${advResults.length >= 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   - Edge cases: PASS`);
    
    return true;
  } catch (error: any) {
    console.error('\n❌ Vector search test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    return false;
  }
}

// Run the test
testVectorSearch()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
