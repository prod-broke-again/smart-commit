# Installation and Setup

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g smart-commit-ai
```

### Local Installation

```bash
npm install smart-commit-ai
npx smart-commit
```

## 🔧 Initial Setup

After installation, run the setup command:

```bash
smart-commit setup
```

This command will help you:
- Configure API keys for AI
- Choose AI provider (GPTunnel, OpenAI, Anthropic, Gemini, Timeweb)
- Set default language
- Choose AI model

## 🔑 API Key Configuration

### ⚠️ Important: New Format (Recommended)

Starting from version 1.0.13, it's recommended to use `apiKeys` to store keys for different providers:

```bash
# Set keys for different providers
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...
smart-commit config --global --set apiKeys.gemini=...
```

### Providers

#### GPTunnel (Recommended for beginners)

1. Register at [GPTunnel](https://gptunnel.com)
2. Get API key
3. Run: `smart-commit config --global --set apiKeys.gptunnel=your_key`

#### OpenAI

1. Get API key at [OpenAI](https://platform.openai.com)
2. Run: `smart-commit config --global --set apiKeys.openai=sk-...`
3. Set provider: `smart-commit config --global --set defaultProvider=openai`

#### Timeweb AI

1. Get API key in Timeweb AI control panel
2. Run: `smart-commit config --global --set apiKeys.timeweb=tw-...`
3. Set provider: `smart-commit config --global --set defaultProvider=timeweb`

#### Anthropic Claude

1. Get API key at [Anthropic](https://console.anthropic.com)
2. Run: `smart-commit config --global --set apiKeys.anthropic=sk-ant-...`
3. Set provider: `smart-commit config --global --set defaultProvider=anthropic`

#### Google Gemini

1. Get API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Run: `smart-commit config --global --set apiKeys.gemini=...`
3. Set provider: `smart-commit config --global --set defaultProvider=gemini`

### ⚠️ Old Format (Deprecated, but still works)

```bash
# Old way (for backward compatibility)
smart-commit config --global --set apiKey=your_key
```

## 🌍 Language Configuration

```bash
# Russian
smart-commit config --set language=ru

# English
smart-commit config --set language=en
```

## 🤖 AI Model Configuration

View available models:

```bash
smart-commit models list
```

Set default model:

```bash
smart-commit config --set defaultModel=gpt-4o-mini
```

## 📁 Project Configuration

Create configuration for each project:

```bash
smart-commit generate-config
```

This command will:
- Analyze project structure
- Determine project type (PHP/Laravel, Node.js, etc.)
- Create `.smart-commit.json` file with settings

### Project-Specific Settings (Override Global)

Each project can have its own settings that override global ones:

```bash
# Set project-specific API key
smart-commit config --set apiKey=project-key

# Set provider for project
smart-commit config --set defaultProvider=timeweb

# Set model for project
smart-commit config --set defaultModel=gpt-4o-mini
```

This is useful when:
- Simple projects need a lightweight model (fewer tokens)
- Large projects need a model with large context
- Different projects use different providers

## ⚙️ Global Configuration

View current settings:

```bash
smart-commit config --list
```

Change settings:

```bash
smart-commit config --set key=value
```

## 🔄 Update

```bash
npm update -g smart-commit-ai
```

## 🗑️ Uninstall

```bash
npm uninstall -g smart-commit-ai
```

## 🆘 Troubleshooting

### Error "API key not found"

```bash
# New way (recommended)
smart-commit config --global --set apiKeys.provider=your_key

# Old way (for backward compatibility)
smart-commit config --set apiKey=your_key
```

### Error "Configuration file not found"

```bash
smart-commit generate-config
```

### Error "Not a git repository"

Make sure you're in a folder with a Git repository.

### Error "No changes to commit"

```bash
git add .
smart-commit
```

## 📝 Configuration Examples

### Minimal Configuration

```json
{
  "language": "en",
  "defaultModel": "gpt-4o-mini",
  "maxCommitLength": 72
}
```

### Full Configuration

```json
{
  "apiKeys": {
    "openai": "sk-...",
    "timeweb": "tw-..."
  },
  "defaultProvider": "timeweb",
  "defaultModel": "gpt-4o-mini",
  "language": "en",
  "maxCommitLength": 72,
  "includeScope": false,
  "analysisMode": "full",
  "customInstructions": "Use conventional commits format"
}
```

## 🔗 Useful Links

- [Basic Commands](commands.md)
- [Configuration](configuration.md)
- [Usage Examples](examples.md)

