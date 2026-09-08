import type { AIProvider, ChatMessageParam, StreamCallbacks } from './provider.ts';

export const BAILU_BASE_URL = 'https://bailucode.com/openapi';
export const BAILU_CHAT_ENDPOINT = `${BAILU_BASE_URL}/v1/chat/completions`;
export const BAILU_MODELS_ENDPOINT = `${BAILU_BASE_URL}/v1/models`;

export const DEFAULT_BAILU_MODEL = 'bailu-auto';

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  stream?: boolean;
  max_tokens?: number;
}

// In-memory model cache to avoid repeated /v1/models lookups
let cachedModels: string[] | null = null;
let cachedModelsTimestamp = 0;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Discover available models from BAILU using the provided API key
 */
export async function discoverBailuModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && now - cachedModelsTimestamp < MODEL_CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const response = await fetch(BAILU_MODELS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`[BAILU Model Discovery] Failed with status ${response.status}:`, errorText);
      return cachedModels || [DEFAULT_BAILU_MODEL];
    }

    const data = await response.json();
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      const modelIds: string[] = data.data
        .map((item: any) => item?.id)
        .filter((id: any): id is string => typeof id === 'string' && Boolean(id));

      if (modelIds.length > 0) {
        cachedModels = modelIds;
        cachedModelsTimestamp = now;
        console.log(`[BAILU Model Discovery] Discovered ${modelIds.length} models:`, modelIds);
        return modelIds;
      }
    }

    return cachedModels || [DEFAULT_BAILU_MODEL];
  } catch (err: any) {
    console.warn('[BAILU Model Discovery Error]:', err.message);
    return cachedModels || [DEFAULT_BAILU_MODEL];
  }
}

/**
 * Resolve the most appropriate chat model ID
 */
export async function resolveBailuModel(apiKey: string, explicitModel?: string): Promise<string> {
  let models: string[] = [];
  try {
    models = await discoverBailuModels(apiKey);
  } catch {}

  const candidate = explicitModel?.trim();

  // If candidate is a valid discovered model (and not the invalid/enterprise-only bailu-turing placeholder)
  if (candidate && candidate !== 'your_model_name_here' && candidate !== 'bailu-turing') {
    if (models.length === 0 || models.includes(candidate)) {
      return candidate;
    }
    console.warn(`[BAILU Model] Requested model "${candidate}" is not in available models list. Auto-selecting valid model.`);
  }

  if (models.length > 0) {
    if (models.includes('bailu-auto')) return 'bailu-auto';
    if (models.includes('bailu-2.8-lite')) return 'bailu-2.8-lite';
    if (models.includes('bailu-2.8')) return 'bailu-2.8';
    const preferred = models.find(m => m.includes('auto') || m.includes('2.8') || m.includes('fast')) || models[0];
    return preferred;
  }

  return DEFAULT_BAILU_MODEL;
}

/**
 * Helper to build Wowai system prompt
 */
export function buildSystemPrompt(language?: 'en' | 'bn'): string {
  const langPrompt = language === 'bn'
    ? 'The user communicates in Bengali (বাংলা). Respond naturally, fluently, and idiomatically in Bengali unless explicitly instructed otherwise.'
    : 'The user communicates in English. If the user asks in Bengali (বাংলা), naturally respond in Bengali. Otherwise, respond in English.';

  return `You are Wowai, a minimalist, friendly, intelligent, and fast AI assistant.
Your tagline is "AI that feels simple."
Guidelines:
- Provide clear, direct, and well-formatted answers without unnecessary fluff or excessive greetings.
- When generating code, use clean Markdown code blocks with appropriate language tags (e.g., \`\`\`tsx, \`\`\`python).
- Support syntax highlighting, tables, lists, and structured explanations.
- ${langPrompt}
- Maintain a calm, respectful, modern, and helpful tone at all times.`;
}

/**
 * BAILU AI Provider Implementation
 */
