/**
 * Debug test to understand why getContext returns 0 characters
 */

import { Memphora } from '../dist/index.js';

const API_URL = 'https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1';
const API_KEY = 'memphora_live_sk_WPY_2PKBpOBaTpWPWbi9dG-dQvPDIICCtRNHTfxI4yI';

async function debugContext() {
  console.log('🔍 Debug getContext() Issue\n');

  const memory = new Memphora({
    apiUrl: API_URL,
    apiKey: API_KEY,
    userId: `debug-${Date.now()}`,
  });

  try {
    // Store a memory
    console.log('1️⃣  Storing memory...');
    const stored = await memory.store('User prefers TypeScript over JavaScript', {
      type: 'preference',
      category: 'programming'
    });
    console.log(`   ✓ Stored: ${stored.id}`);

    // Wait for indexing
    console.log('\n⏳ Waiting 2s for indexing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test different search queries
    console.log('\n2️⃣  Testing different search queries:\n');
    
    const queries = [
      'programming language preferences',
      'user preferences',
      'TypeScript',
      'preferences',
      ''
    ];

    for (const query of queries) {
      if (query === '') {
        console.log(`   Query: "${query}" - SKIPPED (empty not allowed)`);
        continue;
      }
      
      const results = await memory.search(query, 5);
      console.log(`   Query: "${query}"`);
      console.log(`   Results: ${results.length} found`);
      if (results.length > 0) {
        console.log(`   Top score: ${results[0].score}`);
        console.log(`   Content: ${results[0].content?.substring(0, 50)}...`);
      }
      console.log('');
    }

    // Test getContext with different queries
    console.log('3️⃣  Testing getContext() with different queries:\n');
    
    for (const query of queries.slice(0, 4)) {
      const context = await memory.getContext(query, 3);
      console.log(`   Query: "${query}"`);
      console.log(`   Context length: ${context.length} characters`);
      if (context.length > 0) {
        console.log(`   Context preview: ${context.substring(0, 100)}...`);
      } else {
        console.log(`   ⚠️  Empty context!`);
      }
      console.log('');
    }

    // Cleanup
    await memory.deleteAll();
    console.log('✅ Debug complete!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugContext()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
