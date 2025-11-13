/**
 * Type definitions for Memphora SDK
 */

export interface Memory {
  id: string
  user_id: string
  content: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  score?: number  // Similarity score for search results
}

export interface SearchOptions {
  limit?: number
  filters?: Record<string, any>
  include_related?: boolean
  min_score?: number
  sort_by?: 'relevance' | 'recency' | 'importance'
}

export interface AdvancedSearchOptions extends SearchOptions {
  max_tokens?: number
  max_memories?: number
  use_compression?: boolean
  use_cache?: boolean
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Conversation {
  id?: string
  user_id: string
  conversation: ConversationMessage[]
  platform?: string
  metadata?: Record<string, any>
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret?: string
  active: boolean
  created_at: string
}

export interface ComplianceEvent {
  compliance_type: 'GDPR' | 'SOC2' | 'HIPAA'
  event_type: string
  user_id?: string
  organization_id?: string
  data_subject_id?: string
  details?: Record<string, any>
}

export interface MemoryVersion {
  id: string
  memory_id: string
  version_number: number
  content: string
  metadata?: Record<string, any>
  created_at: string
  created_by?: string
}

export interface RetentionPolicy {
  data_type: string
  retention_days: number
  organization_id?: string
  user_id?: string
  auto_delete: boolean
}

export interface Statistics {
  total_memories?: number
  total_conversations?: number
  average_memories_per_user?: number
  [key: string]: any
}

export interface Metrics {
  [key: string]: any
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  timestamp: string
  details?: Record<string, any>
}

