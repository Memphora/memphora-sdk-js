/**
 * Production Integration Tests for Memphora TypeScript SDK
 * Tests all core functionality including Vector Search
 */

import { Memphora } from '../src/memphora';

// Configuration
const TEST_CONFIG = {
  apiUrl: process.env.MEMPHORA_API_URL || 'https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1',
  apiKey: process.env.MEMPHORA_API_KEY || 'memphora_live_sk_WPY_2PKBpOBaTpWPWbi9dG-dQvPDIICCtRNHTfxI4yI',
  userId: `test-user-${Date.now()}`,
  timeout: 30000, // 30 seconds
};

describe('Memphora TypeScript SDK - Production Tests', () => {
  let memory: Memphora;
  const testMemories: string[] = [];

  beforeAll(() => {
    memory = new Memphora({
      apiUrl: TEST_CONFIG.apiUrl,
      apiKey: TEST_CONFIG.apiKey,
      userId: TEST_CONFIG.userId,
    });
  }, TEST_CONFIG.timeout);

  afterAll(async () => {
    // Cleanup: Delete all test memories
    try {
      await memory.deleteAll();
      console.log('✓ Cleaned up test data');
    } catch (error) {
      console.warn('Warning: Cleanup failed', error);
    }
  }, TEST_CONFIG.timeout);

  describe('1. Core Memory Operations', () => {
    test('should store a memory', async () => {
      const content = 'User prefers dark mode and TypeScript';
      const result = await memory.store(content, { type: 'preference' });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.content).toContain('dark mode');
      testMemories.push(result.id);
    }, TEST_CONFIG.timeout);

    test('should search memories with semantic search', async () => {
      // Store some test data first
      await memory.store('User loves Python programming');
      await memory.store('User prefers React for frontend');
      await memory.store('User uses VS Code as editor');
      
      // Wait a bit for indexing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = await memory.search('programming languages', 5);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('score');
    }, TEST_CONFIG.timeout);

    test('should get formatted context', async () => {
      const context = await memory.getContext('user preferences', 5);
      
      expect(context).toBeDefined();
      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);

    test('should retrieve all memories', async () => {
      const memories = await memory.getAll(10);
      
      expect(memories).toBeDefined();
      expect(Array.isArray(memories)).toBe(true);
      expect(memories.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);
  });

  describe('2. Vector Search Integration', () => {
    test('should perform vector search with embeddings', async () => {
      // Store memories with different topics
      await memory.store('Machine learning models need training data');
      await memory.store('Neural networks use backpropagation');
      await memory.store('Pizza is a popular Italian food');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Search for AI-related content
      const results = await memory.search('artificial intelligence', 5);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      // Check that AI-related results score higher
      const topResult = results[0];
      expect(topResult.content).toMatch(/machine learning|neural network/i);
    }, TEST_CONFIG.timeout);

    test('should handle advanced search with filters', async () => {
      await memory.store('Important project deadline', { 
        priority: 'high',
        type: 'task' 
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const results = await memory.searchAdvanced('deadline', {
        limit: 5,
        min_score: 0.5,
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    }, TEST_CONFIG.timeout);
  });

  describe('3. Memory Management', () => {
    test('should update a memory', async () => {
      const stored = await memory.store('Original content');
      const updated = await memory.update(stored.id, 'Updated content', {
        updated: true
      });
      
      expect(updated).toBeDefined();
      expect(updated.id).toBe(stored.id);
      expect(updated.content).toContain('Updated');
    }, TEST_CONFIG.timeout);

    test('should delete a specific memory', async () => {
      const stored = await memory.store('To be deleted');
      const deleted = await memory.delete(stored.id);
      
      expect(deleted).toBe(true);
    }, TEST_CONFIG.timeout);

    test('should batch store memories', async () => {
      const memories = [
        { content: 'Memory 1', metadata: { batch: 1 } },
        { content: 'Memory 2', metadata: { batch: 1 } },
        { content: 'Memory 3', metadata: { batch: 1 } },
      ];
      
      const results = await memory.batchStore(memories);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
    }, TEST_CONFIG.timeout);
  });

  describe('4. Advanced Features', () => {
    test('should merge memories', async () => {
      const mem1 = await memory.store('User likes coffee');
      const mem2 = await memory.store('User prefers espresso');
      
      const merged = await memory.merge([mem1.id, mem2.id]);
      
      expect(merged).toBeDefined();
      expect(merged.id).toBeDefined();
    }, TEST_CONFIG.timeout);

    test('should find contradictions', async () => {
      const mem1 = await memory.store('User prefers light theme');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const contradictions = await memory.findContradictions(mem1.id, 0.7);
      
      expect(contradictions).toBeDefined();
      expect(Array.isArray(contradictions)).toBe(true);
    }, TEST_CONFIG.timeout);

    test('should get statistics', async () => {
      const stats = await memory.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total_memories');
      expect(typeof stats.total_memories).toBe('number');
    }, TEST_CONFIG.timeout);
  });

  describe('5. Conversation Features', () => {
    test('should record a conversation', async () => {
      const result = await memory.recordConversation(
        [
          { role: 'user', content: 'What is the weather?' },
          { role: 'assistant', content: 'The weather is sunny today.' }
        ],
        'test'
      );
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('conversation_id');
    }, TEST_CONFIG.timeout);

    test('should store conversation messages', async () => {
      const result = await memory.storeConversation(
        'Hello, how are you?',
        'I am doing well, thank you!'
      );
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    }, TEST_CONFIG.timeout);
  });

  describe('6. Error Handling', () => {
    test('should handle invalid memory ID gracefully', async () => {
      await expect(memory.delete('invalid-id-123')).rejects.toThrow();
    }, TEST_CONFIG.timeout);

    test('should handle empty search query', async () => {
      const results = await memory.search('', 5);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    }, TEST_CONFIG.timeout);

    test('should handle invalid API URL', async () => {
      const invalidMemory = new Memphora({
        apiUrl: 'https://invalid-url-that-does-not-exist.com',
        apiKey: TEST_CONFIG.apiKey,
        userId: TEST_CONFIG.userId,
      });
      
      await expect(invalidMemory.search('test')).rejects.toThrow();
    }, 5000);
  });

  describe('7. Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(memory.store(`Performance test memory ${i}`));
      }
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(15000); // Should complete in 15 seconds
      console.log(`✓ Bulk store of 10 memories: ${duration}ms`);
    }, TEST_CONFIG.timeout);

    test('should search quickly', async () => {
      const startTime = Date.now();
      await memory.search('test query', 10);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete in 5 seconds
      console.log(`✓ Search completed in: ${duration}ms`);
    }, TEST_CONFIG.timeout);
  });

  describe('8. Vector Search Specific Tests', () => {
    test('should return results with similarity scores', async () => {
      await memory.store('Quantum computing uses qubits');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const results = await memory.search('quantum mechanics', 5);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('score');
      expect(typeof results[0].score).toBe('number');
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    }, TEST_CONFIG.timeout);

    test('should handle semantic similarity correctly', async () => {
      // Store semantically similar content
      await memory.store('Dogs are loyal pets');
      await memory.store('Canines make great companions');
      await memory.store('The sky is blue');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = await memory.search('pet animals', 5);
      
      // Top results should be about dogs/pets, not sky
      expect(results[0].content).toMatch(/dog|canine|pet|companion/i);
    }, TEST_CONFIG.timeout);
  });
});

// Run tests with proper error handling
if (require.main === module) {
  console.log('🧪 Running Memphora TypeScript SDK Production Tests\n');
  console.log('Configuration:');
  console.log(`  API URL: ${TEST_CONFIG.apiUrl}`);
  console.log(`  User ID: ${TEST_CONFIG.userId}`);
  console.log(`  Timeout: ${TEST_CONFIG.timeout}ms\n`);
}
