/**
 * Vercel AI SDK Integration for Memphora
 * 
 * Provides middleware, hooks, and utilities for integrating Memphora
 * with the Vercel AI SDK in Next.js applications.
 * 
 * @example
 * ```typescript
 * // In your Next.js API route
 * import { createMemphoraMiddleware } from 'memphora/vercel'
 * 
 * const memphora = createMemphoraMiddleware({
 *   apiKey: process.env.MEMPHORA_API_KEY!,
 *   getUserId: (req) => req.headers.get('x-user-id') || 'anonymous'
 * })
 * 
 * export async function POST(req: Request) {
 *   const { messages } = await req.json()
 *   const { context, enhancedMessages } = await memphora.beforeChat(messages)
 *   // ... call your LLM with enhancedMessages
 *   await memphora.afterChat(messages, response)
 * }
 * ```
 */

import { Memphora, MemphoraOptions } from './memphora'
import type { Memory, ConversationMessage } from './types'

// ============================================================================
// Types
// ============================================================================

/**
 * Message format compatible with Vercel AI SDK
 */
export interface AIMessage {
  id?: string
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  name?: string
  function_call?: any
  tool_calls?: any[]
  createdAt?: Date
}

/**
 * Configuration for Memphora middleware
 */
export interface MemphoraMiddlewareConfig {
  /** Memphora API key */
  apiKey: string
  /** API URL (defaults to https://api.memphora.ai/api/v1) */
  apiUrl?: string
  /** Function to extract user ID from request */
  getUserId?: (req: Request) => string | Promise<string>
  /** Default user ID if getUserId is not provided */
  defaultUserId?: string
  /** Maximum number of memories to include in context */
  maxMemories?: number
  /** Maximum tokens for context */
  maxTokens?: number
  /** Whether to auto-store conversations */
  autoStore?: boolean
  /** Whether to include context in system message */
  injectAsSystemMessage?: boolean
  /** Custom system message prefix */
  systemMessagePrefix?: string
}

/**
 * Result from beforeChat middleware
 */
export interface BeforeChatResult {
  /** Formatted context string */
  context: string
  /** Relevant memories */
  memories: Memory[]
  /** Messages with context injected */
  enhancedMessages: AIMessage[]
  /** User ID used */
  userId: string
}

/**
 * Result from afterChat middleware
 */
