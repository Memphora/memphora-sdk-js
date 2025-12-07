<p align="center">
  <img src="logo.png" alt="Memphora Logo" width="120" height="120">
</p>

<h1 align="center">Memphora TypeScript SDK</h1>

<p align="center">
  <strong>Persistent memory layer for AI agents. Store, search, and retrieve memories with semantic understanding.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/memphora"><img src="https://img.shields.io/npm/v/memphora.svg" alt="npm"></a>
  <a href="https://github.com/Memphora/memphora-sdk-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://memphora.ai"><img src="https://img.shields.io/badge/website-memphora.ai-orange.svg" alt="Website"></a>
</p>

## Installation

```bash
npm install memphora
```

## Quick Start

```typescript
import { Memphora } from 'memphora';

// Initialize
const memory = new Memphora({
  userId: 'user123',        // Unique identifier for this user (Admin can track data from dashboard)
  apiKey: 'your_api_key'   // Required: Get from https://memphora.ai/dashboard
});

// Store a memory
await memory.store('I love playing basketball on weekends');

// Search memories
const results = await memory.search('What sports do I like?');
console.log(results);

// Get context for a conversation
const context = await memory.getContext('Tell me about my hobbies');
```

## Features

- 🧠 **Semantic Search** - Find memories by meaning, not just keywords
- 🔄 **Auto-consolidation** - Automatically merges duplicate memories
- 📊 **Graph Relationships** - Link related memories together
- 🤖 **Multi-Agent Support** - Separate memory spaces for different agents
- 👥 **Group Memories** - Shared memories for teams
- 📈 **Analytics** - Track memory growth and usage
- ⚡ **Vercel AI SDK** - Native integration for Next.js applications

## Vercel AI SDK Integration

Add persistent memory to your Next.js AI applications with the Vercel AI SDK integration.

### Basic Usage (API Route)

```typescript
// app/api/chat/route.ts
import { createMemphoraMiddleware } from 'memphora'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

const memphora = createMemphoraMiddleware({
  apiKey: process.env.MEMPHORA_API_KEY!,
  getUserId: (req) => req.headers.get('x-user-id') || 'anonymous'
})

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  // Get context from memory and inject into messages
  const { enhancedMessages, userId } = await memphora.beforeChat(messages, req)
  
  // Call LLM with memory-enhanced messages
  const result = await streamText({
    model: openai('gpt-4o'),
    messages: enhancedMessages
  })
  
  // Store conversation after completion (non-blocking)
  result.text.then(text => {
    memphora.afterChat(messages, text, req, { userId })
  })
  
  return result.toDataStreamResponse()
}
```

### Edge Runtime

```typescript
// For Edge Runtime, use the lightweight client
import { createEdgeClient } from 'memphora'

const memphora = createEdgeClient({
  apiKey: process.env.MEMPHORA_API_KEY!
})

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, userId } = await req.json()
  
  // Get relevant context
  const memories = await memphora.search(userId, messages[messages.length - 1].content)
  const context = memories.map(m => m.content).join('\n')
  
  // ... use context in your LLM call
}
```

### Streaming with Auto-Store

```typescript
import { createMemphoraMiddleware, wrapStreamWithMemory } from 'memphora'

const memphora = createMemphoraMiddleware({ apiKey: '...' })

// Wrap any async iterable stream
const wrappedStream = wrapStreamWithMemory(
  originalStream,
  memphora,
  messages,
  userId
)

// Memory is automatically stored when stream completes
await wrappedStream.memoryPromise
```

### Configuration Options

```typescript
const memphora = createMemphoraMiddleware({
  apiKey: string,                    // Required: Memphora API key
  apiUrl?: string,                   // API URL (default: https://api.memphora.ai/api/v1)
  getUserId?: (req) => string,       // Function to extract user ID from request
  defaultUserId?: string,            // Default user ID (default: 'anonymous')
  maxMemories?: number,              // Max memories in context (default: 10)
  maxTokens?: number,                // Max tokens for context (default: 2000)
  autoStore?: boolean,               // Auto-store conversations (default: true)
  injectAsSystemMessage?: boolean,   // Inject context as system message (default: true)
  systemMessagePrefix?: string       // Prefix for context message
})
```

