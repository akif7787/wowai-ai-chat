import { getAIProvider, ChatMessageParam, StreamCallbacks } from './provider.ts';

export interface ChatRequestPayload {
  message?: string;
  messages?: ChatMessageParam[];
  conversationId?: string;
  history?: ChatMessageParam[];
  language?: 'en' | 'bn';
}

export class ChatService {
  static getStatus() {
    const provider = getAIProvider();
    const model = (provider as any).configuredModel || process.env.BAILU_MODEL || (provider.isDemo ? 'demo-engine' : 'bailu-auto');
    return {
      provider: provider.name,
      id: provider.id,
      isDemo: provider.isDemo,
      connected: !provider.isDemo,
      model,
      status: 'ready',
    };
  }

  static async handleStreamChat(
    payload: ChatRequestPayload,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<string> {
    const provider = getAIProvider();
    
    // Normalize messages
    let messages: ChatMessageParam[] = [];
    if (Array.isArray(payload.messages) && payload.messages.length > 0) {
      messages = payload.messages;
    } else {
      const history = Array.isArray(payload.history) ? payload.history : [];
      messages = [...history];
      if (payload.message) {
        messages.push({ role: 'user', content: payload.message });
      }
    }

    const lastMessage = messages[messages.length - 1]?.content || payload.message || '';
    const history = messages.slice(0, -1);

    return provider.streamChat(
      lastMessage,
      history,
      callbacks,
      {
        language: payload.language,
        signal,
        messages: messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : (m.role as 'user' | 'assistant' | 'system'),
          content: m.content
        }))
      }
    );
  }
}

/**
 * Top-level provider abstraction as recommended in section 19
 */
export async function generateAIResponse(
  messages: ChatMessageParam[],
  callbacks: StreamCallbacks,
  options?: { language?: 'en' | 'bn'; signal?: AbortSignal }
): Promise<string> {
  return ChatService.handleStreamChat({ messages, language: options?.language }, callbacks, options?.signal);
}

