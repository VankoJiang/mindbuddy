# MindBuddy

Lightweight AI companion with local memo + schedule awareness, powered by `pi-agent`.

<p align="center">
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License">
  <img src="https://img.shields.io/badge/node-18+-green" alt="Node.js">
  <img src="https://img.shields.io/github/stars/VankoJiang/mindbuddy" alt="Stars">
</p>

## ✨ Phase 1 Features

- 🤖 **AI Chat UI**: Modern web chat interface at `http://localhost:3000`
- 📝 **Memo Reading**: Reads local `.md/.txt` notes and extracts keywords
- 📅 **Schedule Reading**:
  - macOS Calendar via AppleScript (if permission granted)
  - ICS files via `calendar.icsPaths`
- ⏱️ **Screen Time Reading (Real Data)**:
  - Tracks frontmost macOS app usage using `lsappinfo`
  - Persists daily usage into `~/.mindbuddy/screentime-state.json`
- 🧩 **OpenClaw pi-agent Runtime**: Embedded `@mariozechner/pi-coding-agent` session
- 🧠 **PI Conversation Flow**: Perception -> Integration -> Response

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/VankoJiang/mindbuddy.git
cd mindbuddy

# Install
npm install

# Prepare config
mkdir -p ~/.mindbuddy
cp config.example.json ~/.mindbuddy/config.json
cp .env.example .env

# Edit env/config
vim .env
vim ~/.mindbuddy/config.json

# Start dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## ⚙️ Configuration

Edit `~/.mindbuddy/config.json`:

```json
{
  "notes": {
    "enabled": true,
    "paths": ["~/Documents/mindbuddy-notes"]
  },
  "calendar": {
    "enabled": true,
    "calendars": [],
    "lookAheadDays": 7,
    "icsPaths": ["~/Documents/calendars"]
  },
  "screenTime": {
    "enabled": true
  }
}
```

Notes:
- `calendar.calendars` empty means no calendar-name filtering.
- `calendar.icsPaths` can be `.ics` file path or a directory containing `.ics` files.
- On macOS, MindBuddy also tries to read Calendar app events directly.
- Screen time data is collected from current frontmost app activity on macOS and aggregated by day.

## 🔌 API Endpoints

- `GET /` - Web UI
- `GET /health` - Service status
- `GET /api/context` - Current context snapshot
- `GET /api/models` - Provider status + default selection
- `POST /api/chat` - Chat request
  - body: `{ "text": "...", "sessionId": "optional-session-id", "provider": "qwen", "model": "qwen-plus" }`
- `WS ws://localhost:3001` - Optional websocket channel (enable with `WS_ENABLED=1`)

## 🧠 Runtime & Providers

MindBuddy uses `@mariozechner/pi-coding-agent` as the agent runtime and maps `.env` keys into pi-agent `AuthStorage`.

Supported provider modes:

- `qwen` (`QWEN_API_KEY`, `QWEN_BASE_URL`)
- `zhipu` (`ZHIPU_API_KEY`, `ZHIPU_BASE_URL`)
- `deepseek` (`DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`)
- `openai` (`OPENAI_API_KEY`, optional `OPENAI_BASE_URL`)
- `openai-compat` (`OPENAI_API_KEY`, `OPENAI_BASE_URL`)

Model selection policy:

- MindBuddy does **not** preset or recommend model IDs for any provider.
- Users pick model IDs explicitly in the Web UI (or pass `provider/model` to `/api/chat`).
- `LLM_PROVIDER` / `LLM_MODEL` in `.env` are only optional defaults.

## 🧭 Soul Profile

MindBuddy persona is loaded from `soul.md` (customizable).

- Recommended template: `soul.template.md`
- Runtime file: `soul.md` (editable by users)
- Optional env override: `SOUL_PATH`

`soul.md` should define psychological companionship style, response boundaries, and crisis handling principles.

## 🧱 PI Integration Architecture

MindBuddy now follows the same integration direction as OpenClaw PI embedded runner:

- `runEmbeddedPiAgent(...)` orchestration layer
- `run/attempt.ts` session attempt execution
- `pi-embedded-subscribe.ts` streaming/event subscription
- `pi-tool-definition-adapter.ts` tool adapter layer
- `tool-split.ts` built-in/custom tool splitting
- `session-manager-cache.ts` session prewarm/cache helpers

Mapped files in this repo:

- `src/agents/pi-embedded-runner.ts`
- `src/agents/pi-embedded-runner/run.ts`
- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-subscribe.ts`
- `src/agents/pi-tool-definition-adapter.ts`
- `src/agents/pi-embedded-runner/tool-split.ts`
- `src/agents/pi-embedded-runner/session-manager-cache.ts`

## 📁 Project Structure

```text
mindbuddy/
├── src/
│   ├── agents/          # PI-style chat agent
│   ├── data-sources/    # Memo + calendar readers
│   ├── llm/             # LLM provider adapters
│   ├── types/           # Context types
│   ├── web/             # Frontend page template
│   └── index.ts         # Entry point
├── config.example.json
├── soul.md
├── soul.template.md
├── .env.example
└── package.json
```

## 🔒 Privacy

- Data stays on your machine
- Only reads configured local paths/calendars
- No cloud storage by default

## 📦 Publish To GitHub

```bash
# 1) Optional: create a dedicated branch
git checkout -b codex/phase1-finish

# 2) Commit
git add .
git commit -m "feat: finish phase1 with real screen time + soul/profile updates"

# 3) Add your GitHub remote (if not already set)
git remote add origin git@github.com:<your-username>/mindbuddy.git

# 4) Push
git push -u origin codex/phase1-finish
```

Then create a Pull Request on GitHub.

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
