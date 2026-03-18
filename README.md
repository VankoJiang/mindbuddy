# MindBuddy

Lightweight AI mental companion with local data integration.

## Features

- 🤖 **AI Chat** - Emotional companion that understands you
- 📝 **Notes Integration** - Reads your local Markdown/Text notes
- 📅 **Calendar Integration** - Understands your schedule
- 🌙 **Screen Time** - Knows if you're staying up late

## Quick Start

```bash
# Install dependencies
npm install

# Create config
mkdir -p ~/.mindbuddy
cp config.example.json ~/.mindbuddy/config.json

# Edit .env with your API key
cp .env.example .env

# Run
npm run dev
```

Visit http://localhost:3000

## Configuration

Edit `~/.mindbuddy/config.json`:

```json
{
  "notes": {
    "enabled": true,
    "paths": ["~/Documents/mindbuddy-notes"]
  },
  "calendar": {
    "enabled": true,
    "calendars": []
  },
  "screenTime": {
    "enabled": true
  }
}
```

## LLM Providers

Supports any OpenAI-compatible API:

- [通义千问](https://dashscope.console.aliyun.com/)
- [智谱 GLM](https://open.bigmodel.cn/)
- [DeepSeek](https://deepseek.com/)

## License

MIT
