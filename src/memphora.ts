/**
 * Memphora - High-level SDK for easy integration
 */

import { MemoryClient } from './memory-client'
import type { Memory, ConversationMessage, ComplianceEvent } from './types'

export interface MemphoraOptions {
  userId: string
  apiKey: string        // Required: API key from https://memphora.ai/dashboard
  apiUrl?: string
  autoCompress?: boolean
  maxTokens?: number
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
    // Store complete memory directly (preserves exact content)
    // With optimized storage, this is fast (~50ms) and maintains data quality
    return await this.client.addMemory(this.userId, content, metadata)
  }

  /**
   * Search memories with optional external reranking
   */
  async search(
    query: string,
    limit: number = 5,
    options?: {
      rerank?: boolean
      rerank_provider?: 'cohere' | 'jina' | 'auto'
      cohere_api_key?: string
      jina_api_key?: string
    }
  ): Promise<Memory[]> {
    return this.client.searchMemories(this.userId, query, limit, options)
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
   * Get rolling summary of all conversations
   */
  async getSummary(): Promise<any> {
    return this.client.getSummary(this.userId)
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
   * Get a specific memory by ID
   */
  async getMemory(memoryId: string): Promise<Memory> {
    return this.client.getMemory(memoryId)
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<any> {
    return this.client.getConversation(conversationId)
  }

  /**
   * Store a memory for a specific agent
   */
  async storeAgentMemory(
    agentId: string,
    content: string,
    runId?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.client.storeAgentMemory(this.userId, agentId, content, runId, metadata)
  }

  /**
   * Search memories for a specific agent
   */
  async searchAgentMemories(
    agentId: string,
    query: string,
    runId?: string,
    limit: number = 10
  ): Promise<Memory[]> {
    return this.client.searchAgentMemories(this.userId, agentId, query, runId, limit)
  }

  /**
   * Get all memories for a specific agent
   */
  async getAgentMemories(agentId: string, limit: number = 100): Promise<Memory[]> {
    return this.client.getAgentMemories(this.userId, agentId, limit)
  }

  /**
   * Store a shared memory for a group
   */
  async storeGroupMemory(
    groupId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.client.storeGroupMemory(this.userId, groupId, content, metadata)
  }

  /**
   * Search memories for a group
   */
  async searchGroupMemories(
    groupId: string,
    query: string,
    limit: number = 10
  ): Promise<Memory[]> {
    return this.client.searchGroupMemories(this.userId, groupId, query, limit)
  }

  /**
   * Get context for a group
   */
  async getGroupContext(groupId: string, limit: number = 50): Promise<any> {
    return this.client.getGroupContext(this.userId, groupId, limit)
  }

  /**
   * Get user's memory statistics and insights
   */
  async getUserAnalytics(): Promise<any> {
    return this.client.getUserAnalytics(this.userId)
  }

  /**
   * Track memory growth over time
   */
  async getMemoryGrowth(days: number = 30): Promise<any> {
    return this.client.getMemoryGrowth(this.userId, days)
  }

  /**
   * Get memories related to a specific memory
   */
  async getRelatedMemories(memoryId: string, limit: number = 10): Promise<Memory[]> {
    const context = await this.client.getMemoryContext(memoryId, 1)
    return (context.related_memories || []).slice(0, limit)
  }


  /**
   * Link two memories in the graph
   */
  async link(
    memoryId: string,
    targetId: string,
    relationshipType: 'related' | 'contradicts' | 'supports' | 'extends' = 'related'
  ): Promise<any> {
    return this.client.linkMemories(memoryId, targetId, relationshipType)
  }

  /**
   * Find shortest path between two memories in the graph
   */
  async findPath(sourceId: string, targetId: string): Promise<any> {
    return this.client.findMemoryPath(sourceId, targetId)
  }

  /**
   * Get optimized context for a query (returns formatted string)
   */
  async getOptimizedContext(
    query: string,
    maxTokens: number = 2000,
    maxMemories: number = 20,
    useCompression: boolean = true,
    useCache: boolean = true
  ): Promise<string> {
    const result = await this.searchOptimized(query, {
      max_tokens: maxTokens,
      max_memories: maxMemories,
      use_compression: useCompression,
      use_cache: useCache
    })
    return result.context || ''
  }

  /**
   * Get enhanced context for a query (returns formatted string)
   */
  async getEnhancedContext(
    query: string,
    maxTokens: number = 1500,
    maxMemories: number = 15,
    useCompression: boolean = true
  ): Promise<string> {
    const result = await this.searchEnhanced(query, {
      max_tokens: maxTokens,
      max_memories: maxMemories,
      use_compression: useCompression
    })
    return result.context || ''
  }

  /**
   * Compare two versions of a memory
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<any> {
    return this.client.compareVersions(versionId1, versionId2)
  }

  /**
   * Upload an image from bytes data
   */
  async uploadImage(
    imageData: Blob | File | ArrayBuffer,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.client.uploadImage(this.userId, imageData, filename, metadata)
  }

  /**
   * Make text more concise
   */
  async concise(text: string): Promise<any> {
    return this.client.conciseText(text)
  }

  /**
   * Check API health
   */
  async health(): Promise<any> {
    return this.client.healthCheck()
  }

  /**
   * Webhooks - Create a webhook
   */
  async createWebhook(
    url: string,
    events: string[],
    secret?: string
  ): Promise<any> {
    return this.client.createWebhook(url, events, secret)
  }

  /**
   * Webhooks - List all webhooks
   */
  async listWebhooks(userId?: string): Promise<any[]> {
    return this.client.listWebhooks(userId)
  }

  /**
   * Webhooks - Get a specific webhook
   */
  async getWebhook(webhookId: string): Promise<any> {
    return this.client.getWebhook(webhookId)
  }

  /**
   * Webhooks - Update a webhook
   */
  async updateWebhook(
    webhookId: string,
    options?: {
      url?: string
      events?: string[]
      secret?: string
      active?: boolean
    }
  ): Promise<any> {
    return this.client.updateWebhook(webhookId, options)
  }

  /**
   * Webhooks - Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<any> {
    return this.client.deleteWebhook(webhookId)
  }

  /**
   * Webhooks - Test a webhook
   */
  async testWebhook(webhookId: string): Promise<any> {
    return this.client.testWebhook(webhookId)
  }

  /**
   * Security & Compliance - Export GDPR data
   */
  async exportGdpr(): Promise<any> {
    return this.client.exportGdpr(this.userId)
  }

  /**
   * Security & Compliance - Delete GDPR data
   */
  async deleteGdpr(): Promise<any> {
    return this.client.deleteGdpr(this.userId)
  }

  /**
   * Security & Compliance - Set retention policy
   */
  async setRetentionPolicy(
    dataType: string,
    retentionDays: number,
    options?: {
      organizationId?: string
      autoDelete?: boolean
    }
  ): Promise<any> {
    return this.client.setRetentionPolicy(dataType, retentionDays, {
      ...options,
      userId: this.userId
    })
  }

  /**
   * Security & Compliance - Apply retention policies
   */
  async applyRetentionPolicies(options?: {
    organizationId?: string
  }): Promise<any> {
    return this.client.applyRetentionPolicies({
      ...options,
      userId: this.userId
    })
  }

  /**
   * Security & Compliance - Get compliance report
   */
  async getComplianceReport(
    organizationId: string,
    complianceType?: string
  ): Promise<any> {
    return this.client.getComplianceReport(organizationId, complianceType)
  }

  /**
   * Security & Compliance - Record compliance event
   */
  async recordComplianceEvent(event: Omit<ComplianceEvent, 'user_id'>): Promise<any> {
    return this.client.recordComplianceEvent({
      ...event,
      user_id: this.userId
    } as ComplianceEvent)
  }

  /**
   * Security & Compliance - Encrypt data
   */
  async encryptData(data: string): Promise<any> {
    return this.client.encryptData(data)
  }

  /**
   * Security & Compliance - Decrypt data
   */
  async decryptData(encryptedData: string): Promise<any> {
    return this.client.decryptData(encryptedData)
  }

  /**
   * Observability - Get metrics
   */
  async getMetrics(): Promise<any> {
    return this.client.getMetrics()
  }

  /**
   * Observability - Get metrics summary
   */
  async getMetricsSummary(): Promise<any> {
    return this.client.getMetricsSummary()
  }

  /**
   * Observability - Get audit logs
   */
  async getAuditLogs(options?: {
    limit?: number
  }): Promise<any[]> {
    return this.client.getAuditLogs({
      ...options,
      userId: this.userId
    })
  }

  /**
   * Access the underlying client for advanced operations
   * Use this to access methods not exposed in the high-level API
   */
  get rawClient(): MemoryClient {
    return this.client
  }
}

