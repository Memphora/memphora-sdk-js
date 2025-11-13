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
  private apiKey?: string

  constructor(baseUrl: string = 'https://api.memphora.ai/api/v1', apiKey?: string) {
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
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
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

  async searchMemories(userId: string, query: string, limit: number = 5): Promise<Memory[]> {
    return this.request<Memory[]>('POST', '/memories/search', {
      body: { user_id: userId, query, limit },
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
    return this.request('GET', `/conversations/${conversationId}`)
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
      imageBase64?: string
      description?: string
      metadata?: Record<string, any>
    }
  ): Promise<any> {
    return this.request('POST', '/memories/image', {
      body: {
        user_id: userId,
        image_url: options?.imageUrl,
        image_base64: options?.imageBase64,
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
    const formData = new FormData()
    formData.append('file', imageData instanceof Blob ? imageData : new Blob([imageData]), filename)
    formData.append('user_id', userId)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const headers: Record<string, string> = {}
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const url = new URL(`${this.baseUrl}/memories/image/upload`)
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
}

