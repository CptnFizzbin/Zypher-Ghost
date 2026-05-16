import { createRootRoute, createRoute, createRouter, RouterProvider, Outlet, Link } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import ChatPage from './routes/ChatPage.tsx';
import InfoPage from './routes/InfoPage.tsx';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00ff9d' },
    secondary: { main: '#00b86e' },
    background: { default: '#0d0d0d', paper: '#1a1a1a' },
    text: { primary: '#e0e0e0', secondary: '#888888' },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

// Root layout route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <AppBar position="static" sx={{ bgcolor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: 'primary.main', letterSpacing: 1, flexGrow: 1 }}
          >
            ⚡ ZYPHER GHOST
          </Typography>
          <Button component={Link} to="/" color="inherit" size="small">
            Chat
          </Button>
          <Button component={Link} to="/info" color="inherit" size="small">
            Info
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </>
  ),
});

const chatRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: ChatPage });
const infoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/info', component: InfoPage });

const routeTree = rootRoute.addChildren([chatRoute, infoRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
          <RouterProvider router={router} />
        </Box>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
