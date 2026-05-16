import { useState, type KeyboardEvent } from 'react';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  onSend: (text: string) => void;
  onReset: () => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, onReset, disabled }: Props) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 2,
        bgcolor: '#1a1a1a',
        borderTop: '1px solid #2e2e2e',
        alignItems: 'flex-end',
      }}
    >
      <Tooltip title="Clear conversation">
        <span>
          <IconButton onClick={onReset} disabled={disabled} size="small" sx={{ color: 'text.secondary' }}>
            <RefreshIcon />
          </IconButton>
        </span>
      </Tooltip>

      <TextField
        fullWidth
        multiline
        maxRows={6}
        placeholder="Talk to Zypher Ghost... (Enter to send, Shift+Enter for newline)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        variant="outlined"
        size="small"
        autoFocus
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: '#242424',
            '& fieldset': { borderColor: '#2e2e2e' },
            '&:hover fieldset': { borderColor: '#00b86e' },
            '&.Mui-focused fieldset': { borderColor: '#00b86e' },
          },
          '& .MuiInputBase-input': { fontFamily: 'inherit' },
        }}
      />

      <Tooltip title="Send (Enter)">
        <span>
          <IconButton
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            color="primary"
            sx={{
              bgcolor: '#00b86e',
              color: '#000',
              '&:hover': { bgcolor: '#00ff9d' },
              '&.Mui-disabled': { bgcolor: '#333', color: '#666' },
            }}
          >
            <SendIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
