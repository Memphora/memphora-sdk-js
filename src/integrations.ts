/**
 * Memphora Framework Integrations (TypeScript/JavaScript)
 * 
 * Native integrations for popular AI frameworks:
 * - LangChain.js: Memory store for LangChain conversations
 * - LlamaIndex.TS: Memory for LlamaIndex TypeScript chat engines
 * - CrewAI: Shared memory for multi-agent crews (via REST API)
 * - AutoGen: Microsoft AutoGen multi-agent memory (via REST API)
 * 
 * Usage:
 *   import { 
 *     MemphoraLangChain, 
 *     MemphoraLlamaIndex,
 *     MemphoraCrewAI,
 *     MemphoraAutoGen 
 *   } from 'memphora/integrations';
 */

import { Memphora } from './memphora';

// =============================================================================
// LangChain.js Integration
// =============================================================================

export interface LangChainMemoryConfig {
    userId: string;
    apiKey: string;
    apiUrl?: string;
    sessionId?: string;
    memoryKey?: string;
    inputKey?: string;
    outputKey?: string;
    returnMessages?: boolean;
}

/**
 * LangChain.js Memory Integration for Memphora.
 * 
 * Provides a LangChain-compatible memory store that persists across sessions.
 * 
 * @example
 * ```typescript
 * import { MemphoraLangChain } from 'memphora/integrations';
 * import { ConversationChain } from 'langchain/chains';
 * import { ChatOpenAI } from 'langchain/chat_models/openai';
 * 
 * const memory = new MemphoraLangChain({
 *   userId: 'user123',
 *   apiKey: 'your-api-key'
 * });
 * 
 * const chain = new ConversationChain({
 *   llm: new ChatOpenAI(),
 *   memory: memory.asLangChainMemory()
 * });
 * 
 * const response = await chain.call({ input: 'Hello!' });
 * ```
 */
export class MemphoraLangChain {
    private memphora: Memphora;
    private sessionId: string;
    private memoryKey: string;
    private inputKey: string;
    private outputKey: string;
    private returnMessages: boolean;

    constructor(config: LangChainMemoryConfig) {
        this.memphora = new Memphora({
            userId: config.userId,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl
        });
        this.sessionId = config.sessionId || config.userId;
        this.memoryKey = config.memoryKey || 'history';
        this.inputKey = config.inputKey || 'input';
        this.outputKey = config.outputKey || 'output';
        this.returnMessages = config.returnMessages ?? true;
    }

    /**
     * Load relevant memories based on input.
     */
    async loadMemoryVariables(inputs: Record<string, any>): Promise<Record<string, any>> {
        const query = inputs[this.inputKey] || '';

        if (!query) {
            return { [this.memoryKey]: this.returnMessages ? [] : '' };
        }

        const context = await this.memphora.getContext(query, 10);

        if (this.returnMessages) {
            return {
                [this.memoryKey]: context ? [{ role: 'system', content: `Relevant context:\n${context}` }] : []
            };
        }
        return { [this.memoryKey]: context || '' };
    }

    /**
     * Save conversation to Memphora.
     */
    async saveContext(
        inputs: Record<string, any>,
        outputs: Record<string, any>
    ): Promise<void> {
        const humanInput = inputs[this.inputKey] || '';
        const aiOutput = outputs[this.outputKey] || '';

        if (humanInput && aiOutput) {
            await this.memphora.storeConversation(humanInput, aiOutput);
        }
    }

    /**
     * Clear all memories.
     */
    async deleteAll(): Promise<void> {
        await this.memphora.deleteAll();
    }

    /**
     * Get LangChain-compatible memory interface.
     * Returns an object implementing LangChain's BaseMemory interface.
     */
    asLangChainMemory(): any {
        const self = this;
        return {
            memoryVariables: [this.memoryKey],

            async loadMemoryVariables(inputs: Record<string, any>) {
                return self.loadMemoryVariables(inputs);
            },

            async saveContext(inputs: Record<string, any>, outputs: Record<string, any>) {
                return self.saveContext(inputs, outputs);
            },

            async clear() {
                return self.deleteAll();
            }
        };
    }
}


// =============================================================================
// LlamaIndex.TS Integration
// =============================================================================

export interface LlamaIndexMemoryConfig {
    userId: string;
    apiKey: string;
    apiUrl?: string;
    tokenLimit?: number;
}