export class BailuAIProvider implements AIProvider {
  id = 'bailu';
  name = 'BAILU AI';
  isDemo = false;
  apiKey: string;
  configuredModel: string;
  private activeModel: string | null = null;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey.trim();
    const rawModel = (model || process.env.BAILU_MODEL || '').trim();
    if (rawModel && rawModel !== 'your_model_name_here' && rawModel !== 'bailu-turing') {
      this.configuredModel = rawModel;
      this.activeModel = rawModel;
      this.name = `BAILU AI (${rawModel})`;
    } else {
      this.configuredModel = DEFAULT_BAILU_MODEL;
      this.activeModel = DEFAULT_BAILU_MODEL;
      this.name = `BAILU AI (${DEFAULT_BAILU_MODEL})`;
    }
  }

  async getActiveModel(): Promise<string> {
    if (this.activeModel) return this.activeModel;
    const resolved = await resolveBailuModel(this.apiKey, this.configuredModel);
    this.activeModel = resolved;
    this.name = `BAILU AI (${resolved})`;
    return resolved;
  }

  /**
   * Main chat streaming implementation using OpenAI-compatible SSE
   */
  async streamChat(
    message: string,
    history: ChatMessageParam[],
    callbacks: StreamCallbacks,
    options?: {
      language?: 'en' | 'bn';
      signal?: AbortSignal;
      messages?: OpenAIChatMessage[];
    }
  ): Promise<string> {
    const model = await this.getActiveModel();

    // Prepare OpenAI-compatible messages
    let messages: OpenAIChatMessage[] = [];

    if (options?.messages && Array.isArray(options.messages) && options.messages.length > 0) {
      messages = [...options.messages];
    } else {
      // Build from history and current message
      const recentHistory = history.slice(-20); // Maintain last 20 messages for rich conversation memory
      for (const item of recentHistory) {
        messages.push({
          role: item.role === 'model' ? 'assistant' : (item.role as 'user' | 'assistant' | 'system'),
          content: item.content,
        });
      }
      if (message) {
        messages.push({
          role: 'user',
          content: message,
        });
      }
    }

    // Ensure system prompt is present as the first message
    const hasSystem = messages.some(m => m.role === 'system');
    if (!hasSystem) {
      messages.unshift({
        role: 'system',
        content: buildSystemPrompt(options?.language),
      });
    }

    // Try streaming first
    try {
      return await this.executeStream(model, messages, callbacks, options?.signal);
    } catch (streamError: any) {
      if (options?.signal?.aborted) {
        throw streamError;
      }
      // If model failed due to busy or plan permissions, fallback to bailu-auto
      if (model !== 'bailu-auto' && (streamError.message?.includes('busy') || streamError.message?.includes('plan') || streamError.message?.includes('permission'))) {
        console.warn(`[BAILU Model Fallback] Model ${model} failed (${streamError.message}). Retrying with bailu-auto...`);
        this.activeModel = 'bailu-auto';
        this.name = 'BAILU AI (bailu-auto)';
        return await this.executeStream('bailu-auto', messages, callbacks, options?.signal);
      }
      console.warn('[BAILU Stream Failed, attempting non-streaming fallback]:', streamError.message);
      return await this.executeNonStream(model, messages, callbacks, options?.signal);
    }
  }

  /**
   * SSE Stream Execution
   */
  private async executeStream(
    model: string,
    messages: OpenAIChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<string> {
    const requestBody: OpenAIChatCompletionRequest = {
      model,
      messages,
      temperature: 0.7,
      stream: true,
    };

    const response = await fetch(BAILU_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.handleHttpError(response.status, errorBody);
    }

    if (!response.body) {
      throw new Error('No response body received from BAILU API.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const dataContent = trimmed.slice(6).trim();

            if (dataContent === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataContent);
              const deltaContent = parsed?.choices?.[0]?.delta?.content;
              if (deltaContent && typeof deltaContent === 'string') {
                accumulatedText += deltaContent;
                callbacks.onChunk(deltaContent);
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      callbacks.onDone?.();
      return accumulatedText;
    } catch (err: any) {
      if (signal?.aborted) {
        callbacks.onDone?.();
        return accumulatedText;
      }
      callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Non-streaming Fallback Execution
   */
  private async executeNonStream(
    model: string,
    messages: OpenAIChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<string> {
    const requestBody: OpenAIChatCompletionRequest = {
      model,
      messages,
      temperature: 0.7,
      stream: false,
    };

    const response = await fetch(BAILU_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.handleHttpError(response.status, errorBody);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (text) {
      callbacks.onChunk(text);
    }
    callbacks.onDone?.();
    return text;
  }

  /**
   * Map HTTP errors to friendly, safe user-facing errors
   */
  private handleHttpError(status: number, errorBody: string): never {
    let errorCode = '';
    let errorMessage = '';

    try {
      const parsed = JSON.parse(errorBody);
      errorCode = parsed?.error?.code || parsed?.error?.type || '';
      errorMessage = parsed?.error?.message || '';
    } catch {
      // not JSON
    }

    console.error(`[BAILU API Error HTTP ${status}]:`, errorMessage || errorBody);

    if (status === 401 || errorCode === 'invalid_api_key' || errorCode === 'authentication_error') {
      throw new Error('AI service authentication failed. Please check your BAILU_API_KEY configuration.');
    }
    if (status === 404 || errorCode === 'model_not_found') {
      throw new Error('The specified AI model is unavailable. Please check your BAILU_MODEL setting.');
    }
    if (status === 429 || errorCode === 'rate_limit_exceeded' || errorCode === 'upstream_busy') {
      if (errorCode === 'upstream_busy') {
        throw new Error('AI service is temporarily busy. Please try again shortly.');
      }
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    if (status >= 500) {
      throw new Error('AI service is currently unavailable. Please try again in a moment.');
    }

    throw new Error('Something went wrong. Please try again.');
  }
}
