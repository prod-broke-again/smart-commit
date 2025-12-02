# Configuration

## 📁 Configuration Structure

Smart Commit uses two levels of configuration:

1. **Global configuration** - user settings (stored in `~/.smart-commit/config.json`)
2. **Project configuration** - settings for a specific project (`.smart-commit.json` file)

## 🌍 Global Configuration

### File Location

- **Windows**: `%USERPROFILE%\.smart-commit\config.json`
- **macOS/Linux**: `~/.smart-commit/config.json`

### Main Parameters

```json
{
  "apiKey": "your-api-key",
  "apiKeys": {
    "openai": "sk-...",
    "timeweb": "tw-...",
    "anthropic": "sk-ant-...",
    "gemini": "..."
  },
  "defaultProvider": "gptunnel",
  "defaultModel": "gpt-4o-mini",
  "language": "en",
  "maxTokens": 1000,
  "temperature": 0.7,
  "maxCommitLength": 72,
  "includeScope": false,
  "analysisMode": "lite",
  "customInstructions": "Use conventional commits format",
  "useWalletBalance": true
}
```

### Parameters

| Parameter | Description | Possible Values | Default |
|-----------|-------------|----------------|---------|
| `apiKey` | ⚠️ **Deprecated** - API key for AI (for backward compatibility) | String | - |
| `apiKeys` | ✅ **Recommended** - API keys for different providers | Object `{ "provider": "key" }` | `{}` |
| `defaultProvider` | AI provider | `gptunnel`, `openai`, `anthropic`, `claude`, `gemini`, `google`, `timeweb` | `gptunnel` |
| `defaultModel` | AI model | Depends on provider | `gpt-5-nano` |
| `language` | Commit language | `ru`, `en` | `en` |
| `maxTokens` | Maximum number of tokens | Number | `1000` |
| `temperature` | Generation temperature | `0-2` | `0.7` |
| `maxCommitLength` | Maximum commit length | `50-100` | `72` |
| `includeScope` | Include scope in commits | `true`, `false` | `false` |
| `analysisMode` | Analysis mode | `lite`, `full` | `lite` |
| `customInstructions` | Custom instructions | Any text | - |
| `useWalletBalance` | Use wallet balance (only for gptunnel) | `true`, `false` | `true` |

### ⚠️ Important: Migration from apiKey to apiKeys

If you're using the old format with a single `apiKey`, it's recommended to migrate to the new format:

```bash
# Old way (still works)
smart-commit config --global --set apiKey=YOUR_KEY

# New way (recommended)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
```

**Key selection priority:**
1. Project `apiKey` (if specified in `.smart-commit.json`)
2. Global `apiKeys[provider]` (key for specific provider)
3. Global `apiKey` (for backward compatibility)

## 📁 Project Configuration

### File Location

The `.smart-commit.json` file should be located in the project root.

### Structure

```json
{
  "apiKey": "project-specific-key",
  "defaultProvider": "timeweb",
  "defaultModel": "gpt-4o-mini",
  "language": "en",
  "maxCommitLength": 72,
  "includeScope": false,
  "analysisMode": "full",
  "customInstructions": "Use conventional commits format",
  "serverCommands": {
    "enabled": true,
    "autoExecute": false,
    "projectPath": "/var/www/project",
    "server": {
      "host": "server.com",
      "user": "deploy",
      "port": 22,
      "keyPath": "~/.ssh/id_rsa"
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": ["composer install --no-dev --optimize-autoloader"],
      "database": ["php artisan migrate --force"],
      "system": ["sudo systemctl restart php8.3-fpm"]
    },
    "whitelist": ["npm", "composer", "php artisan", "sudo systemctl"]
  },
  "projectInfo": {
    "type": "php",
    "framework": "laravel",
    "packageManager": "composer"
  }
}
```

## 🔧 Configuration Management

### Viewing Settings

```bash
# Show all settings
smart-commit config --list

# Show global settings
smart-commit config --global --list

# Show specific setting
smart-commit config --get language
```

### Changing Settings

```bash
# Set value
smart-commit config --set language=en

# Set globally (old way - deprecated)
smart-commit config --global --set apiKey=your-key

# Set keys for different providers (new way - recommended)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...

# Set for project (overrides global settings)
smart-commit config --set maxCommitLength=50
smart-commit config --set apiKey=project-key
smart-commit config --set defaultProvider=timeweb
smart-commit config --set defaultModel=gpt-4o-mini
```

### Provider Setup Examples

#### OpenAI
```bash
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set defaultProvider=openai
smart-commit config --global --set defaultModel=gpt-4o-mini
```

#### Timeweb AI
```bash
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set defaultProvider=timeweb
smart-commit config --global --set defaultModel=gpt-4o-mini
```

#### Anthropic Claude
```bash
smart-commit config --global --set apiKeys.anthropic=sk-ant-...
smart-commit config --global --set defaultProvider=anthropic
smart-commit config --global --set defaultModel=claude-3-5-sonnet-20241022
```

#### Google Gemini
```bash
smart-commit config --global --set apiKeys.gemini=...
smart-commit config --global --set defaultProvider=gemini
smart-commit config --global --set defaultModel=gemini-1.5-flash-latest
```

### Project Configuration Generation

```bash
smart-commit generate-config
```

This command:
- Analyzes project structure
- Determines project type
- Creates basic configuration
- Suggests deployment settings

