# Smart Commit Tool

[![npm version](https://badge.fury.io/js/smart-commit.svg)](https://badge.fury.io/js/smart-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Global AI-powered tool for generating meaningful commit messages.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/prod-broke-again/smart-commit)

## 🌍 Available Languages

- 🇺🇸 **English** (current)
- 🇷🇺 [**Русский (Russian)**](README.md)
- 🇨🇳 [中文 (Chinese)](README.cn.md) - *coming soon*
- 🇪🇸 [Español (Spanish)](README.es.md) - *coming soon*
- 🇩🇪 [Deutsch (German)](README.de.md) - *coming soon*

**Want to add a translation?** [Create a Pull Request](https://github.com/prod-broke-again/smart-commit/pulls) or [open an Issue](https://github.com/prod-broke-again/smart-commit/issues)!

## 🔗 Links

- 📖 [Documentation](https://github.com/prod-broke-again/smart-commit#readme)
- 🐛 [Report Bug](https://github.com/prod-broke-again/smart-commit/issues)
- 💡 [Request Feature](https://github.com/prod-broke-again/smart-commit/discussions)
- 🤝 [Contributing](https://github.com/prod-broke-again/smart-commit/blob/main/CONTRIBUTING.md)

## 🚀 Features

- 🤖 **AI-powered**: Generate commit messages using GPT models via [gptunnel.ru](https://docs.gptunnel.ru)
- 💰 **Cost-effective**: Uses the cheapest GPT-5-nano model ($0.001 per token)
- 📝 **Conventional Commits**: Support for conventional commits format
- 🔧 **Flexible configuration**: Global and project-specific settings
- 🤖 **Smart analysis**: Two analysis modes - lite (fast) and full (detailed with diff)
- 🎯 **Multiple modes**: Standard, dry-run, generate-only, custom message
- ⚡ **Fast**: Message generation in < 30 seconds
- 🛠️ **Extensible**: Clean architecture with SOLID principles support
- 🎨 **Beautiful CLI**: Colored output with progress indicators

## 📦 Installation

### 🚀 Quick Installation

```bash
# Clone the repository
git clone https://github.com/prod-broke-again/smart-commit.git
cd smart-commit

# Install dependencies and build
npm install && npm run build

# Link globally (for development)
npm link

# Verify installation
smart-commit --version
```

### ⚡ Usage

```bash
# Navigate to your git project
cd your-project

# Regular commit (automatically adds all changes)
smart-commit

# Generate message only without committing
smart-commit --generate-only

# Dry-run (show what would be committed)
smart-commit --dry-run

# Use custom message
smart-commit -m "feat: add new feature"
```

### 🔍 Analysis Modes

Smart Commit supports two code analysis modes:

#### **Lite mode** (default)
- Fast analysis of file list only
- Minimal token usage
- Suitable for simple commits

#### **Full mode** (detailed)
- Analyzes actual code changes (diff)
- AI sees what exactly changed
- Better generation quality for complex changes

```bash
# Switch to full analysis mode
smart-commit config --global --set analysisMode=full

# Return to lite mode
smart-commit config --global --set analysisMode=lite
```

## ⚙️ Configuration

### Initial Setup

```bash
smart-commit setup
```

### API Key Setup

Get API key from [gptunnel.ru/profile/business](https://gptunnel.ru/profile/business), then:

```bash
smart-commit config --global --set apiKey=YOUR_API_KEY
```

### Basic Settings

```bash
# Set default model (gpt-5-nano is most cost-effective)
smart-commit config --global --set defaultModel=gpt-5-nano

# Enable wallet balance usage (recommended for individual users)
smart-commit config --global --set useWalletBalance=true

# View current configuration
smart-commit config --global --list
```

## 🎯 Commands

### Main Commands

```bash
# Generate and commit (default)
smart-commit

# Generate only
smart-commit --generate-only

# Dry run
smart-commit --dry-run

# Custom message
smart-commit -m "feat: add awesome feature"
```

### Configuration Commands

```bash
# Set global config
smart-commit config --global --set key=value

# Get config value
smart-commit config --global --get key

# List all configs
smart-commit config --global --list

# Project-specific config
smart-commit config --set key=value
```

### Model Management

```bash
# List available models
smart-commit models list

# List all models (including details)
smart-commit models list --all

# Refresh models from API
smart-commit models refresh

# Clear models cache
smart-commit models clear-cache
```

## 🔧 Advanced Usage

### Custom Instructions

Add custom instructions for specific projects:

```bash
smart-commit config --set customInstructions="Always use Russian language"
```

### Different Models

```bash
# Use specific model for generation
smart-commit config --global --set defaultModel=gpt-5-chat

# Available models: gpt-5-nano, gpt-5-chat, gpt-5-codex, gpt-4o-mini, etc.
smart-commit models list --all
```

### Project-Specific Config

```bash
# Project-specific settings
cd my-project
smart-commit config --set language=ru
smart-commit config --set includeScope=true
```

## 📋 Examples

### Basic Usage

```bash
$ smart-commit --generate-only
- Analyzing repository...
- Generating commit message...

Generated commit message:
feat: add user authentication module
- 🔐 Implemented JWT-based authentication system
- 👤 Added User model with validation
- 🗄️ Created user repository with database integration
- 🛡️ Added middleware for route protection
- 📝 Updated API documentation
```

### Full Mode Analysis

```bash
$ smart-commit config --global --set analysisMode=full
$ smart-commit --generate-only

Generated commit message:
feat: implement advanced caching system 🚀
- 🧠 Added RedisCacheManager with TTL support
- 🔄 Implemented cache invalidation strategies
- 📊 Added cache hit/miss metrics
- 🏗️ Created CacheService interface for extensibility
- 🧪 Added comprehensive unit tests for cache operations
- 📚 Updated documentation with caching best practices
```

## 🏗️ Architecture

### Clean Architecture

- **Domain Layer**: Business logic for commit generation
- **Application Layer**: Workflow orchestration and commands
- **Infrastructure Layer**: Git operations, AI API, file system

### SOLID Principles

- **Single Responsibility**: Each module has one purpose
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Correct inheritance interfaces
- **Interface Segregation**: Minimal and specific interfaces
- **Dependency Inversion**: Dependencies are injected

### Key Components

- **CommitGenerator**: AI-powered message generation
- **GitAnalyzer**: Repository analysis and diff extraction
- **WorkflowOrchestrator**: Process coordination
- **ConfigurationManager**: Settings management
- **GptunnelApiClient**: AI service integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [gptunnel.ru](https://gptunnel.ru) for AI API
- [Conventional Commits](https://conventionalcommits.org) specification
- Open source community for inspiration

---

**Made with ❤️ for developers who care about clean commit history**

[🇷🇺 Russian Version](README.md) | [📖 Documentation](docs/)
