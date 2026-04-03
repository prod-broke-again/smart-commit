# Smart Commit AI Documentation

Welcome to the Smart Commit AI documentation! Here you'll find all the information you need to work with the tool.

## 📚 Table of Contents

### 🚀 Getting Started
- [Installation and Setup](setup.md) - First steps with Smart Commit AI
- [Basic Commands](commands.md) - All available commands and their usage

### 🚀 Deployment
- [Smart Deploy](smart-deploy.md) - Analyze changes and execute only needed commands
- [Regular Deploy](deploy.md) - Full deployment of all commands

### ⚙️ Configuration
- [Configuration](configuration.md) - Setting up global and project parameters
- [Configuration (Русский)](../configuration.md) - Настройка глобальных и проектных параметров

### 📊 Examples
- [Usage Examples](examples.md) - Practical examples for different scenarios

## 🎯 Quick Start

1. **Install**: `npm install -g smart-commit-ai`
2. **Setup**: `smart-commit setup`
3. **Project Configuration**: `smart-commit generate-config`
4. **Create Commit**: `smart-commit`
5. **Smart Deploy**: `smart-commit deploy-smart`

## 🔧 Key Features

- **🤖 AI-powered commits** - Automatic generation of meaningful commit messages
- **📋 Conventional Commits** - Support for conventional commits standard
- **🌍 Multi-language** - English and Russian languages
- **🔧 Smart Deploy** - Analyze changes and execute only necessary commands
- **⚡ Fast Deploy** - Full deployment of all commands
- **📦 Local preparation** - `localCommands` (build, rsync) before SSH; fail-fast; per-command remote timeout
- **🎯 Project Analysis** - Automatic project type detection
- **🔑 Multiple API Keys** - Store keys for different providers simultaneously
- **📁 Project Settings** - Override global settings per project

## ⚠️ Important: Configuration Update (v1.0.13)

**Version 1.0.13** introduces major configuration improvements:

- ⚠️ **`apiKey` is deprecated** — use `apiKeys` object instead
- ✅ **Multiple API keys**: Store keys for all providers at once
- ✅ **Project-specific settings**: Each project can override global config
- ✅ **New provider**: Timeweb AI support added

See [Configuration](configuration.md) for details.

## 🆘 Need Help?

If you have questions or issues:

1. Check [Usage Examples](examples.md)
2. See [Troubleshooting](setup.md#troubleshooting)
3. Create an [Issue](https://github.com/prod-broke-again/smart-commit/issues)

## 📝 Contributing to Documentation

We welcome documentation improvements! If you found an error or want to add something useful:

1. Create an [Issue](https://github.com/prod-broke-again/smart-commit/issues)
2. Submit a [Pull Request](https://github.com/prod-broke-again/smart-commit/pulls)

---

**Documentation Version:** 1.0.14  
**Last Updated:** April 2026  
**Author:** [Eugene (prod-broke-again)](https://github.com/prod-broke-again)