/**
 * LlamaIndex TypeScript Memory Integration for Memphora.
 * 
 * Provides persistent memory for LlamaIndex chat engines.
 * 
 * @example
 * ```typescript
 * import { MemphoraLlamaIndex } from 'memphora/integrations';
 * import { VectorStoreIndex, SimpleChatEngine } from 'llamaindex';
 * 
 * const memory = new MemphoraLlamaIndex({
 *   userId: 'user123',
 *   apiKey: 'your-api-key'
 * });
 * 
 * const chatEngine = index.asChatEngine({
 *   chatMode: 'context',
 *   memory: memory.asChatMemory()
 * });
 * 
 * const response = await chatEngine.chat('Hello!');
 * ```
 */
export class MemphoraLlamaIndex {
    private memphora: Memphora;
    private tokenLimit: number;
    private chatHistory: Array<{ role: string; content: string }> = [];

    constructor(config: LlamaIndexMemoryConfig) {
        this.memphora = new Memphora({
            userId: config.userId,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl
        });
        this.tokenLimit = config.tokenLimit || 3000;
    }

    /**
     * Get relevant context from Memphora.
     */
    async get(query?: string, limit: number = 10): Promise<string> {
        if (query) {
            return await this.memphora.getContext(query, limit);
        }
        return '';
    }

    /**
     * Store a conversation turn.
     */
    async put(userMessage: string, assistantMessage: string): Promise<void> {
        await this.memphora.storeConversation(userMessage, assistantMessage);
        this.chatHistory.push({ role: 'user', content: userMessage });
        this.chatHistory.push({ role: 'assistant', content: assistantMessage });
    }

    /**
     * Get all chat history.
     */
    getAll(): Array<{ role: string; content: string }> {
        return [...this.chatHistory];
    }

    /**
     * Reset chat history.
     */
    reset(): void {
        this.chatHistory = [];
    }

    /**
     * Set chat history from messages.
     */
    async set(messages: Array<{ role: string; content: string }>): Promise<void> {
        this.chatHistory = messages;

        // Store conversation pairs in Memphora
        for (let i = 0; i < messages.length - 1; i += 2) {
            if (messages[i].role === 'user' && messages[i + 1]?.role === 'assistant') {
                await this.memphora.storeConversation(
                    messages[i].content,
                    messages[i + 1].content
                );
            }
        }
    }

    /**
     * Get LlamaIndex-compatible memory interface.
     */
    asChatMemory(): any {
        const self = this;
        return {
            tokenLimit: this.tokenLimit,

            async get(input?: string) {
                return self.get(input);
            },

            async put(message: any) {
                if (message?.content && message?.role === 'assistant') {
                    const history = self.getAll();
                    if (history.length > 0 && history[history.length - 1].role === 'user') {
                        await self.put(history[history.length - 1].content, message.content);
                    }
                }
            },

            reset() {
                self.reset();
            },

            getAll() {
                return self.getAll();
            }
        };
    }
}


// =============================================================================
// CrewAI Integration
// =============================================================================

export interface CrewAIMemoryConfig {
    crewId: string;
    apiKey: string;
    apiUrl?: string;
}

/**
 * CrewAI Memory Integration for Memphora.
 * 
 * Provides shared memory for multi-agent crews with per-agent namespaces.
 * 
 * @example
 * ```typescript
 * import { MemphoraCrewAI } from 'memphora/integrations';
 * 
 * const crewMemory = new MemphoraCrewAI({
 *   crewId: 'research-team',
 *   apiKey: 'your-api-key'
 * });
 * 
 * // Per-agent memory
 * const researcherMemory = crewMemory.forAgent('researcher');
 * await researcherMemory.store('Found 5 relevant papers');
 * 
 * const writerMemory = crewMemory.forAgent('writer');
 * const context = await writerMemory.searchCrew('papers');
 * ```
 */
export class MemphoraCrewAI {
    private memphora: Memphora;
    private crewId: string;
    private agentMemories: Map<string, MemphoraAgentMemory> = new Map();

    constructor(config: CrewAIMemoryConfig) {
        this.memphora = new Memphora({
            userId: config.crewId,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl
        });
        this.crewId = config.crewId;
    }

    /**
     * Get a memory instance for a specific agent.
     */
    forAgent(agentId: string): MemphoraAgentMemory {
        if (!this.agentMemories.has(agentId)) {
            this.agentMemories.set(agentId, new MemphoraAgentMemory(
                this.memphora,
                agentId,
                this.crewId
            ));
        }
        return this.agentMemories.get(agentId)!;
    }

    /**
     * Store a shared memory accessible by all agents.
     */
    async storeShared(content: string, metadata?: Record<string, any>): Promise<any> {
        const meta = { ...(metadata || {}), shared: true, crewId: this.crewId };
        return await this.memphora.storeGroupMemory(this.crewId, content, meta);
    }

    /**
     * Search shared memories across the crew.
     */
    async searchShared(query: string, limit: number = 10): Promise<any> {
        return await this.memphora.searchGroupMemories(this.crewId, query, limit);
    }