## 🚀 Deployment Configuration

### Main Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `enabled` | Enable server commands | Yes |
| `autoExecute` | Automatic execution | No |
| `projectPath` | Path to project on server | Yes |
| `server.host` | Server IP or domain | Yes |
| `server.user` | SSH user | Yes |
| `server.port` | SSH port | No (22) |
| `server.keyPath` | Path to SSH key | No |

### Command Categories

#### Git Commands
```json
{
  "commands": {
    "git": ["git pull origin main", "git checkout main"]
  }
}
```

#### Frontend Commands
```json
{
  "commands": {
    "frontend": ["npm install", "npm run build", "npm run test"]
  }
}
```

#### Backend Commands
```json
{
  "commands": {
    "backend": [
      "composer install --no-dev --optimize-autoloader",
      "php artisan config:cache",
      "php artisan route:cache"
    ]
  }
}
```

#### Database Commands
```json
{
  "commands": {
    "database": ["php artisan migrate --force", "php artisan db:seed"]
  }
}
```

#### System Commands
```json
{
  "commands": {
    "system": [
      "sudo systemctl restart php8.3-fpm",
      "sudo systemctl restart nginx",
      "sudo systemctl restart redis"
    ]
  }
}
```

### Command Whitelist

For security, always specify allowed commands:

```json
{
  "whitelist": [
    "npm",
    "yarn",
    "composer",
    "php artisan",
    "git",
    "sudo systemctl",
    "sudo apt-get"
  ]
}
```

## 📊 Configuration Examples

### Laravel Project

```json
{
  "apiKey": "project-key",
  "defaultProvider": "timeweb",
  "defaultModel": "gpt-4o-mini",
  "language": "en",
  "maxCommitLength": 72,
  "includeScope": false,
  "analysisMode": "full",
  "customInstructions": "Use conventional commits format for Laravel project",
  "serverCommands": {
    "enabled": true,
    "autoExecute": false,
    "projectPath": "/var/www/laravel-app",
    "server": {
      "host": "192.168.1.100",
      "user": "deploy",
      "port": 22,
      "keyPath": "~/.ssh/id_rsa"
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": [
        "composer install --no-dev --optimize-autoloader",
        "php artisan config:cache",
        "php artisan route:cache",
        "php artisan view:cache"
      ],
      "database": ["php artisan migrate --force"],
      "system": ["sudo systemctl restart php8.3-fpm", "sudo systemctl restart nginx"]
    },
    "whitelist": ["npm", "composer", "php artisan", "sudo systemctl"]
  },
  "projectInfo": {
    "type": "php",
    "framework": "laravel",
    "packageManager": "composer"
  }
}
```

### Node.js Project

```json
{
  "apiKey": "project-key",
  "defaultProvider": "openai",
  "defaultModel": "gpt-3.5-turbo",
  "language": "en",
  "maxCommitLength": 50,
  "includeScope": false,
  "analysisMode": "lite",
  "serverCommands": {
    "enabled": true,
    "autoExecute": false,
    "projectPath": "/var/www/node-app",
    "server": {
      "host": "node-server.com",
      "user": "deploy",
      "port": 22
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": ["npm install --production"],
      "system": ["sudo systemctl restart node-app"]
    },
    "whitelist": ["npm", "sudo systemctl"]
  },
  "projectInfo": {
    "type": "nodejs",
    "framework": "express",
    "packageManager": "npm"
  }
}
```

### Vue.js Project

```json
{
  "apiKey": "project-key",
  "defaultProvider": "timeweb",
  "defaultModel": "gpt-4o-mini",
  "language": "en",
  "maxCommitLength": 72,
  "includeScope": false,
  "analysisMode": "full",
  "customInstructions": "Use conventional commits with scope for Vue.js components",
  "serverCommands": {
    "enabled": true,
    "autoExecute": false,
    "projectPath": "/var/www/vue-app",
    "server": {
      "host": "vue-server.com",
      "user": "deploy",
      "port": 22
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "system": ["sudo systemctl restart nginx"]
    },
    "whitelist": ["npm", "sudo systemctl"]
  },
  "projectInfo": {
    "type": "nodejs",
    "framework": "vue",
    "packageManager": "npm"
  }
}
```

## 🔒 Security

### SSH Keys

It's recommended to use SSH keys instead of passwords:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy key to server
ssh-copy-id user@server.com
```

### Command Restrictions

Always use `whitelist` to limit available commands:

```json
{
  "whitelist": [
    "npm",
    "composer",
    "php artisan",
    "sudo systemctl"
  ]
}
```

### User Permissions

Make sure the user has minimal necessary permissions:

```bash
# Check user permissions
ssh user@server.com "sudo -l"
```

## 🆘 Troubleshooting

### Error "Configuration file not found"

```bash
smart-commit generate-config
```

### Error "Invalid configuration"

Check JSON syntax in the configuration file.

### Error "API key not found"

```bash
smart-commit config --set apiKey=your-key
# or
smart-commit config --global --set apiKeys.provider=your-key
```

### Error "Server configuration is missing"

Check the `serverCommands` section in `.smart-commit.json`.

## 🔗 Useful Links

- [Installation and Setup](setup.md)
- [Basic Commands](commands.md)
- [Smart Deploy](smart-deploy.md)
- [Regular Deploy](deploy.md)
- [Usage Examples](examples.md)

