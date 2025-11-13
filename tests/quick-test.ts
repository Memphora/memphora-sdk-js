/**
 * Quick smoke test to verify SDK and Vector Search are working
 */

import { Memphora } from '../dist/index.js';

const API_URL = process.env.MEMPHORA_API_URL || 'https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1';
const API_KEY = process.env.MEMPHORA_API_KEY || 'memphora_live_sk_WPY_2PKBpOBaTpWPWbi9dG-dQvPDIICCtRNHTfxI4yI';

async function runQuickTest() {
  console.log('🧪 Quick SDK Test\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`User ID: test-user-${Date.now()}\n`);

  const memory = new Memphora({
    apiUrl: API_URL,
    apiKey: API_KEY,
    userId: `test-user-${Date.now()}`,
  });

  try {
    // Test 1: Store a memory
    console.log('1️⃣  Testing store()...');
    const stored = await memory.store('User prefers TypeScript over JavaScript', {
      type: 'preference',
      category: 'programming'
    });
    console.log(`   ✓ Stored memory: ${stored.id}`);

    // Test 2: Search with vector similarity
    console.log('\n2️⃣  Testing search() with vector similarity...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing
    const results = await memory.search('programming language preferences', 5);
    console.log(`   ✓ Found ${results.length} results`);
    if (results.length > 0) {
      console.log(`   ✓ Top result score: ${results[0].score?.toFixed(4)}`);
      console.log(`   ✓ Content: ${results[0].content?.substring(0, 50)}...`);
    }

    // Test 3: Get context
    console.log('\n3️⃣  Testing getContext()...');
    const context = await memory.getContext('user preferences', 3);
    console.log(`   ✓ Context length: ${context.length} characters`);

    // Test 4: Get all memories
    console.log('\n4️⃣  Testing getAll()...');
    const all = await memory.getAll(10);
    console.log(`   ✓ Retrieved ${all.length} memories`);

    // Test 5: Update memory
    console.log('\n5️⃣  Testing update()...');
    const updated = await memory.update(stored.id, 'User strongly prefers TypeScript', {
      type: 'preference',
      updated: true
    });
    console.log(`   ✓ Updated memory: ${updated.id}`);

    // Test 6: Delete memory
    console.log('\n6️⃣  Testing delete()...');
    const deleted = await memory.delete(stored.id);
    console.log(`   ✓ Deleted: ${deleted}`);

    // Test 7: Cleanup
    console.log('\n7️⃣  Cleaning up...');
    await memory.deleteAll();
    console.log('   ✓ Cleanup complete');

    console.log('\n✅ All tests passed!\n');
    return true;
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Run the test
runQuickTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
