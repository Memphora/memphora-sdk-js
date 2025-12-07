/**
 * Memphora SDK - JavaScript/TypeScript Client
 * Persistent memory layer for AI agents
 */

export { Memphora } from './memphora'
export { MemoryClient } from './memory-client'
export * from './types'

// Vercel AI SDK Integration
export {
  createMemphoraMiddleware,
  createMemphoraClient,
  createEdgeClient,
  wrapStreamWithMemory,
  type AIMessage,
  type MemphoraMiddlewareConfig,
  type BeforeChatResult,
  type AfterChatResult,
  type UseMemphoraConfig,
  type MemphoraMiddleware,
  type EdgeClient
} from './vercel'

