/**
 * Memphora - High-level SDK for easy integration
 */

import { MemoryClient } from './memory-client'
import type { Memory, ConversationMessage } from './types'

export interface MemphoraOptions {
  userId: string        // Required: Unique user identifier for tracking
  apiKey: string        // Required: API key from https://memphora.ai/dashboard
  apiUrl?: string       // Optional: Custom API URL (default: https://api.memphora.ai/api/v1)
  autoCompress?: boolean // Optional: Auto-compress context (default: true)
  maxTokens?: number    // Optional: Maximum tokens for context (default: 500)
}

export class Memphora {
  private userId: string
  private client: MemoryClient
  private autoCompress: boolean
  private maxTokens: number

  constructor(options: MemphoraOptions) {
    this.userId = options.userId
    this.client = new MemoryClient(
      options.apiUrl || 'https://api.memphora.ai/api/v1',
      options.apiKey
    )
    this.autoCompress = options.autoCompress !== false
    this.maxTokens = options.maxTokens || 500
  }

  /**
   * Store a memory
   */
  async store(content: string, metadata?: Record<string, any>): Promise<Memory> {
    // Automatically extract and store memories
    const extracted = await this.client.extractFromContent(this.userId, content, metadata)
    return extracted[0] || (await this.client.addMemory(this.userId, content, metadata))
  }

  /**
   * Search memories
   */
  async search(query: string, limit: number = 5): Promise<Memory[]> {
    return this.client.searchMemories(this.userId, query, limit)
  }

  /**
   * Get context for a query
   */
  async getContext(query: string, limit: number = 5): Promise<string> {
    const memories = await this.search(query, limit)
    
    if (memories.length === 0) {
      return ''
    }

    const contextLines = memories.map(mem => `- ${mem.content}`)
    return 'Relevant context from past conversations:\n' + contextLines.join('\n')
  }

  /**
   * Store a conversation
   */
  async storeConversation(userMessage: string, assistantResponse: string): Promise<Memory[]> {
    const conversation: ConversationMessage[] = [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse },
    ]
    return this.client.extractFromConversation(this.userId, conversation)
  }

  /**
   * Remember decorator for automatic memory integration
   */
  remember<T extends (...args: any[]) => any>(fn: T): T {
    return (async (...args: any[]) => {
      // Extract user message from first argument
      const userMessage = typeof args[0] === 'string' ? args[0] : null

      // Get relevant context
      let context = ''
      if (userMessage) {
        context = await this.getContext(userMessage)
      }

      // Call original function
      const result = await fn(...args)

      // Store conversation if we have both message and response
      if (userMessage && result) {
        await this.storeConversation(userMessage, String(result))
      }

      return result
    }) as T
  }

  /**
   * Get all user memories
   */
  async getAll(limit: number = 100): Promise<Memory[]> {
    return this.client.getUserMemories(this.userId, limit)
  }

  /**
   * Update a memory
   */
  async update(memoryId: string, content?: string, metadata?: Record<string, any>): Promise<Memory> {
    return this.client.updateMemory(memoryId, content, metadata)
  }

  /**
   * Delete a memory
   */
  async delete(memoryId: string): Promise<boolean> {
    return this.client.deleteMemory(memoryId)
  }

  /**
   * Advanced search with options
   */
  async searchAdvanced(query: string, options?: {
    limit?: number
    filters?: Record<string, any>
    include_related?: boolean
    min_score?: number
    sort_by?: 'relevance' | 'recency' | 'importance'
  }): Promise<Memory[]> {
    return this.client.searchAdvanced(this.userId, query, options)
  }

  /**
   * Optimized search for better performance
   */
  async searchOptimized(query: string, options?: {
    max_tokens?: number
    max_memories?: number
    use_compression?: boolean
    use_cache?: boolean
  }): Promise<any> {
    return this.client.searchOptimized(this.userId, query, options)
  }

  /**
   * Enhanced search with maximum performance
   */
  async searchEnhanced(query: string, options?: {
    max_tokens?: number
    max_memories?: number
    use_compression?: boolean
  }): Promise<any> {
    return this.client.searchEnhanced(this.userId, query, options)
  }

  /**
   * Batch create multiple memories
   */
  async batchStore(
    memories: Array<{ content: string; metadata?: Record<string, any> }>,
    linkRelated: boolean = true
  ): Promise<Memory[]> {
    return this.client.batchCreate(this.userId, memories, linkRelated)
  }

  /**
   * Merge multiple memories
   */
  async merge(memoryIds: string[], strategy: 'combine' | 'keep_latest' | 'keep_most_relevant' = 'combine'): Promise<Memory> {
    return this.client.mergeMemories(memoryIds, strategy)
  }

  /**
   * Find contradictions for a memory
   */
  async findContradictions(memoryId: string, threshold: number = 0.7): Promise<Memory[]> {
    return this.client.findContradictions(memoryId, threshold)
  }

  /**
   * Get memory context with related memories
   */
  async getContextForMemory(memoryId: string, depth: number = 2): Promise<any> {
    return this.client.getMemoryContext(memoryId, depth)
  }

  /**
   * Export all memories
   */
  async export(format: 'json' | 'csv' = 'json'): Promise<any> {
    return this.client.exportMemories(this.userId, format)
  }

  /**
   * Import memories
   */
  async import(data: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    return this.client.importMemories(this.userId, data, format)
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<any> {
    return this.client.getUserStatistics(this.userId)
  }

  /**
   * Delete all user memories
   */
  async deleteAll(): Promise<any> {
    return this.client.deleteAllUserMemories(this.userId)
  }

  /**
   * Record a full conversation
   */
  async recordConversation(
    conversation: ConversationMessage[],
    platform?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.client.recordConversation(this.userId, conversation, { platform, metadata })
  }

  /**
   * Get user conversations
   */
  async getConversations(platform?: string, limit: number = 50): Promise<any[]> {
    return this.client.getUserConversations(this.userId, { platform, limit })
  }

  /**
   * Summarize a conversation
   */
  async summarizeConversation(
    conversation: ConversationMessage[],
    summaryType: 'brief' | 'detailed' | 'topics' | 'action_items' = 'brief'
  ): Promise<any> {
    return this.client.summarizeConversation(conversation, summaryType)
  }

  /**
   * Store an image memory
   */
  async storeImage(options?: {
    imageUrl?: string
    imageBase64?: string
    description?: string
    metadata?: Record<string, any>
  }): Promise<any> {
    return this.client.storeImage(this.userId, options)
  }

  /**
   * Search image memories
   */
  async searchImages(query: string, limit: number = 5): Promise<Memory[]> {
    return this.client.searchImages(this.userId, query, limit)
  }

  /**
   * Get memory versions
   */
  async getVersions(memoryId: string, limit: number = 50): Promise<any[]> {
    return this.client.getMemoryVersions(memoryId, limit)
  }

  /**
   * Rollback memory to a version
   */
  async rollback(memoryId: string, targetVersion: number): Promise<any> {
    return this.client.rollbackMemory(memoryId, targetVersion, this.userId)
  }

  /**
   * Access the underlying client for advanced operations
   * Use this to access methods not exposed in the high-level API
   */
  get rawClient(): MemoryClient {
    return this.client
  }
}

