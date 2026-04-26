import { Ollama, type Message } from 'ollama';
import { config } from '../config.js';

export type ChatMessage = Message;

export interface ChatSession {
  messages: ChatMessage[];
  addUserMessage(content: string): void;
  addAssistantMessage(content: string): void;
  reset(): void;
}

export function createSession(): ChatSession {
  const messages: ChatMessage[] = [];

  return {
    get messages() {
      return messages;
    },

    addUserMessage(content: string) {
      messages.push({ role: 'user', content });
      if (messages.length > config.historyLimit) {
        messages.splice(0, messages.length - config.historyLimit);
      }
    },

    addAssistantMessage(content: string) {
      messages.push({ role: 'assistant', content });
      if (messages.length > config.historyLimit) {
        messages.splice(0, messages.length - config.historyLimit);
      }
    },

    reset() {
      messages.length = 0;
    },
  };
}

export class OllamaClient {
  private readonly client: Ollama;
  private readonly model: string;
  private readonly systemPrompt: string;

  constructor(host = config.ollama.host, model = config.ollama.model, systemPrompt = config.systemPrompt) {
    this.client = new Ollama({ host });
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  /** Chat with streaming — yields text chunks as they arrive. */
  async *chatStream(
    session: ChatSession,
    userMessage: string,
    vaultContext?: string,
  ): AsyncGenerator<string> {
    const content = vaultContext
      ? `${userMessage}\n\n--- Relevant vault notes ---\n${vaultContext}`
      : userMessage;

    session.addUserMessage(content);

    const response = await this.client.chat({
      model: this.model,
      messages: [
        { role: 'system', content: this.systemPrompt },
        ...session.messages,
      ],
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of response) {
      const text = chunk.message.content;
      fullResponse += text;
      yield text;
    }

    session.addAssistantMessage(fullResponse);
  }

  /** Chat without streaming — returns the full response text. */
  async chat(
    session: ChatSession,
    userMessage: string,
    vaultContext?: string,
  ): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.chatStream(session, userMessage, vaultContext)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }

  /** List available models from the Ollama instance. */
  async listModels(): Promise<string[]> {
    const { models } = await this.client.list();
    return models.map((m) => m.name);
  }

  /** Check that the configured model is available, pulling it if needed. */
  async ensureModel(): Promise<void> {
    const models = await this.listModels();
    if (!models.includes(this.model)) {
      console.log(`Model "${this.model}" not found locally. Pulling from Ollama...`);
      await this.client.pull({ model: this.model, stream: false });
      console.log(`Model "${this.model}" pulled successfully.`);
    }
  }
}
