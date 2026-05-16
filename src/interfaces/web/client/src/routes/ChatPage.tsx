import { useEffect, useRef } from 'react';
import { Box, Chip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useChat } from '../hooks/useChat.ts';
import ChatMessage from '../components/ChatMessage.tsx';
import ChatInput from '../components/ChatInput.tsx';

export default function ChatPage() {
  const { messages, connected, streaming, sendMessage, resetChat } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Connection status bar */}
      <Box sx={{ px: 2, py: 0.75, display: 'flex', justifyContent: 'flex-end', bgcolor: '#111' }}>
        <Chip
          icon={connected ? <WifiIcon sx={{ fontSize: 14 }} /> : <WifiOffIcon sx={{ fontSize: 14 }} />}
          label={connected ? 'Online' : 'Disconnected'}
          size="small"
          sx={{
            bgcolor: 'transparent',
            color: connected ? 'primary.main' : 'error.main',
            borderColor: connected ? 'primary.main' : 'error.main',
            border: '1px solid',
            fontSize: '0.7rem',
          }}
        />
      </Box>

      {/* Message list */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#2e2e2e', borderRadius: 3 },
        }}
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* Input area */}
      <ChatInput onSend={sendMessage} onReset={resetChat} disabled={!connected || streaming} />
    </Box>
  );
}
