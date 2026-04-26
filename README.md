# Zypher-Ghost

**Zypher Ghost** is an AI assistant for Shadowrun campaigns powered by a local [Ollama](https://ollama.com/) LLM. It provides three chat interfaces — **Command Line**, **Discord Bot**, and **Web UI** — and can search your [Obsidian](https://obsidian.md/) vault for campaign notes and worldbuilding details to inject as context into every conversation.

---

## Features

- 🤖 **Ollama-backed LLM** — Connects to any local or remote Ollama instance; works with any model (llama3, mistral, etc.)
- 💬 **Three chat interfaces**:
  - **CLI** — Interactive readline terminal chat
  - **Discord Bot** — Respond to mentions in servers and direct messages
  - **Web UI** — React + MUI streaming chat with TanStack Router & Query
- 📓 **Obsidian Vault integration** — Searches your `.md` notes and injects relevant context into the LLM prompt automatically
- 🎲 **Shadowrun persona** — Pre-configured system prompt for *Zypher Ghost*, a tactical street-AI fixer character
- ✅ **Type-safe config** — Environment validated at startup via [t3-env](https://env.t3.gg/)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Yarn](https://yarnpkg.com/) (`npm install -g yarn`)
- [Ollama](https://ollama.com/) running locally (or accessible over the network)
- A pulled Ollama model (e.g. `ollama pull llama3.2`)
- *(Optional)* A Discord application/bot token for the Discord interface
- *(Optional)* An Obsidian vault with campaign markdown notes

---

## Installation

```bash
git clone https://github.com/CptnFizzbin/Zypher-Ghost.git
cd Zypher-Ghost
yarn install
```

---

## Configuration

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `http://localhost:11434` | URL of your Ollama instance |
| `OLLAMA_MODEL` | `llama3.2` | Model name to use |
| `INTERFACE` | `cli` | Which interface(s) to launch: `cli`, `discord`, `web`, or `all` |
| `VAULT_PATH` | *(empty)* | Absolute path to your Obsidian vault directory |
| `DISCORD_TOKEN` | *(empty)* | Discord bot token (required for Discord interface) |
| `DISCORD_CLIENT_ID` | *(empty)* | Discord application client ID |
| `WEB_PORT` | `3000` | Port for the web server |
| `WEB_HOST` | `localhost` | Bind address for the web server |
| `HISTORY_LIMIT` | `20` | Max messages kept in conversation context |
| `SYSTEM_PROMPT` | *(built-in)* | Override the default Zypher Ghost system prompt |

---

## Usage

### Command Line

```bash
yarn start:cli
# or
INTERFACE=cli yarn start
```

**CLI commands:**
| Command | Description |
|---|---|
| `/reset` | Clear conversation history |
| `/vault` | Show vault status |
| `/help` | Show help |
| `/quit` | Exit |

### Web Interface

Build the React frontend first, then start the server:

```bash
yarn build:client   # compile React → src/interfaces/web/public/
yarn start:web      # start Express + WebSocket server
```

Or run the Vite dev server (with HMR) alongside the backend:

```bash
yarn dev:client     # Vite on :5173, proxies /api and /ws to :3000
yarn start:web      # backend on :3000
```

Open `http://localhost:3000` (prod) or `http://localhost:5173` (dev) in your browser.

### Discord Bot

1. Create a Discord application at [discord.com/developers](https://discord.com/developers/applications)
2. Enable the **Message Content Intent** under the bot settings
3. Copy the bot token and client ID into `.env`
4. Invite the bot with the `bot` scope and `Send Messages`, `Read Message History`, `Message Content` permissions

```bash
yarn start:discord
```

The bot responds when **mentioned** in servers, and in every **DM**.

### All Interfaces

```bash
INTERFACE=all yarn start
```

---

## Development

```bash
# Run tests (vitest)
yarn test

# Watch mode
yarn test:watch

# Type-check backend
yarn dlx tsc --noEmit

# Build everything (backend + React frontend)
yarn build
```

---

## Project Structure

```
src/
├── config.ts                       # t3-env validated configuration
├── index.ts                        # Entry point — interface launcher
├── prompts/
│   └── system.ts                   # Zypher Ghost system prompt
├── llm/
│   ├── session.ts                  # Chat session & message history
│   ├── client.ts                   # OllamaClient (streaming)
│   └── index.ts                    # Re-exports
├── vault/
│   └── obsidian.ts                 # Obsidian vault reader + full-text search
└── interfaces/
    ├── cli.ts                      # Interactive CLI
    ├── discord/
    │   └── bot.ts                  # Discord bot
    └── web/
        ├── server.ts               # Entry point — wires services & controllers
        ├── services/
        │   └── chat.service.ts     # Vault + LLM service factories
        ├── controllers/
        │   ├── info.controller.ts  # GET /api/info
        │   └── ws.controller.ts    # WebSocket handler
        ├── client/                 # React frontend (Vite)
        │   ├── index.html
        │   ├── vite.config.ts
        │   └── src/
        │       ├── main.tsx
        │       ├── App.tsx         # MUI theme + TanStack Router + Query providers
        │       ├── hooks/
        │       │   └── useChat.ts  # WebSocket chat hook
        │       ├── components/
        │       │   ├── ChatMessage.tsx
        │       │   └── ChatInput.tsx
        │       └── routes/
        │           ├── ChatPage.tsx
        │           └── InfoPage.tsx
        └── public/                 # Compiled React output (served by Express)
tests/
├── config.test.ts
├── llm.test.ts
└── vault.test.ts
```