## API Reference

### Initialize

```typescript
const memory = new Memphora({
  userId: string,        // Unique identifier for this user (Admin can track data from dashboard)
  apiKey: string         // Required: API key from https://memphora.ai/dashboard
});
```

### Core Methods

#### `store(content: string, metadata?: object): Promise<Memory>`
Store a new memory.

```typescript
const memory = await memory.store('I work as a software engineer', {
  category: 'work',
  importance: 'high'
});
```

#### `search(query: string, limit?: number, options?: object): Promise<Memory[]>`
Search memories semantically with optional external reranking.

```typescript
// Basic search
const results = await memory.search('What is my job?', 5);

// Search with Cohere reranking for better relevance
const rerankedResults = await memory.search('headphone recommendations', 10, {
  rerank: true,
  rerank_provider: 'cohere',  // or 'jina' or 'auto'
  cohere_api_key: 'your-cohere-api-key'  // Get from https://dashboard.cohere.com/api-keys
});

// Search with Jina AI reranking (multilingual support)
const jinaResults = await memory.search('recomendaciones de auriculares', 10, {
  rerank: true,
  rerank_provider: 'jina',
  jina_api_key: 'your-jina-api-key'  // Get from https://jina.ai/
});
```

#### `getContext(query: string, limit?: number): Promise<string>`
Get formatted context for AI prompts.

```typescript
const context = await memory.getContext('Tell me about myself');
// Returns: "Relevant context from past conversations:\n- I work as a software engineer\n- ..."
```

### Advanced Methods

#### `storeConversation(userMessage: string, aiResponse: string): Promise<Memory[]>`
Store a conversation and extract memories. Returns the extracted memories.

```typescript
const memories = await memory.storeConversation(
  "What's my favorite color?",
  "Based on your memories, your favorite color is blue."
);
```

#### `getAll(limit?: number): Promise<Memory[]>`
List all memories for the user.

```typescript
const allMemories = await memory.getAll(100);
```

#### `update(memoryId: string, content?: string, metadata?: object): Promise<Memory>`
Update an existing memory.

```typescript
const updated = await memory.update(memoryId, 'Updated content', { category: 'work' });
```

#### `delete(memoryId: string): Promise<boolean>`
Delete a memory.

```typescript
await memory.delete(memoryId);
```

#### `getMemory(memoryId: string): Promise<Memory>`
Get a specific memory by ID.

```typescript
const mem = await memory.getMemory(memoryId);
console.log(mem.content);
```

#### `deleteAll(): Promise<any>`
Delete all memories for this user. Warning: This action is irreversible.

```typescript
await memory.deleteAll();
```

### Advanced Search

```typescript
// Advanced search with filters and options
const results = await memory.searchAdvanced('query', {
  limit: 10,
  filters: { category: 'work' },
  min_score: 0.7,
  sort_by: 'relevance'
});

// Optimized search for better performance
const optimized = await memory.searchOptimized('query', {
  max_tokens: 2000,
  max_memories: 20,
  use_compression: true
});
```

### Batch Operations

```typescript
// Store multiple memories at once
const memories = await memory.batchStore([
  { content: 'Memory 1', metadata: { category: 'work' } },
  { content: 'Memory 2', metadata: { category: 'personal' } }
]);

// Merge multiple memories
const merged = await memory.merge([memoryId1, memoryId2], 'combine');
```

### Analytics

```typescript
// Get user statistics
const stats = await memory.getStatistics();
console.log(stats);
// { totalMemories: 42, avgMemoryLength: 85, ... }
```

### Graph Features

```typescript
// Get memory context with related memories
const context = await memory.getContextForMemory(memoryId, 2);

// Get memories related to a specific memory
const related = await memory.getRelatedMemories(memoryId, 10);

// Find contradictions
const contradictions = await memory.findContradictions(memoryId, 0.7);

// Link two memories in the graph
await memory.link(
  memoryId,
  targetId,
  'related' // or 'contradicts', 'supports', 'extends'
);

// Find shortest path between two memories
const path = await memory.findPath(sourceId, targetId);
console.log(path.distance); // Number of steps
```

### Context Methods

