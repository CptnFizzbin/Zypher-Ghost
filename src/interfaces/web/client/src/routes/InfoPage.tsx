import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FolderIcon from '@mui/icons-material/Folder';
import DnsIcon from '@mui/icons-material/Dns';

interface ApiInfo {
  model: string;
  host: string;
  vault: { path: string; notes: number } | null;
}

async function fetchInfo(): Promise<ApiInfo> {
  const res = await fetch('/api/info');
  if (!res.ok) throw new Error('Failed to fetch info');
  return res.json() as Promise<ApiInfo>;
}

export default function InfoPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ['info'], queryFn: fetchInfo });

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Failed to load server info.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
        System Info
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SmartToyIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              LLM Model
            </Typography>
          </Box>
          <Chip label={data.model} color="primary" variant="outlined" size="small" />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DnsIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Ollama Host
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            {data.host}
          </Typography>
        </CardContent>
      </Card>

      {data.vault && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FolderIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Obsidian Vault
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 1 }}>
              {data.vault.path}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">
              <strong>{data.vault.notes}</strong> notes loaded
            </Typography>
          </CardContent>
        </Card>
      )}

      {!data.vault && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                No Obsidian Vault configured. Set the <code>VAULT_PATH</code> environment variable.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
