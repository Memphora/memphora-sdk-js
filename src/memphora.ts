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
   * 
   * @returns SearchResult with:
   *   - facts: Array of matching facts with memory_id, text, timestamp, similarity
   *   - critical_context: Important context for LLM agents (if available)
   *   - metadata: Extracted metadata like key_entities, counts, dates
   * 
   * @example
   * const result = await memory.search("user preferences")
   * for (const fact of result.facts) {
   *   console.log(fact.text, fact.similarity)
   * }
   * if (result.critical_context) {
   *   console.log(`Important: ${result.critical_context}`)
   * }
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
  ): Promise<{
    facts: Array<{ text: string; memory_id?: string; timestamp?: string; similarity?: number }>
    critical_context?: string
    metadata?: Record<string, any>
  }> {
    return this.client.searchMemories(this.userId, query, limit, options)
  }

  /**
   * Get context for a query
   */
  async getContext(query: string, limit: number = 5): Promise<string> {
    const result = await this.search(query, limit)

    if (!result.facts || result.facts.length === 0) {
      return ''
    }

    const contextLines = result.facts.map((fact: { text: string }) => `- ${fact.text}`)
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
  async batchStore(
    memories: Array<{ content: string; metadata?: Record<string, any> }>,
    linkRelated: boolean = true
  ): Promise<Memory[]> {
    return this.client.batchCreate(this.userId, memories, linkRelated)
  }

  /**
   * Merge multiple memories
   */
  async export(format: 'json' | 'csv' = 'json'): Promise<any> {
    return this.client.exportMemories(this.userId, format)
  }

  /**
   * Import memories
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

  // Document & Visual Processing

  /**
   * Ingest any document type into memory.
   * 
   * Supports PDF, images, URLs, and plain text. Automatically extracts
   * and stores relevant information as searchable memories.
   * 
   * @param contentType - One of "pdf_url", "pdf_base64", "image_url", 
   *                      "image_base64", "url", or "text"
   * @param options.url - URL for pdf_url, image_url, or url types
   * @param options.data - Base64 data for pdf_base64 or image_base64 types
   * @param options.text - Plain text for text type
   * @param options.metadata - Optional metadata for the document
   * @param options.asyncProcessing - If true, returns immediately with job_id (default: true)
   * 
   * @returns If async: object with job_id for tracking. If sync: extracted memories.
   */
  async ingestDocument(
    contentType: 'pdf_url' | 'pdf_base64' | 'image_url' | 'image_base64' | 'url' | 'text',
    options?: {
      url?: string
      data?: string
      text?: string
      metadata?: Record<string, any>
      asyncProcessing?: boolean
    }
  ): Promise<any> {
    return this.client.ingestDocument(this.userId, contentType, options)
  }

  /**
   * Get a fresh signed URL for an image memory.
   * 
   * Signed URLs expire after 7 days. Use this to get a new URL
   * when the previous one has expired.
   * 
   * @param memoryId - ID of the image memory
   * @returns Object with image_url or error message
   */
  async getImageUrl(memoryId: string): Promise<any> {
    return this.client.getImageUrl(memoryId)
  }

  /**
   * Upload any document type and create memories.
   * 
   * Supports PDF, images, text files, markdown, JSON, CSV, and more.
   * Files are processed automatically based on file extension.
   * 
   * @param fileData - Raw file data (Blob, File, or ArrayBuffer)
   * @param filename - Filename with extension (e.g., "report.pdf", "notes.txt")
   * @param metadata - Optional metadata for the document
   * 
   * @returns Object with job_id for tracking (async processing)
   */
  async uploadDocument(
    fileData: Blob | File | ArrayBuffer,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.client.uploadDocument(this.userId, fileData, filename, metadata)
  }

  /**
   * Get memory versions
   */
  async getMemory(memoryId: string): Promise<Memory> {
    return this.client.getMemory(memoryId)
  }

  /**
   * Get a specific conversation by ID
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
   * @returns Structured response with facts array
   */
  async searchAgentMemories(
    agentId: string,
    query: string,
    runId?: string,
    limit: number = 10
  ): Promise<{
    facts: Array<{ text: string; memory_id?: string; timestamp?: string; similarity?: number }>
    agent_id: string
    metadata?: Record<string, any>
  }> {
    const memories = await this.client.searchAgentMemories(this.userId, agentId, query, runId, limit)
    // Convert to structured format matching main search()
    const facts = (memories as any[]).map((mem: any) => ({
      text: mem.content || '',
      memory_id: mem.id || mem.memory_id,
      timestamp: mem.timestamp,
      similarity: mem.similarity
    }))
    return {
      facts,
      agent_id: agentId,
      metadata: runId ? { run_id: runId } : {}
    }
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
   * @returns Structured response with facts array
   */
  async searchGroupMemories(
    groupId: string,
    query: string,
    limit: number = 10
  ): Promise<{
    facts: Array<{ text: string; memory_id?: string; timestamp?: string; similarity?: number }>
    group_id: string
    metadata?: Record<string, any>
  }> {
    const memories = await this.client.searchGroupMemories(this.userId, groupId, query, limit)
    // Convert to structured format matching main search()
    const facts = (memories as any[]).map((mem: any) => ({
      text: mem.content || '',
      memory_id: mem.id || mem.memory_id,
      timestamp: mem.timestamp,
      similarity: mem.similarity
    }))
    return {
      facts,
      group_id: groupId,
      metadata: {}
    }
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
  async uploadImage(
    imageData: Blob | File | ArrayBuffer,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.client.uploadImage(this.userId, imageData, filename, metadata)
  }

  /**
   * Check API health
   */
  async health(): Promise<any> {
    return this.client.healthCheck()
  }

  /**
   * Access the underlying client for advanced operations
   * Use this to access methods not exposed in the high-level API
   */
  get rawClient(): MemoryClient {
    return this.client
  }
}
