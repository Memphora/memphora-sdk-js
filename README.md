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
  userId: 'user123',        // Required: Unique user identifier
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
  userId: string,        // Required: Unique user identifier for tracking
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

#### `storeConversation(userMessage: string, aiResponse: string): Promise<void>`
Store a conversation and extract memories.

```typescript
await memory.storeConversation(
  "What's my favorite color?",
  "Based on your memories, your favorite color is blue."
);
```

#### `getMemory(memoryId: string): Promise<Memory>`
Get a specific memory by ID.

#### `updateMemory(memoryId: string, content?: string, metadata?: object): Promise<Memory>`
Update an existing memory.

#### `deleteMemory(memoryId: string): Promise<boolean>`
Delete a memory.

#### `listMemories(limit?: number): Promise<Memory[]>`
List all memories for the user.

### Multi-Agent Support

```typescript
// Store agent-specific memory
await memory.storeAgentMemory(
  'agent_001',
  'User prefers concise responses',
  'run_123'
);

// Search agent memories
const agentMemories = await memory.searchAgentMemories(
  'agent_001',
  'user preferences'
);

// Get all agent memories
const allAgentMemories = await memory.getAgentMemories('agent_001');
```

### Group/Collaborative Features

```typescript
// Store group memory
await memory.storeGroupMemory(
  'team_alpha',
  'We decided to use React for the frontend'
);

// Search group memories
const teamMemories = await memory.searchGroupMemories(
  'team_alpha',
  'frontend decisions'
);

// Get group context
const groupContext = await memory.getGroupContext('team_alpha');
```

### Analytics

```typescript
// Get user analytics
const analytics = await memory.getUserAnalytics();
console.log(analytics);
// { totalMemories: 42, avgMemoryLength: 85, ... }

// Get memory growth over time
const growth = await memory.getMemoryGrowth(30); // last 30 days
```

### Graph Features

```typescript
// Get related memories
const related = await memory.getRelatedMemories(memoryId);

// Find contradictions
const contradictions = await memory.client.findContradictions(memoryId);

// Link memories
await memory.client.linkMemories(
  sourceId,
  targetId,
  'related' // or 'contradicts', 'supports', 'extends'
);
```

## TypeScript Support

Full TypeScript support with type definitions included.

```typescript
import { Memphora, Memory, SearchOptions } from '@memphora/sdk';

const memory: Memphora = new Memphora({
  userId: 'user123',                    // Required: Unique user identifier
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

## Environment Variables

```bash
MEMPHORA_API_KEY=your_api_key  # Required: Get from https://memphora.ai/dashboard
MEMPHORA_API_URL=https://api.memphora.ai/api/v1  # Optional: Custom API URL
```

**Note:** The `apiKey` is required and must be obtained from your Memphora dashboard at https://memphora.ai/dashboard. Each user should have a unique `userId` to track their memories separately.

## Examples

### Chatbot with Memory

```typescript
import { Memphora } from 'memphora';

const memory = new Memphora({
  userId: 'user123',                    // Unique identifier for this user
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
const agents = {
  coder: new Memphora({ 
    userId: 'user123',  // Required: Unique user identifier
    apiKey: key        // Required: API key from dashboard
  }),
  writer: new Memphora({ 
    userId: 'user123',  // Required: Unique user identifier
    apiKey: key        // Required: API key from dashboard
  })
};

// Each agent has separate memory
await agents.coder.storeAgentMemory('coder', 'User prefers Python');
await agents.writer.storeAgentMemory('writer', 'User likes technical writing');
```

## License

MIT

## Links

- [Documentation](https://docs.memphora.ai)
- [Dashboard](https://memphora.ai/dashboard)
- [GitHub](https://github.com/Memphora/memphora-sdk-js)
- [NPM](https://www.npmjs.com/package/memphora)

## Support

- Email: info@memphora.ai
- Issues: https://github.com/Memphora/memphora-sdk-js/issues
