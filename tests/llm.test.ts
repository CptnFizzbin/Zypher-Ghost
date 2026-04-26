import { describe, it, expect, beforeEach } from '@jest/globals';
import { createSession } from '../src/llm/ollama.js';

describe('createSession', () => {
  it('starts with an empty message list', () => {
    const session = createSession();
    expect(session.messages).toHaveLength(0);
  });

  it('adds user messages', () => {
    const session = createSession();
    session.addUserMessage('Hello');
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0]).toEqual({ role: 'user', content: 'Hello' });
  });

  it('adds assistant messages', () => {
    const session = createSession();
    session.addAssistantMessage('Greetings, chummer');
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0]).toEqual({ role: 'assistant', content: 'Greetings, chummer' });
  });

  it('resets the conversation', () => {
    const session = createSession();
    session.addUserMessage('One');
    session.addAssistantMessage('Two');
    session.reset();
    expect(session.messages).toHaveLength(0);
  });

  it('enforces history limit', () => {
    // config.historyLimit defaults to 20 — use a mock env override
    const session = createSession();
    // Add 25 messages
    for (let i = 0; i < 25; i++) {
      session.addUserMessage(`Message ${i}`);
    }
    // Should never exceed historyLimit (20 by default)
    expect(session.messages.length).toBeLessThanOrEqual(20);
  });

  it('alternates roles correctly', () => {
    const session = createSession();
    session.addUserMessage('Question?');
    session.addAssistantMessage('Answer!');
    expect(session.messages[0].role).toBe('user');
    expect(session.messages[1].role).toBe('assistant');
  });
});