```typescript
// Get optimized context (26% better accuracy, 91% faster)
const optimizedContext = await memory.getOptimizedContext(
  'user preferences',
  2000,  // maxTokens
  20,    // maxMemories
  true,  // useCompression
  true   // useCache
);

// Get enhanced context (35%+ accuracy improvement)
const enhancedContext = await memory.getEnhancedContext(
  'programming languages',
  1500,  // maxTokens
  15,    // maxMemories
  true   // useCompression
);
```

### Version Control

```typescript
// Get all versions of a memory
const versions = await memory.getVersions(memoryId, 50);

// Compare two versions
const comparison = await memory.compareVersions(versionId1, versionId2);
console.log(comparison.changes);
console.log(comparison.similarity);

// Rollback to a specific version
await memory.rollback(memoryId, targetVersion);
```

### Conversation Management

```typescript
// Record a full conversation
const conversation = [
  { role: 'user', content: 'I need help with TypeScript' },
  { role: 'assistant', content: "I'd be happy to help!" }
];
const recorded = await memory.recordConversation(conversation, 'web_chat', {
  sessionId: 'sess_123'
});

// Get all conversations
const conversations = await memory.getConversations('web_chat', 50);

// Get a specific conversation by ID
const conv = await memory.getConversation(conversationId);

// Get rolling summary of all conversations
const summary = await memory.getSummary();
console.log(summary.total_conversations);
console.log(summary.topics);
```

### Multi-Agent Support

```typescript
// Store a memory for a specific agent
await memory.storeAgentMemory(
  'agent_123',
  'User prefers Python for backend development',
  'run_001',  // optional run_id
  { category: 'preference' }
);

// Search memories for a specific agent
const agentMemories = await memory.searchAgentMemories(
  'agent_123',
  'What does the user prefer?',
  'run_001',  // optional run_id
  10
);

// Get all memories for a specific agent
const allAgentMemories = await memory.getAgentMemories('agent_123', 100);
```

### Group/Collaborative Features

```typescript
// Store a shared memory for a group
await memory.storeGroupMemory(
  'team_alpha',
  'Team decided to use React for the frontend',
  { priority: 'high' }
);

// Search memories for a group
const groupMemories = await memory.searchGroupMemories(
  'team_alpha',
  'What framework did we choose?',
  10
);

// Get context for a group
const groupContext = await memory.getGroupContext('team_alpha', 50);
```

### Analytics

```typescript
// Get user statistics
const stats = await memory.getStatistics();
console.log(stats);
// { totalMemories: 42, avgMemoryLength: 85, ... }

// Get user's memory statistics and insights
const analytics = await memory.getUserAnalytics();
console.log(analytics);

// Track memory growth over time
const growth = await memory.getMemoryGrowth(30); // last 30 days
console.log(growth);
```

### Image Operations

```typescript
// Store an image memory
const imageMem = await memory.storeImage({
  imageUrl: 'https://example.com/photo.jpg',
  description: 'A photo of the Golden Gate Bridge',
  metadata: { location: 'San Francisco', type: 'landmark' }
});

// Search image memories
const imageResults = await memory.searchImages('bridge', 5);

// Upload an image from file
import * as fs from 'fs';
const imageBuffer = fs.readFileSync('product_photo.jpg');
const imageBlob = new Blob([imageBuffer]);
const uploaded = await memory.uploadImage(
  imageBlob,
  'product_photo.jpg',
  { category: 'product', productId: 'prod_123' }
);
```

### Export & Import

```typescript
// Export all memories
const exportData = await memory.export('json');
// or
const csvData = await memory.export('csv');

// Import memories
await memory.import(exportData.data, 'json');
```

### Text Processing

```typescript
// Make text more concise
const conciseResult = await memory.concise('This is a very long text that needs to be made more concise...');
console.log(conciseResult.concise_text);
```

### Health Check

```typescript
// Check API health
const health = await memory.health();
console.log(health.status);
```

## TypeScript Support

Full TypeScript support with type definitions included.

```typescript
import { Memphora, Memory, SearchOptions } from 'memphora';

const memory: Memphora = new Memphora({
  userId: 'user123',                    // Unique identifier for this user (Admin can track data from dashboard)
  apiKey: process.env.MEMPHORA_API_KEY // Required: API key from dashboard
});

const results: Memory[] = await memory.search('query');
```

