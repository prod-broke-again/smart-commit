# Usage Examples

## 🚀 Basic Scenarios

### 1. Initial Setup

```bash
# Installation
npm install -g smart-commit-ai

# Setup
smart-commit setup

# Set API keys for different providers (recommended)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set defaultProvider=timeweb

# Generate project configuration
smart-commit generate-config
```

### 2. Daily Work

```bash
# Add changes
git add .

# Create commit
smart-commit

# Smart deploy
smart-commit deploy-smart
```

### 3. Working with Branches

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

## 🔧 Special Cases

### Dry Run (Check Without Commit)

```bash
# See what will be committed
smart-commit --dry-run --verbose
```

### Only Generate Message

```bash
# Generate message without committing
smart-commit --generate-only
```

### Custom Message

```bash
# Use your own message
smart-commit -m "fix: fixed critical error"
```

### Force Commit

```bash
# Ignore validation
smart-commit --force
```

## 🏗️ Different Project Types

### Laravel Project

```bash
# Laravel project setup
smart-commit generate-config

# Result: .smart-commit.json
{
  "serverCommands": {
    "enabled": true,
    "projectPath": "/var/www/laravel-app",
    "server": {
      "host": "192.168.1.100",
      "user": "deploy"
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": ["composer install --no-dev --optimize-autoloader", "php artisan optimize:clear"],
      "database": ["php artisan migrate --force"],
      "system": ["sudo systemctl restart php8.3-fpm", "sudo systemctl restart nginx"]
    }
  }
}

# Deploy
smart-commit deploy-smart
```

### Node.js Project

```bash
# Node.js project setup
smart-commit generate-config

# Result: .smart-commit.json
{
  "serverCommands": {
    "enabled": true,
    "projectPath": "/var/www/node-app",
    "server": {
      "host": "node-server.com",
      "user": "deploy"
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": ["npm install --production"],
      "system": ["sudo systemctl restart node-app"]
    }
  }
}

# Deploy
smart-commit deploy-smart
```

### Vue.js Project

```bash
# Vue.js project setup
smart-commit generate-config

# Result: .smart-commit.json
{
  "serverCommands": {
    "enabled": true,
    "projectPath": "/var/www/vue-app",
    "server": {
      "host": "vue-server.com",
      "user": "deploy"
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "system": ["sudo systemctl restart nginx"]
    }
  }
}

# Deploy
smart-commit deploy-smart
```

## 🎯 Smart Deploy in Action

### Frontend Changes Only

```bash
# Changed Vue component
git add resources/js/components/Button.vue
git commit -m "feat: added new button"

# Smart deploy
smart-commit deploy-smart

# Result:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • Detected changes in 1 files
#   • Frontend files changed (resources/js/components/Button.vue)
# ⚠️ Smart deployment will execute 2 commands:
#   1. git pull origin main
#   2. npm run build
```

### Laravel Configuration Changes

```bash
# Changed configuration
git add config/app.php
git commit -m "config: updated app settings"

# Smart deploy
smart-commit deploy-smart

# Result:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • Detected changes in 1 files
#   • Laravel configuration changed (config/app.php)
# ⚠️ Smart deployment will execute 2 commands:
#   1. git pull origin main
#   2. php artisan optimize:clear
```

### Adding New Library

```bash
# Added new library
composer require laravel/sanctum
git add composer.json composer.lock
git commit -m "feat: added Laravel Sanctum"

# Smart deploy
smart-commit deploy-smart

# Result:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • Detected changes in 2 files
#   • Composer dependencies changed (composer.json)
#   • Composer dependencies changed (composer.lock)
# ⚠️ Smart deployment will execute 2 commands:
#   1. git pull origin main
#   2. composer install --no-dev --optimize-autoloader
```

### No Changes

```bash
# Attempt to deploy without changes
smart-commit deploy-smart

# Result:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • No changes detected in last commit
# ✅ No deployment needed - no changes detected!
```

## 🔧 Configuration Setup

### Changing Language

```bash
# Russian
smart-commit config --set language=ru

# English
smart-commit config --set language=en
```

### Setting API Keys for Different Providers

```bash
# Set keys for all providers
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...
smart-commit config --global --set apiKeys.gemini=...

# Switch to another provider
smart-commit config --global --set defaultProvider=timeweb
```

### Changing AI Model

```bash
# GPT-4o-mini (recommended)
smart-commit config --set defaultModel=gpt-4o-mini

# GPT-4 (better, but more expensive)
smart-commit config --set defaultModel=gpt-4

# Claude 3.5 Sonnet
smart-commit config --set defaultModel=claude-3-5-sonnet-20241022
```

### Project Settings

```bash
# For simple project - lightweight model
smart-commit config --set defaultModel=gpt-3.5-turbo
smart-commit config --set defaultProvider=openai

# For large project - model with large context
smart-commit config --set defaultModel=gpt-4o
smart-commit config --set defaultProvider=timeweb

# Project-specific API key
smart-commit config --set apiKey=project-specific-key
```

### Changing Commit Length

```bash
# Short commits
smart-commit config --set maxCommitLength=50

# Long commits
smart-commit config --set maxCommitLength=100
```

### Enabling/Disabling Scope

```bash
# Enable scope
smart-commit config --set includeScope=true

# Disable scope
smart-commit config --set includeScope=false
```

### Custom Instructions

```bash
# Set custom instructions
smart-commit config --set customInstructions="Use conventional commits format with scope"
```

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g smart-commit-ai
      - run: smart-commit config --global --set apiKeys.openai=${{ secrets.OPENAI_API_KEY }}
      - run: smart-commit config --global --set defaultProvider=openai
      - run: smart-commit deploy-smart
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - npm install -g smart-commit-ai
    - smart-commit config --global --set apiKeys.openai=$OPENAI_API_KEY
    - smart-commit config --global --set defaultProvider=openai
    - smart-commit deploy-smart
  only:
    - main
```

## 🆘 Troubleshooting

### Error "No changes to commit"

```bash
# Add changes
git add .

# Check status
git status

# Create commit
smart-commit
```

### Error "Configuration file not found"

```bash
# Create configuration
smart-commit generate-config
```

### Error "API key not found"

```bash
# Set API key
# New way (recommended)
smart-commit config --global --set apiKeys.provider=your-key

# Old way (for backward compatibility)
smart-commit config --set apiKey=your-key
```

### SSH Connection Error

```bash
# Check connection
ssh user@server.com

# Check SSH key
ssh-add -l

# Add SSH key
ssh-add ~/.ssh/id_rsa
```

## 🔗 Useful Links

- [Installation and Setup](setup.md)
- [Basic Commands](commands.md)
- [Smart Deploy](smart-deploy.md)
- [Regular Deploy](deploy.md)
- [Configuration](configuration.md)

