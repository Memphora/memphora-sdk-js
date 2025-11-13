# Memphora SDK (TypeScript)

Persistent memory layer for AI agents. Store, search, and retrieve memories with semantic understanding.

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

#### `search(query: string, limit?: number): Promise<Memory[]>`
Search memories semantically.

```typescript
const results = await memory.search('What is my job?', 5);
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

**Note:** To get a specific memory by ID, use `memory.rawClient.getMemory(memoryId)`.

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

// Find contradictions
const contradictions = await memory.findContradictions(memoryId, 0.7);

// Link memories (via raw client)
await memory.rawClient.linkMemories(
  sourceId,
  targetId,
  'related' // or 'contradicts', 'supports', 'extends'
);
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
// Create separate instances for different agents
const agents = {
  coder: new Memphora({ 
    userId: 'user123',  // Unique identifier for this user (Admin can track data from dashboard)
    apiKey: key         // Required: API key from dashboard
  }),
  writer: new Memphora({ 
    userId: 'user123',  // Unique identifier for this user (Admin can track data from dashboard)
    apiKey: key         // Required: API key from dashboard
  })
};

// Each agent can store memories with metadata to identify the agent
await agents.coder.store('User prefers Python', { agent: 'coder' });
await agents.writer.store('User likes technical writing', { agent: 'writer' });

// Search with agent filter
const coderMemories = await agents.coder.searchAdvanced('Python', {
  filters: { agent: 'coder' }
});
```

## License

MIT

## Links

- [Documentation](https://memphora.ai/docs)
- [Dashboard](https://memphora.ai/dashboard)
- [GitHub](https://github.com/Memphora/memphora-sdk-js)
- [NPM](https://www.npmjs.com/package/memphora)

## Support

- Email: info@memphora.ai
- Issues: https://github.com/Memphora/memphora-sdk-js/issues
