# MindBuddy

Lightweight AI mental companion with local data integration.

<p align="center">
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License">
  <img src="https://img.shields.io/badge/node-18+-green" alt="Node.js">
  <img src="https://img.shields.io/github/stars/VankoJiang/mindbuddy" alt="Stars">
</p>

## ✨ Features

- 🤖 **AI Chat** - Emotional companion that truly understands you
- 📝 **Notes Integration** - Reads your local Markdown/Text notes to learn about you
- 📅 **Calendar Integration** - Understands your schedule and upcoming stress
- 🌙 **Screen Time** - Knows if you're staying up late

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/VankoJiang/mindbuddy.git
cd mindbuddy

# Install dependencies
npm install

# Copy config
cp config.example.json ~/.mindbuddy/config.json
cp .env.example .env

# Edit .env with your API key
vim .env

# Run
npm run dev
```

Visit http://localhost:3000

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
    "calendars": []
  },
  "screenTime": {
    "enabled": true
  }
}
```

## 🧠 Supported LLM Providers

| Provider | Model | Env Variable |
|----------|-------|--------------|
| [通义千问](https://dashscope.console.aliyun.com/) | qwen-plus | `QWEN_API_KEY` |
| [智谱 GLM](https://open.bigmodel.cn/) | glm-4 | `ZHIPU_API_KEY` |
| [DeepSeek](https://platform.deepseek.com/) | deepseek-chat | `DEEPSEEK_API_KEY` |
| [百度千帆](https://console.bce.baidu.com/qianfan/) | ernie-4.0-8k | `QIANFAN_API_KEY` |
| [OpenAI](https://api.openai.com/) | gpt-3.5-turbo | `OPENAI_API_KEY` |

## 📁 Project Structure

```
mindbuddy/
├── src/
│   ├── agents/          # AI Agent logic
│   ├── data-sources/    # Local data integration
│   ├── llm/             # LLM provider adapters
│   └── index.ts         # Entry point
├── config.example.json  # Config template
├── .env.example         # Env template
└── package.json
```

## 🔒 Privacy

- All data stays local on your machine
- Only reads files you explicitly specify
- No cloud storage, no tracking

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

---

Made with ❤️ for mental wellness