    /**
     * Get context from all shared crew memories.
     */
    async getCrewContext(limit: number = 50): Promise<any> {
        return await this.memphora.getGroupContext(this.crewId, limit);
    }
}

/**
 * Individual agent memory within a CrewAI crew.
 */
export class MemphoraAgentMemory {
    private memphora: Memphora;
    private agentId: string;
    private crewId: string;

    constructor(memphora: Memphora, agentId: string, crewId: string) {
        this.memphora = memphora;
        this.agentId = agentId;
        this.crewId = crewId;
    }

    /**
     * Store a memory for this agent.
     */
    async store(content: string, metadata?: Record<string, any>): Promise<any> {
        return await this.memphora.storeAgentMemory(this.agentId, content, undefined, metadata);
    }

    /**
     * Search this agent's memories.
     */
    async search(query: string, limit: number = 10): Promise<any> {
        return await this.memphora.searchAgentMemories(this.agentId, query, undefined, limit);
    }

    /**
     * Get all memories for this agent.
     */
    async getAll(limit: number = 100): Promise<any[]> {
        return await this.memphora.getAgentMemories(this.agentId, limit);
    }

    /**
     * Search shared crew memories.
     */
    async searchCrew(query: string, limit: number = 10): Promise<any> {
        return await this.memphora.searchGroupMemories(this.crewId, query, limit);
    }
}


// =============================================================================
// AutoGen Integration
// =============================================================================

export interface AutoGenMemoryConfig {
    sessionId: string;
    apiKey: string;
    apiUrl?: string;
    trackEscalations?: boolean;
}

/**
 * Microsoft AutoGen Memory Integration for Memphora.
 * 
 * Provides persistent memory for AutoGen multi-agent conversations.
 * 
 * @example
 * ```typescript
 * import { MemphoraAutoGen } from 'memphora/integrations';
 * 
 * const memory = new MemphoraAutoGen({
 *   sessionId: 'session-123',
 *   apiKey: 'your-api-key',
 *   trackEscalations: true
 * });
 * 
 * // Register message handler
 * agent.onMessage((msg, sender) => {
 *   memory.onMessage(msg.content, sender.name, agent.name);
 * });
 * 
 * // Get context for response
 * const context = await memory.getContext('topic to search');
 * ```
 */
export class MemphoraAutoGen {
    private memphora: Memphora;
    private sessionId: string;
    private trackEscalations: boolean;
    private messageBuffer: Array<{ content: string; sender: string; receiver: string }> = [];

    constructor(config: AutoGenMemoryConfig) {
        this.memphora = new Memphora({
            userId: config.sessionId,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl
        });
        this.sessionId = config.sessionId;
        this.trackEscalations = config.trackEscalations ?? true;
    }

    /**
     * Handle incoming message - call this when an agent receives a message.
     */
    async onMessage(content: string, sender: string, receiver: string): Promise<void> {
        if (!content) return;

        // Buffer message
        this.messageBuffer.push({ content, sender, receiver });

        // Store as agent memory
        await this.memphora.storeAgentMemory(sender, content, undefined, {
            receiver,
            sessionId: this.sessionId,
            type: 'message'
        });

        // Check for escalation
        if (this.trackEscalations) {
            const escalationKeywords = ['escalate', 'human', 'supervisor', 'help needed'];
            if (escalationKeywords.some(kw => content.toLowerCase().includes(kw))) {
                await this.memphora.storeAgentMemory(sender, `ESCALATION: ${content}`, undefined, {
                    type: 'escalation',
                    sessionId: this.sessionId,
                    fromAgent: sender,
                    toAgent: receiver
                });
            }
        }
    }

    /**
     * Get relevant context for a query.
     */
    async getContext(query: string, agentId?: string, limit: number = 10): Promise<string> {
        let facts: any[];

        if (agentId) {
            const result = await this.memphora.searchAgentMemories(agentId, query, undefined, limit);
            facts = result?.facts || [];
        } else {
            const result = await this.memphora.search(query, limit);
            facts = result?.facts || [];
        }

        if (!facts.length) return '';

        return facts.map(f => typeof f === 'object' ? f.text || '' : String(f)).join('\n');
    }

    /**
     * Get all escalation events.
     */
    async getEscalations(limit: number = 20): Promise<any[]> {
        const result = await this.memphora.search('ESCALATION', limit);
        return result?.facts || [];
    }

    /**
     * Get the message buffer for current session.
     */
    getConversationHistory(): Array<{ content: string; sender: string; receiver: string }> {
        return [...this.messageBuffer];
    }

    /**
     * Clear the current session buffer.
     */
    clearSession(): void {
        this.messageBuffer = [];
    }
}
