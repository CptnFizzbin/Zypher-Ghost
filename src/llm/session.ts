import type { Message } from 'ollama';
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