export interface AfterChatResult {
  /** Whether storage was successful */
  success: boolean
  /** Extracted memories (if any) */
  memories?: Memory[]
  /** Error message (if failed) */
  error?: string
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Create Memphora middleware for Vercel AI SDK
 * 
 * @example
 * ```typescript
 * const memphora = createMemphoraMiddleware({
 *   apiKey: process.env.MEMPHORA_API_KEY!,
 *   getUserId: async (req) => {
 *     const session = await getSession(req)
 *     return session?.user?.id || 'anonymous'
 *   }
 * })
 * ```
 */
export function createMemphoraMiddleware(config: MemphoraMiddlewareConfig) {
  const {
    apiKey,
    apiUrl,
    getUserId,
    defaultUserId = 'anonymous',
    maxMemories = 10,
    maxTokens = 2000,
    autoStore = true,
    injectAsSystemMessage = true,
    systemMessagePrefix = 'Relevant context from previous conversations:'
  } = config

  // Cache Memphora instances per user
  const clientCache = new Map<string, Memphora>()

  function getClient(userId: string): Memphora {
    if (!clientCache.has(userId)) {
      clientCache.set(userId, new Memphora({
        userId,
        apiKey,
        apiUrl,
        maxTokens
      }))
    }
    return clientCache.get(userId)!
  }

  async function resolveUserId(req?: Request): Promise<string> {
    if (getUserId && req) {
      return await getUserId(req)
    }
    return defaultUserId
  }

  return {
    /**
     * Get Memphora client for a user
     */
    getClient,

    /**
     * Middleware to run before chat completion
     * Retrieves relevant context and injects it into messages
     */
    async beforeChat(
      messages: AIMessage[],
      req?: Request,
      options?: {
        userId?: string
        query?: string
      }
    ): Promise<BeforeChatResult> {
      const userId = options?.userId || await resolveUserId(req)
      const client = getClient(userId)

      // Get the last user message for context search
      const lastUserMessage = [...messages]
        .reverse()
        .find(m => m.role === 'user')

      const query = options?.query || lastUserMessage?.content || ''

      // Search for relevant memories
      let memories: Memory[] = []
      let context = ''

      if (query) {
        try {
          const result = await client.search(query, maxMemories)
          if (result.facts && result.facts.length > 0) {
            context = result.facts.map((f: { text: string }) => `- ${f.text}`).join('\n')
            // Convert facts to Memory format for backwards compatibility
            memories = result.facts.map((f: { text: string; memory_id?: string }) => ({
              id: f.memory_id || '',
              content: f.text
            })) as Memory[]
          }
        } catch (error) {
          console.warn('[Memphora] Failed to retrieve context:', error)
        }
      }

      // Build enhanced messages with context
      let enhancedMessages = [...messages]

      if (context && injectAsSystemMessage) {
        const contextMessage: AIMessage = {
          role: 'system',
          content: `${systemMessagePrefix}\n${context}`
        }

        // Find existing system message or prepend
        const systemIndex = enhancedMessages.findIndex(m => m.role === 'system')
        if (systemIndex >= 0) {
          // Append context to existing system message
          enhancedMessages[systemIndex] = {
            ...enhancedMessages[systemIndex],
            content: `${enhancedMessages[systemIndex].content}\n\n${contextMessage.content}`
          }
        } else {
          // Prepend context as new system message
          enhancedMessages = [contextMessage, ...enhancedMessages]
        }
      }

      return {
        context,
        memories,
        enhancedMessages,
        userId
      }
    },

    /**
     * Middleware to run after chat completion
     * Stores the conversation in memory
     */
    async afterChat(
      messages: AIMessage[],
      assistantResponse: string,
      req?: Request,
      options?: {
        userId?: string
        metadata?: Record<string, any>
      }
    ): Promise<AfterChatResult> {
      if (!autoStore) {
        return { success: true }
      }

      const userId = options?.userId || await resolveUserId(req)
      const client = getClient(userId)

      try {
        // Convert to conversation format
        const conversation: ConversationMessage[] = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))

        // Add the new assistant response
        conversation.push({
          role: 'assistant',
          content: assistantResponse
        })

        // Extract and store memories
        const memories = await client.rawClient.extractFromConversation(
          userId,
          conversation
        )

        return {
          success: true,
          memories
        }
      } catch (error) {
        console.warn('[Memphora] Failed to store conversation:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },

    /**
     * Get context for a query without modifying messages
     */
    async getContext(
      query: string,
      req?: Request,
      options?: { userId?: string }
    ): Promise<{ context: string; memories: Memory[] }> {
      const userId = options?.userId || await resolveUserId(req)
      const client = getClient(userId)

      try {
        const result = await client.search(query, maxMemories)
        let memories: Memory[] = []
        let context = ''
        if (result.facts && result.facts.length > 0) {
          context = result.facts.map((f: { text: string }) => `- ${f.text}`).join('\n')
          memories = result.facts.map((f: { text: string; memory_id?: string }) => ({
            id: f.memory_id || '',
            content: f.text
          })) as Memory[]
        }
        return { context, memories }
      } catch (error) {
        console.warn('[Memphora] Failed to get context:', error)
        return { context: '', memories: [] }
      }
    },

    /**
     * Store a memory directly
     */
    async store(
      content: string,
      req?: Request,
      options?: {
        userId?: string
        metadata?: Record<string, any>
      }
    ): Promise<Memory | null> {
      const userId = options?.userId || await resolveUserId(req)
      const client = getClient(userId)

      try {
        return await client.store(content, options?.metadata)
      } catch (error) {
        console.warn('[Memphora] Failed to store memory:', error)
        return null
      }
    }
  }
}

// ============================================================================
// React Hooks (for client-side usage)
// ============================================================================

/**
 * Configuration for useMemphora hook
 */
export interface UseMemphoraConfig {
  userId: string
  apiKey: string
  apiUrl?: string
}

/**
 * Create a Memphora instance for React components
 * 
 * Note: This should be used in a context provider or with useMemo
 * to avoid creating new instances on every render.
 * 
 * @example
 * ```typescript
 * // In a React component
 * const memphora = useMemo(() => createMemphoraClient({
 *   userId: user.id,
 *   apiKey: process.env.NEXT_PUBLIC_MEMPHORA_API_KEY!
 * }), [user.id])
 * 
 * // Get context before sending message
 * const context = await memphora.getContext(userMessage)
 * ```
 */
export function createMemphoraClient(config: UseMemphoraConfig): Memphora {
  return new Memphora({
    userId: config.userId,
    apiKey: config.apiKey,
    apiUrl: config.apiUrl
  })
}

// ============================================================================
// Streaming Utilities
// ============================================================================

/**
 * Wrap a streaming response to auto-store after completion
 * 
 * @example
 * ```typescript
 * const stream = await openai.chat.completions.create({ stream: true, ... })
 * return wrapStreamWithMemory(stream, memphora, messages, userId)
 * ```
 */
export function wrapStreamWithMemory<T extends AsyncIterable<any>>(
  stream: T,
  memphora: ReturnType<typeof createMemphoraMiddleware>,
  messages: AIMessage[],
  userId: string
): AsyncIterable<any> & { memoryPromise: Promise<AfterChatResult> } {
  let fullResponse = ''
  let resolveMemory: (result: AfterChatResult) => void
  const memoryPromise = new Promise<AfterChatResult>(resolve => {
    resolveMemory = resolve
  })

  const wrappedStream = {
    [Symbol.asyncIterator]: async function* () {
      try {
        for await (const chunk of stream) {
          // Extract content from chunk (handles OpenAI format)
          const content = chunk.choices?.[0]?.delta?.content ||
            chunk.delta?.content ||
            chunk.content ||
            ''
          fullResponse += content
          yield chunk
        }
      } finally {
        // Store conversation after stream completes
        const result = await memphora.afterChat(messages, fullResponse, undefined, { userId })
        resolveMemory(result)
      }
    },
    memoryPromise
  }

  return wrappedStream as any
}

// ============================================================================
// Edge Runtime Utilities
// ============================================================================

/**
 * Create a lightweight Memphora client for Edge Runtime
 * Uses fetch instead of axios for better Edge compatibility
 */
export function createEdgeClient(config: {
  apiKey: string
  apiUrl?: string
}) {
  const baseUrl = config.apiUrl || 'https://api.memphora.ai/api/v1'
  const headers = {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json'
  }

  return {
    async search(userId: string, query: string, limit = 10): Promise<Memory[]> {
      const response = await fetch(`${baseUrl}/memories/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, query, limit })
      })
      if (!response.ok) throw new Error(`Search failed: ${response.status}`)
      const data = await response.json() as Memory[] | { memories: Memory[] }
      return Array.isArray(data) ? data : data.memories || []
    },

    async store(userId: string, content: string, metadata?: Record<string, any>): Promise<Memory> {
      const response = await fetch(`${baseUrl}/memories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, content, metadata })
      })
      if (!response.ok) throw new Error(`Store failed: ${response.status}`)
      return response.json() as Promise<Memory>
    },

    async extractConversation(
      userId: string,
      messages: ConversationMessage[],
      metadata?: Record<string, any>
    ): Promise<Memory[]> {
      const response = await fetch(`${baseUrl}/conversations/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, messages, metadata })
      })
      if (!response.ok) throw new Error(`Extract failed: ${response.status}`)
      const data = await response.json() as { memories: Memory[] }
      return data.memories || []
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export type MemphoraMiddleware = ReturnType<typeof createMemphoraMiddleware>
export type EdgeClient = ReturnType<typeof createEdgeClient>
