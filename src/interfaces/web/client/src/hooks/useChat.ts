import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
}

type WsRequest = { type: 'message' | 'reset' | 'ping'; content?: string };
type WsEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; content: string }
  | { type: 'system'; content: string }
  | { type: 'pong' };

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const streamIdRef = useRef<string | null>(null);

  const send = useCallback((req: WsRequest) => {
    ws.current?.send(JSON.stringify(req));
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!connected || streaming) return;
      const userMsg: ChatMsg = { id: makeId(), role: 'user', content: text };
      setMessages((m) => [...m, userMsg]);
      setStreaming(true);
      streamIdRef.current = makeId();
      // Add placeholder assistant message
      setMessages((m) => [
        ...m,
        { id: streamIdRef.current!, role: 'assistant', content: '', streaming: true },
      ]);
      send({ type: 'message', content: text });
    },
    [connected, streaming, send],
  );

  const resetChat = useCallback(() => {
    send({ type: 'reset' });
    setMessages([]);
  }, [send]);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/ws`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    socket.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as WsEvent;

      if (data.type === 'system') {
        setMessages((m) => [...m, { id: makeId(), role: 'system', content: data.content }]);
      } else if (data.type === 'chunk') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamIdRef.current
              ? { ...msg, content: msg.content + data.content }
              : msg,
          ),
        );
      } else if (data.type === 'done') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamIdRef.current ? { ...msg, streaming: false } : msg,
          ),
        );
        setStreaming(false);
        streamIdRef.current = null;
      } else if (data.type === 'error') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamIdRef.current
              ? { ...msg, content: `⚠ ${data.content}`, streaming: false }
              : msg,
          ),
        );
        setStreaming(false);
        streamIdRef.current = null;
      }
    };

    return () => socket.close();
  }, []);

  return { messages, connected, streaming, sendMessage, resetChat };
}
