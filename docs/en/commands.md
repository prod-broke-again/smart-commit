# Basic Commands

## 🚀 Commit Generation

### Standard Generation

```bash
smart-commit
```

Automatically:
- Analyzes changes in repository
- Generates meaningful commit message
- Creates commit and pushes to repository

### Generation Options

```bash
# Only show what will be committed (dry run)
smart-commit --dry-run

# Only generate message without committing
smart-commit --generate-only

# Use custom message
smart-commit -m "fix: fixed API error"

# Verbose output
smart-commit --verbose

# Force commit (ignore validation)
smart-commit --force
```

## 🔧 Configuration Management

### Viewing Configuration

```bash
# Show all settings
smart-commit config --list

# Show specific setting
smart-commit config --get language
```

### Changing Configuration

```bash
# Set value
smart-commit config --set language=en

# Set keys for different providers (new way - recommended)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...

# Set globally (old way - deprecated)
smart-commit config --global --set apiKey=your_key

# Set project-specific settings
smart-commit config --set apiKey=project-key
smart-commit config --set defaultProvider=timeweb
smart-commit config --set defaultModel=gpt-4o-mini
```

### Available Settings

| Parameter | Description | Possible Values |
|-----------|-------------|----------------|
| `apiKey` | ⚠️ Deprecated - API key (for backward compatibility) | String |
| `apiKeys` | ✅ Recommended - API keys for providers | Object `{ "provider": "key" }` |
| `defaultProvider` | AI provider | `gptunnel`, `openai`, `anthropic`, `claude`, `gemini`, `google`, `timeweb` |
| `defaultModel` | AI model | Depends on provider |
| `language` | Commit language | `ru`, `en` |
| `maxCommitLength` | Maximum commit length | `50-100` |
| `includeScope` | Include scope | `true`, `false` |
| `analysisMode` | Analysis mode | `lite`, `full` |
| `customInstructions` | Custom instructions | Any text |

## 🤖 AI Model Management

### Viewing Models

```bash
# Show first 15 models
smart-commit models list

# Show all models
smart-commit models list --all
```

### Updating Models

```bash
# Refresh model list from API
smart-commit models refresh

# Clear model cache
smart-commit models clear-cache
```

## 📁 Project Management

### Project Configuration Generation

```bash
smart-commit generate-config
```

Creates `.smart-commit.json` file with settings for current project.

### Initial Setup

```bash
smart-commit setup
```

Interactive setup of all parameters.

## 🚀 Deployment Commands

### Smart Deploy

```bash
smart-commit deploy-smart
```

Analyzes changes and executes only necessary commands.

### Full Deploy

```bash
smart-commit deploy
```

Executes all commands from configuration.

## 📊 Usage Examples

### Basic Workflow

```bash
# 1. Add changes
git add .

# 2. Generate and create commit
smart-commit

# 3. Smart deploy
smart-commit deploy-smart
```

### Working with Branches

```bash
# Create new branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
smart-commit

# Switch to main and merge
git checkout main
git merge feature/new-feature

# Deploy
smart-commit deploy-smart
```

### Debugging

```bash
# See what will be committed
smart-commit --dry-run --verbose

# Only generate message
smart-commit --generate-only

# Check configuration
smart-commit config --list
```

## 🔗 Git Hooks

### Installing Hooks

```bash
# Install commit-msg hook for automatic validation
smart-commit install-hooks
```

After installation, every `git commit` will automatically:
- Validate commit message format
- Improve message using AI if needed
- Prevent commits that don't follow conventional commits format

### Uninstalling Hooks

```bash
# Remove Git hooks
smart-commit uninstall-hooks
```

### How It Works

When you run `git commit -m "fix bug"`, the hook will:
1. Validate the message format
2. If invalid, try to improve it using AI
3. Replace the message with improved version
4. If improvement fails, show errors and prevent commit

You can skip hooks with `git commit --no-verify` if needed.

## 🔗 Useful Links

- [Installation and Setup](setup.md)
- [Smart Deploy](smart-deploy.md)
- [Regular Deploy](deploy.md)
- [Configuration](configuration.md)
- [Usage Examples](examples.md)

