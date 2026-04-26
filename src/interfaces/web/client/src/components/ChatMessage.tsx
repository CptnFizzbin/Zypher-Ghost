import { Box, Paper, Typography, keyframes } from '@mui/material';
import type { ChatMsg } from '../hooks/useChat.ts';

interface Props {
  msg: ChatMsg;
}

const blink = keyframes`
  0%, 100% { opacity: 1 }
  50% { opacity: 0 }
`;

export default function ChatMessage({ msg }: Props) {
  if (msg.role === 'system') {
    return (
      <Typography
        variant="caption"
        sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', py: 0.5, fontStyle: 'italic' }}
      >
        {msg.content}
      </Typography>
    );
  }

  const isUser = msg.role === 'user';

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: '80%',
          px: 2,
          py: 1.25,
          bgcolor: isUser ? '#1e3a2f' : '#1a2430',
          border: '1px solid',
          borderColor: isUser ? '#2e5040' : '#2a3a4a',
          borderRadius: 3,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 'bold',
            color: isUser ? '#5dffba' : 'primary.main',
            mb: 0.5,
            letterSpacing: 0.5,
          }}
        >
          {isUser ? 'YOU' : 'ZYPHER GHOST'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}
        >
          {msg.content}
          {msg.streaming && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 8,
                height: '1em',
                bgcolor: 'primary.main',
                verticalAlign: 'text-bottom',
                ml: 0.25,
                animation: `${blink} 0.7s steps(1) infinite`,
              }}
            />
          )}
        </Typography>
      </Paper>
    </Box>
  );
}
