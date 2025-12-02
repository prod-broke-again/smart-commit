# Smart Commit Tool

[![npm version](https://badge.fury.io/js/smart-commit-ai.svg)](https://badge.fury.io/js/smart-commit-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/prod-broke-again/smart-commit)

> 🇷🇺 Ищете русскую версию? [Откройте README.ru.md на GitHub](https://github.com/prod-broke-again/smart-commit/blob/main/README.ru.md)

Global AI-powered tool for generating meaningful commit messages and running smart deployment workflows.

## ⚠️ Important Configuration Update

**Version 1.0.13** introduces support for multiple API keys for different providers and project-specific settings.

- ⚠️ **`apiKey` is deprecated** — use `apiKeys` to store keys for different providers
- ✅ **New feature**: Store keys for all providers simultaneously (`apiKeys.openai`, `apiKeys.timeweb`, etc.)
- ✅ **Project settings**: Each project can have its own `apiKey`, `defaultProvider`, and `defaultModel`
- ✅ **New provider**: Timeweb AI support added

```bash
# Old way (still works, but deprecated)
smart-commit config --global --set apiKey=YOUR_KEY

# New way (recommended)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...
```

## 🔗 Links

- 📖 [Full documentation (English)](docs/en/README.md)
- 📖 [Документация (Русский)](docs/README.md)
- 🐛 [Report a bug](https://github.com/prod-broke-again/smart-commit/issues)
- 💡 [Request a feature](https://github.com/prod-broke-again/smart-commit/discussions)
- 🤝 [Contribution guide](https://github.com/prod-broke-again/smart-commit/blob/main/CONTRIBUTING.md)

## ✨ Features

- 🤖 **AI-powered commits**: Generate high-quality commit messages with GPT models
- 📋 **Conventional Commits**: Fully supports the conventional commits format
- 🔗 **Git Hooks**: Automatic validation and improvement of commit messages
- 🌍 **Multi-language**: Works in English and Russian out of the box
- 🔧 **Smart deploy**: Detects necessary commands based on changed files
- ⚡ **Fast deploy**: Run the full set of deployment commands when needed
- 🎯 **Project analysis**: Automatically understands your project structure
- 🧱 **Clean architecture**: SOLID-first, testable, and extensible codebase

## 🚀 Quick Start

```bash
# Install globally
npm install -g smart-commit-ai

# Initial setup (configure API key, prompts, etc.)
smart-commit setup

# Generate and create a commit
smart-commit

# Run smart deploy
smart-commit deploy-smart
```

## 🧠 Smart Deploy Example

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • Detected changes in 2 files
  • Frontend files changed (resources/js/components/Button.vue)
  • NPM dependencies changed (package.json)

⚠️  Smart deployment will execute 3 commands:
  1. git pull origin main
  2. npm install
  3. npm run build

Continue? [y/N]
```

## 🛠 Supported Projects

- **PHP/Laravel** — reads `composer.json`, artisan commands, etc.
- **Node.js** — npm/yarn projects with package scripts
- **Vue.js / React** — front-end frameworks detection
- **TypeScript** — full TS support
- **Docker** — basic Docker workflows

## 🎯 CLI Commands

| Command | Description |
|---------|-------------|
| `smart-commit` | Generate and create a commit |
| `smart-commit --generate-only` | Generate a message without committing |
| `smart-commit --dry-run` | Preview what would be committed |
| `smart-commit deploy-smart` | Run smart deploy (only required commands) |
| `smart-commit deploy` | Run full deploy pipeline |
| `smart-commit setup` | Initial configuration wizard |
| `smart-commit config` | Manage config (global or project) |
| `smart-commit models` | Manage AI models cache |
| `smart-commit install-hooks` | Install Git hooks for automatic validation |
| `smart-commit uninstall-hooks` | Uninstall Git hooks |

## ⚙️ Configuration

All settings can be stored globally (`~/.smart-commit/config.json`) or per-project (`.smart-commit.json`).

```bash
# Set API keys for different providers (recommended)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...

# Set project-specific settings (overrides global)
smart-commit config --set apiKey=project-key
smart-commit config --set defaultProvider=timeweb
smart-commit config --set defaultModel=gpt-4o-mini

# Switch analysis mode
smart-commit config --global --set analysisMode=full

# Change default language
smart-commit config --set language=ru

# Inspect current configuration
smart-commit config --global --list
```

## 🔧 Models & Providers

Smart Commit supports multiple AI providers (GPTunnel, OpenAI, Anthropic Claude, Google Gemini, Timeweb AI). Manage models via CLI:

```bash
# List models from current provider
smart-commit models list

# Show all available models
smart-commit models list --all

# Refresh models from API
smart-commit models refresh

# Clear local cache
smart-commit models clear-cache
```

## 🧪 Example Workflow

```bash
$ smart-commit --generate-only
✓ Analyzing repository...
✓ Generating commit message...

Generated commit message:
feat: add user authentication module
- 🔐 Implemented JWT-based authentication system
- 👤 Added User model with validation
- 🗄️ Created repository layer for persistence
- 🛡️ Secured routes via auth middleware
```

## 🤝 Contributing

Whether you want to fix a bug, propose a feature, or add a new language — contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Smart Commit is released under the [MIT License](LICENSE).

---

Made with ❤️ by [Eugene (prod-broke-again)](https://github.com/prod-broke-again)  
Version: 1.0.14