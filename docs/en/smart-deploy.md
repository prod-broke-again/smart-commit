# Smart Deploy (deploy-smart)

## 🧠 What is Smart Deploy?

Smart deploy analyzes changes in your project and executes only the commands that are actually needed. This saves time, server resources, and reduces the risk of errors.

## 🚀 Usage

```bash
smart-commit deploy-smart
```

## 🔍 How It Works?

1. **Change Analysis** — analyzes the last commit and determines which files changed
2. **Action Determination** — based on changed file types, decides which commands are needed
3. **Command Generation** — builds the list of required **remote** commands only
4. **Confirmation** — shows `localCommands` (if any) and remote commands; user confirms
5. **Execution** — runs `localCommands` locally first, then remote commands over SSH. Any failure **stops the deploy** (fail-fast). Each remote command is limited by `server.commandTimeoutSeconds` (default 300s)

## 📊 File Analysis

### Composer Dependencies
- `composer.json` or `composer.lock` → `composer install --no-dev --optimize-autoloader`

### NPM Dependencies
- `package.json` or `package-lock.json` → `npm install`

### Frontend Files
- `resources/js/`, `resources/css/`, `resources/views/` → `npm run build`
- `webpack.mix.js`, `vite.config.js` → `npm run build`

### Laravel Configuration
- `config/`, `.env`, `routes/`, `app/Providers/` → `php artisan optimize:clear`

### Database Migrations
- `database/migrations/` → `php artisan migrate --force`

### System Files
- `nginx.conf`, `php.ini`, `supervisor/` → service restart

## 📋 Work Examples

### Frontend Changes Only

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • Detected changes in 3 files
  • Frontend files changed (resources/js/components/Button.vue)
  • Frontend files changed (resources/css/app.css)

⚠️  Smart deployment will run N step(s) (local first, then remote):
Server: root@217.198.12.212
  Local (this machine):
    1. npm run build
  Remote (SSH):
    1. git pull origin main
    2. npm run build

Continue? [y/N]
```

### Laravel Configuration Changes

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • Detected changes in 2 files
  • Laravel configuration changed (config/app.php)
  • Laravel configuration changed (.env)

⚠️  Smart deployment will run N step(s) (local first, then remote):
Server: root@217.198.12.212
  Remote (SSH):
    1. git pull origin main
    2. php artisan optimize:clear

Continue? [y/N]
```

### Adding New Library

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • Detected changes in 1 files
  • Composer dependencies changed (composer.json)

⚠️  Smart deployment will run N step(s) (local first, then remote):
Server: root@217.198.12.212
  Remote (SSH):
    1. git pull origin main
    2. composer install --no-dev --optimize-autoloader

Continue? [y/N]
```

### No Changes

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • No changes detected in last commit

✅ No deployment needed - no changes detected!
```

## ⚙️ Configuration

### Server Configuration

Create `.smart-commit.json` file in project root:

```json
{
  "serverCommands": {
    "enabled": true,
    "autoExecute": false,
    "projectPath": "/var/www/your-project",
    "server": {
      "host": "your-server.com",
      "user": "deploy",
      "port": 22,
      "keyPath": "~/.ssh/id_rsa",
      "commandTimeoutSeconds": 300
    },
    "localCommands": [],
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": ["composer install --no-dev --optimize-autoloader", "php artisan optimize:clear"],
      "database": ["php artisan migrate --force"],
      "system": ["sudo systemctl restart php8.3-fpm", "sudo systemctl restart nginx"]
    },
    "whitelist": ["npm", "yarn", "composer", "php artisan", "sudo systemctl"]
  }
}
```

### Configuration Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `enabled` | Enable server commands | Yes |
| `autoExecute` | Automatic execution without confirmation | No |
| `projectPath` | Path to project on server | Yes |
| `server.host` | Server IP or domain | Yes |
| `server.user` | SSH user | Yes |
| `server.port` | SSH port (default 22) | No |
| `server.keyPath` | Path to SSH key | No |
| `server.commandTimeoutSeconds` | Max seconds per remote command (default 300) | No |
| `localCommands` | Commands on your machine before SSH | No |
| `whitelist` | Allowed commands | Yes |

See also: [Configuration — local preparation and behavior](configuration.md#local-preparation-and-deploy-behavior).

## 🔒 Security

### SSH Keys

It's recommended to use SSH keys instead of passwords:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy key to server
ssh-copy-id user@server.com
```

### Command Whitelist

Always specify `whitelist` with allowed commands for security:

```json
{
  "whitelist": [
    "npm",
    "yarn", 
    "composer",
    "php artisan",
    "git",
    "sudo systemctl"
  ]
}
```

## 🆘 Troubleshooting

### Error "Configuration file not found"

```bash
smart-commit generate-config
```

### Error "Server configuration is missing"

Check `.smart-commit.json` file and make sure all required parameters are specified.

### SSH Connection Error

```bash
# Check connection
ssh user@server.com

# Check SSH key
ssh-add -l
```

### Error "Git analysis failed"

Make sure you're in a Git repository and there are commits:

```bash
git status
git log --oneline -5
```

## 🎯 Smart Deploy Advantages

- **⚡ Faster** - executes only needed commands
- **🔒 Safer** - doesn't restart services unnecessarily  
- **💰 More Economical** - less server load
- **🎯 More Accurate** - analyzes changes and makes decisions
- **🛡️ More Reliable** - less risk of errors from unnecessary commands

## 🔗 Useful Links

- [Basic Commands](commands.md)
- [Regular Deploy](deploy.md)
- [Configuration](configuration.md)
- [Usage Examples](examples.md)