## Error Handling

```typescript
try {
  await memory.store('My memory');
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else if (error.response?.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Examples

### Chatbot with Memory

```typescript
import { Memphora } from 'memphora';

const memory = new Memphora({
  userId: 'user123',                    // Unique identifier for this user (Admin can track data from dashboard)
  apiKey: process.env.MEMPHORA_API_KEY  // Required: Get from dashboard
});

async function chat(userMessage: string): Promise<string> {
  // Get relevant context
  const context = await memory.getContext(userMessage);
  
  // Generate AI response with context
  const aiResponse = await generateAIResponse(userMessage, context);
  
  // Store the conversation
  await memory.storeConversation(userMessage, aiResponse);
  
  return aiResponse;
}
```

### Multi-Agent System

```typescript
const memory = new Memphora({
  userId: 'user123',
  apiKey: 'your_api_key'
});

// Store memories for different agents
await memory.storeAgentMemory('coder', 'User prefers Python', 'run_001');
await memory.storeAgentMemory('writer', 'User likes technical writing', 'run_001');

// Search memories for a specific agent
const coderMemories = await memory.searchAgentMemories('coder', 'What does the user prefer?');

// Get all memories for an agent
const allCoderMemories = await memory.getAgentMemories('coder', 100);
```

### Group Collaboration

```typescript
const memory = new Memphora({
  userId: 'user123',
  apiKey: 'your_api_key'
});

// Store shared memories for a team
await memory.storeGroupMemory('team_alpha', 'Team decided to use React', {
  priority: 'high',
  decisionDate: '2024-01-15'
});

// Search group memories
const teamMemories = await memory.searchGroupMemories('team_alpha', 'What framework?');

// Get group context
const teamContext = await memory.getGroupContext('team_alpha', 50);
```

### Memory Linking and Path Finding

```typescript
const memory = new Memphora({
  userId: 'user123',
  apiKey: 'your_api_key'
});

// Store related memories
const mem1 = await memory.store('User works at Google');
const mem2 = await memory.store('User is a software engineer');
const mem3 = await memory.store('User lives in San Francisco');

// Link memories together
await memory.link(mem1.id, mem2.id, 'related');
await memory.link(mem1.id, mem3.id, 'related');

// Get related memories
const related = await memory.getRelatedMemories(mem1.id, 10);

// Find path between memories
const path = await memory.findPath(mem1.id, mem3.id);
console.log(`Path distance: ${path.distance} steps`);
```

### Version Control and Rollback

```typescript
const memory = new Memphora({
  userId: 'user123',
  apiKey: 'your_api_key'
});

// Store and update a memory multiple times
const mem = await memory.store('User works at Microsoft');
await memory.update(mem.id, 'User works at Google');
await memory.update(mem.id, 'User works at Meta');

// Get all versions
const versions = await memory.getVersions(mem.id, 10);
versions.forEach(v => {
  console.log(`Version ${v.version}: ${v.content}`);
});

// Compare two versions
const comparison = await memory.compareVersions(versions[0].id, versions[1].id);
console.log('Changes:', comparison.changes);
console.log('Similarity:', comparison.similarity);

// Rollback to a previous version
await memory.rollback(mem.id, 1);
```

### Using Optimized Context

```typescript
const memory = new Memphora({
  userId: 'user123',
  apiKey: 'your_api_key'
});

// Get optimized context (best for production)
const optimizedContext = await memory.getOptimizedContext(
  'user preferences',
  2000,  // maxTokens
  20,    // maxMemories
  true,  // useCompression
  true   // useCache
);

// Use in your AI prompt
const prompt = `Context about user:
${optimizedContext}

User query: What are my preferences?
Assistant:`;

const response = await yourAIModel(prompt);
```

## License

MIT

## Links

- [Documentation](https://memphora.ai/docs/sdk-js)
- [Dashboard](https://memphora.ai/dashboard)
- [GitHub](https://github.com/Memphora/memphora-sdk-js)
- [NPM](https://www.npmjs.com/package/memphora)

## Support

- Email: info@memphora.ai
- [Issues](https://github.com/Memphora/memphora-sdk-js/issues)
