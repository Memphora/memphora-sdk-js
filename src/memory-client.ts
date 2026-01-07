/**
 * MemoryClient - Low-level API client for Memphora
 */

import type {
  Memory,
  SearchOptions,
  AdvancedSearchOptions,
  ConversationMessage,
  Webhook,
  ComplianceEvent,
} from './types'

export class MemoryClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string = 'https://api.memphora.ai/api/v1', apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: any
      params?: Record<string, any>
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  // Basic Memory Operations
  async addMemory(userId: string, content: string, metadata?: Record<string, any>): Promise<Memory> {
    return this.request<Memory>('POST', '/memories', {
      body: { user_id: userId, content, metadata: metadata || {} },
    })
  }

  async getMemory(memoryId: string): Promise<Memory> {
    return this.request<Memory>('GET', `/memories/${memoryId}`)
  }

  async getUserMemories(userId: string, limit: number = 100): Promise<Memory[]> {
    return this.request<Memory[]>('GET', `/memories/user/${userId}`, {
      params: { limit },
    })
  }

  /**
   * Search memories - returns structured response with facts, context, and metadata
   */
  async searchMemories(
    userId: string,
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
    const body: any = {
      user_id: userId,
      query,
      limit,
      rerank: options?.rerank || false,
      rerank_provider: options?.rerank_provider || 'auto',
    }

    if (options?.cohere_api_key) {
      body.cohere_api_key = options.cohere_api_key
    }
    if (options?.jina_api_key) {
      body.jina_api_key = options.jina_api_key
    }

    return this.request<{
      facts: Array<{ text: string; memory_id?: string; timestamp?: string; similarity?: number }>
      critical_context?: string
      metadata?: Record<string, any>
    }>('POST', '/memories/search', {
      body,
    })
  }

  async updateMemory(
    memoryId: string,
    content?: string,
    metadata?: Record<string, any>
  ): Promise<Memory> {
    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (metadata !== undefined) updateData.metadata = metadata

    return this.request<Memory>('PUT', `/memories/${memoryId}`, {
      body: updateData,
    })
  }

  async deleteMemory(memoryId: string): Promise<boolean> {
    await this.request('DELETE', `/memories/${memoryId}`)
    return true
  }

  // Advanced Memory Operations
  async createAdvancedMemory(
    userId: string,
    content: string,
    metadata?: Record<string, any>,
    linkTo?: string[]
  ): Promise<Memory> {
    return this.request<Memory>('POST', '/memories/advanced', {
      body: {
        user_id: userId,
        content,
        metadata: metadata || {},
        link_to: linkTo || [],
      },
    })
  }

  async searchAdvanced(userId: string, query: string, options?: SearchOptions): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/memories/search/advanced', {
      body: {
        user_id: userId,
        query,
        limit: options?.limit || 5,
        filters: options?.filters || {},
        include_related: options?.include_related || false,
        min_score: options?.min_score || 0.0,
        sort_by: options?.sort_by || 'relevance',
      },
    })
  }

  async searchOptimized(userId: string, query: string, options?: AdvancedSearchOptions): Promise<any> {
    return this.request('POST', '/memories/search/optimized', {
      body: {
        user_id: userId,
        query,
        max_tokens: options?.max_tokens || 2000,
        max_memories: options?.max_memories || 20,
        use_compression: options?.use_compression !== false,
        use_cache: options?.use_cache !== false,
      },
    })
  }

  async searchEnhanced(userId: string, query: string, options?: AdvancedSearchOptions): Promise<any> {
    return this.request('POST', '/memories/search/enhanced', {
      body: {
        user_id: userId,
        query,
        max_tokens: options?.max_tokens || 2000,
        max_memories: options?.max_memories || 20,
        use_compression: options?.use_compression !== false,
      },
    })
  }

  // Conversation Operations
  async extractFromConversation(userId: string, conversation: ConversationMessage[]): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/conversations/extract', {
      body: { user_id: userId, conversation },
    })
  }

  async extractFromContent(userId: string, content: string, metadata?: Record<string, any>): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/memories/extract', {
      body: { user_id: userId, content, metadata: metadata || {} },
    })
  }

  // Advanced Memory Operations (continued)
  async batchCreate(
    userId: string,
    memories: Array<{ content: string; metadata?: Record<string, any> }>,
    linkRelated: boolean = true
  ): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/memories/batch', {
      body: {
        user_id: userId,
        memories,
        link_related: linkRelated,
      },
    })
  }

  async mergeMemories(
    memoryIds: string[],
    mergeStrategy: 'combine' | 'keep_latest' | 'keep_most_relevant' = 'combine'
  ): Promise<Memory> {
    return this.request<Memory>('POST', '/memories/merge', {
      body: {
        memory_ids: memoryIds,
        merge_strategy: mergeStrategy,
      },
    })
  }

  async findContradictions(memoryId: string, similarityThreshold: number = 0.7): Promise<Memory[]> {
    return this.request<Memory[]>('GET', `/memories/${memoryId}/contradictions`, {
      params: { similarity_threshold: similarityThreshold },
    })
  }

  async linkMemories(
    memoryId: string,
    targetId: string,
    relationshipType: 'related' | 'contradicts' | 'supports' | 'extends' = 'related'
  ): Promise<any> {
    return this.request('POST', `/memories/${memoryId}/link`, {
      params: {
        target_id: targetId,
        relationship_type: relationshipType,
      },
    })
  }

  async getMemoryContext(memoryId: string, depth: number = 2): Promise<any> {
    return this.request('GET', `/memories/${memoryId}/context`, {
      params: { depth },
    })
  }

  async findMemoryPath(sourceId: string, targetId: string): Promise<any> {
    return this.request('GET', `/memories/${sourceId}/path/${targetId}`)
  }

  // Export/Import
  async exportMemories(userId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    return this.request('GET', `/users/${userId}/export`, {
      params: { format },
    })
  }

  async importMemories(userId: string, data: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    return this.request('POST', `/users/${userId}/import`, {
      params: { format },
      body: { data },
    })
  }

  // Statistics
  async getUserStatistics(userId: string): Promise<any> {
    return this.request('GET', `/users/${userId}/statistics`)
  }

  async getGlobalStatistics(): Promise<any> {
    return this.request('GET', '/statistics')
  }

  async deleteAllUserMemories(userId: string): Promise<any> {
    return this.request('DELETE', `/users/${userId}/memories`)
  }

  // Retention Policies
  async setRetentionPolicy(
    dataType: string,
    retentionDays: number,
    options?: {
      organizationId?: string
      userId?: string
      autoDelete?: boolean
    }
  ): Promise<any> {
    return this.request('POST', '/security/retention-policies', {
      body: {
        data_type: dataType,
        retention_days: retentionDays,
        organization_id: options?.organizationId,
        user_id: options?.userId,
        auto_delete: options?.autoDelete || false,
      },
    })
  }

  async applyRetentionPolicies(options?: {
    organizationId?: string
    userId?: string
  }): Promise<any> {
    const params: Record<string, string> = {}
    if (options?.organizationId) params.organization_id = options.organizationId
    if (options?.userId) params.user_id = options.userId

    return this.request('POST', '/security/apply-retention', { params })
  }

  // Memory Versioning
  async getMemoryVersions(memoryId: string, limit: number = 50): Promise<any[]> {
    return this.request<any[]>('GET', `/memories/${memoryId}/versions`, {
      params: { limit },
    })
  }

  async getVersion(versionId: string): Promise<any> {
    return this.request('GET', `/versions/${versionId}`)
  }

  async getVersionHistory(
    memoryId: string,
    options?: {
      fromVersion?: number
      toVersion?: number
    }
  ): Promise<any[]> {
    const params: Record<string, number> = {}
    if (options?.fromVersion !== undefined) params.from_version = options.fromVersion
    if (options?.toVersion !== undefined) params.to_version = options.toVersion

    return this.request<any[]>('GET', `/memories/${memoryId}/history`, { params })
  }

  async rollbackMemory(memoryId: string, targetVersion: number, userId: string): Promise<any> {
    return this.request('POST', `/memories/${memoryId}/rollback`, {
      params: { user_id: userId },
      body: { target_version: targetVersion },
    })
  }

  async compareVersions(versionId1: string, versionId2: string): Promise<any> {
    return this.request('GET', '/versions/compare', {
      params: {
        version_id_1: versionId1,
        version_id_2: versionId2,
      },
    })
  }

  // Conversation Features
  async recordConversation(
    userId: string,
    conversation: ConversationMessage[],
    options?: {
      platform?: string
      metadata?: Record<string, any>
    }
  ): Promise<any> {
    return this.request('POST', '/conversations/record', {
      body: {
        user_id: userId,
        conversation,
        platform: options?.platform || 'unknown',
        metadata: options?.metadata || {},
      },
    })
  }

  async getConversation(conversationId: string): Promise<any> {
    try {
      return await this.request('GET', `/conversations/${conversationId}`)
    } catch (error: any) {
      // Handle 404 by returning empty dict for backward compatibility (matches Python SDK behavior)
      // The request method throws Error with message like "HTTP 404: Not Found"
      if (error.message && (error.message.includes('404') || error.message.includes('Not found'))) {
        return {}
      }
      throw error
    }
  }

  async getSummary(userId: string): Promise<any> {
    return this.request('GET', `/memory/summary/${userId}`)
  }

  async getUserConversations(
    userId: string,
    options?: {
      platform?: string
      limit?: number
    }
  ): Promise<any[]> {
    const params: Record<string, any> = { limit: options?.limit || 50 }
    if (options?.platform) params.platform = options.platform

    return this.request<any[]>('GET', `/conversations/user/${userId}`, { params })
  }

  async summarizeConversation(
    conversation: ConversationMessage[],
    summaryType: 'brief' | 'detailed' | 'topics' | 'action_items' = 'brief'
  ): Promise<any> {
    return this.request('POST', '/conversations/summarize', {
      body: {
        conversation,
        summary_type: summaryType,
      },
    })
  }

  // Text Features
  async conciseText(text: string): Promise<any> {
    return this.request('POST', '/text/conciser', {
      body: { text },
    })
  }

  // Multimodal Features
  async storeImage(
    userId: string,
    options?: {
      imageUrl?: string
      imageBase64?: string  // camelCase parameter (TypeScript convention)
      description?: string
      metadata?: Record<string, any>
    }
  ): Promise<any> {
    return this.request('POST', '/memories/image', {
      body: {
        user_id: userId,
        image_url: options?.imageUrl,
        image_base64: options?.imageBase64,  // snake_case in request body (consistent with Python SDK)
        description: options?.description,
        metadata: options?.metadata || {},
      },
    })
  }

  async uploadImage(
    userId: string,
    imageData: Blob | File | ArrayBuffer,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    // Determine MIME type from filename extension
    const getMimeType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop() || ''
      const mimeTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'ico': 'image/x-icon'
      }
      return mimeTypes[ext] || 'image/png' // Default to PNG if unknown
    }

    const mimeType = getMimeType(filename)

    // Create Blob with correct MIME type
    let blob: Blob
    if (imageData instanceof Blob) {
      // If it's already a Blob, use it as-is (it should have the correct type)
      blob = imageData
    } else if (imageData instanceof File) {
      // If it's a File, use it as-is (it has the correct type)
      blob = imageData
    } else {
      // ArrayBuffer - create Blob with detected MIME type
      blob = new Blob([imageData], { type: mimeType })
    }

    const formData = new FormData()
    formData.append('file', blob, filename)
    // Note: user_id is sent as query parameter, not form data
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`
    }

    const url = new URL(`${this.baseUrl}/memories/image/upload`)
    url.searchParams.append('user_id', userId)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async searchImages(userId: string, query: string, limit: number = 5): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/memories/image/search', {
      body: {
        user_id: userId,
        query,
        limit,
      },
    })
  }

  // Document & Visual Processing

  /**
   * Ingest any document type into memory.
   */
  async ingestDocument(
    userId: string,
    contentType: string,
    options?: {
      url?: string
      data?: string
      text?: string
      metadata?: Record<string, any>
      asyncProcessing?: boolean
    }
  ): Promise<any> {
    const content: Record<string, any> = { type: contentType }
    if (options?.url) content.url = options.url
    if (options?.data) content.data = options.data
    if (options?.text) content.text = options.text

    return this.request('POST', '/documents', {
      body: {
        user_id: userId,
        content,
        metadata: options?.metadata || {},
        async_processing: options?.asyncProcessing !== false
      }
    })
  }

  /**
   * Get a fresh signed URL for an image memory.
   */
  async getImageUrl(memoryId: string): Promise<any> {
    return this.request('GET', `/memories/image/${memoryId}/url`)
  }

  /**
   * Upload any document type and create memories.
   * Supports PDF, images, text files, markdown, JSON, CSV, and more.
   */
  async uploadDocument(
    userId: string,
    fileData: Blob | File | ArrayBuffer,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    // Determine MIME type from filename extension
    const getMimeType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop() || ''
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'json': 'application/json',
        'csv': 'text/csv',
        'xml': 'application/xml',
      }
      return mimeTypes[ext] || 'application/octet-stream'
    }

    const mimeType = getMimeType(filename)

    // Create Blob with correct MIME type
    let blob: Blob
    if (fileData instanceof Blob) {
      blob = fileData
    } else if (fileData instanceof File) {
      blob = fileData
    } else {
      blob = new Blob([fileData], { type: mimeType })
    }

    const formData = new FormData()
    formData.append('file', blob, filename)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`
    }

    const url = new URL(`${this.baseUrl}/documents/upload`)
    url.searchParams.append('user_id', userId)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Security & Compliance
  async exportGdpr(userId: string): Promise<any> {
    return this.request('GET', `/security/compliance/gdpr/export/${userId}`)
  }

  async deleteGdpr(userId: string): Promise<any> {
    return this.request('DELETE', `/security/compliance/gdpr/delete/${userId}`)
  }

  async recordComplianceEvent(event: ComplianceEvent): Promise<any> {
    return this.request('POST', '/security/compliance-events', {
      body: {
        compliance_type: event.compliance_type,
        event_type: event.event_type,
        user_id: event.user_id,
        organization_id: event.organization_id,
        data_subject_id: event.data_subject_id,
        details: event.details || {},
      },
    })
  }

  async encryptData(data: string): Promise<any> {
    return this.request('POST', '/security/encrypt', {
      body: { data },
    })
  }

  async decryptData(encryptedData: string): Promise<any> {
    return this.request('POST', '/security/decrypt', {
      body: { encrypted_data: encryptedData },
    })
  }

  async getComplianceReport(organizationId: string, complianceType?: string): Promise<any> {
    const params: Record<string, string> = {}
    if (complianceType) params.compliance_type = complianceType

    return this.request('GET', `/security/compliance/report/${organizationId}`, { params })
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('GET', '/health')
  }

  // Webhooks
  async createWebhook(
    url: string,
    events: string[],
    secret?: string
  ): Promise<Webhook> {
    return this.request<Webhook>('POST', '/webhooks', {
      body: {
        url,
        events,
        secret,
      },
    })
  }

  async listWebhooks(userId?: string): Promise<Webhook[]> {
    const params: Record<string, string> = {}
    if (userId) params.user_id = userId

    return this.request<Webhook[]>('GET', '/webhooks', { params })
  }

  async getWebhook(webhookId: string): Promise<Webhook> {
    return this.request<Webhook>('GET', `/webhooks/${webhookId}`)
  }

  async updateWebhook(
    webhookId: string,
    options?: {
      url?: string
      events?: string[]
      secret?: string
      active?: boolean
    }
  ): Promise<Webhook> {
    const updateData: any = {}
    if (options?.url !== undefined) updateData.url = options.url
    if (options?.events !== undefined) updateData.events = options.events
    if (options?.secret !== undefined) updateData.secret = options.secret
    if (options?.active !== undefined) updateData.active = options.active

    return this.request<Webhook>('PUT', `/webhooks/${webhookId}`, {
      body: updateData,
    })
  }

  async deleteWebhook(webhookId: string): Promise<any> {
    return this.request('DELETE', `/webhooks/${webhookId}`)
  }

  async testWebhook(webhookId: string): Promise<any> {
    return this.request('POST', `/webhooks/${webhookId}/test`)
  }

  // Observability
  async getMetrics(): Promise<any> {
    return this.request('GET', '/metrics')
  }

  async getMetricsSummary(): Promise<any> {
    return this.request('GET', '/metrics/summary')
  }

  async getAuditLogs(options?: {
    userId?: string
    limit?: number
  }): Promise<any[]> {
    const params: Record<string, any> = { limit: options?.limit || 100 }
    if (options?.userId) params.user_id = options.userId

    return this.request<any[]>('GET', '/audit-logs', { params })
  }

  // Multi-Agent Support
  async storeAgentMemory(
    userId: string,
    agentId: string,
    content: string,
    runId?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.request('POST', '/agents/memories', {
      body: {
        user_id: userId,
        agent_id: agentId,
        content,
        run_id: runId,
        metadata: metadata || {},
      },
    })
  }

  async searchAgentMemories(
    userId: string,
    agentId: string,
    query: string,
    runId?: string,
    limit: number = 10
  ): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/agents/memories/search', {
      body: {
        user_id: userId,
        agent_id: agentId,
        query,
        run_id: runId,
        limit,
      },
    })
  }

  async getAgentMemories(userId: string, agentId: string, limit: number = 100): Promise<Memory[]> {
    return this.request<Memory[]>('GET', `/agents/${agentId}/memories`, {
      params: { user_id: userId, limit },
    })
  }

  // Group/Collaborative Features
  async storeGroupMemory(
    userId: string,
    groupId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.request('POST', '/groups/memories', {
      body: {
        user_id: userId,
        group_id: groupId,
        content,
        metadata: metadata || {},
      },
    })
  }

  async searchGroupMemories(
    userId: string,
    groupId: string,
    query: string,
    limit: number = 10
  ): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/groups/memories/search', {
      body: {
        user_id: userId,
        group_id: groupId,
        query,
        limit,
      },
    })
  }

  async getGroupContext(userId: string, groupId: string, limit: number = 50): Promise<any> {
    return this.request('GET', `/groups/${groupId}/context`, {
      params: { user_id: userId, limit },
    })
  }

  // User Analytics
  async getUserAnalytics(userId: string): Promise<any> {
    return this.request('GET', `/analytics/user-stats/${userId}`)
  }

  async getMemoryGrowth(userId: string, days: number = 30): Promise<any> {
    return this.request('GET', '/analytics/memory-growth', {
      params: { days, user_id: userId },
    })
  }
}

