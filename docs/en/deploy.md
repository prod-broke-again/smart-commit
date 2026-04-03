# Regular Deploy (deploy)

## 🚀 What is Regular Deploy?

Regular deploy executes all commands from configuration sequentially, regardless of what changes were made. This is useful for full project updates or when you need to ensure all commands are executed.

## 🚀 Usage

```bash
smart-commit deploy
```

## ⚠️ Warning

The command shows **local** commands first (if `localCommands` is set), then **remote** commands over SSH:

```bash
⚠️  This will run local commands (if any), then remote commands over SSH:
Server: root@211.211.211.211

Commands to be executed:
Local (this machine):
  1. [local] npm run build
Remote (SSH):
  1. [git] git pull origin main
  2. [frontend] npm i
  ...

Continue? [y/N]
```

## 🔄 Execution order and failures

1. **Local** — `localCommands` run from the project root. On failure, **deploy stops** and SSH is not opened.
2. **Remote** — SSH commands from `commands` categories. On any failure → **fail-fast**; remaining remote commands are skipped.
3. **Timeout** — each remote command is limited by `server.commandTimeoutSeconds` (default 300s).

Details: [Configuration](configuration.md#local-preparation-and-deploy-behavior).

## 📋 Command Categories

### Git Commands
- `git pull origin main` - update code from repository

### Frontend Commands
- `npm install` - install dependencies
- `npm run build` - build frontend

### Backend Commands
- `composer install --no-dev --optimize-autoloader` - install PHP dependencies
- `php artisan optimize:clear` - clear Laravel cache

### Database Commands
- `php artisan migrate --force` - run migrations

### System Commands
- `sudo apt-get update -y` - update packages
- `sudo systemctl restart php8.3-fpm` - restart PHP-FPM
- `sudo systemctl restart nginx` - restart Nginx

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
      "docker": [],
      "system": ["sudo apt-get update -y", "sudo systemctl restart php8.3-fpm", "sudo systemctl restart nginx"]
    },
    "whitelist": ["npm", "yarn", "composer", "php artisan", "sudo systemctl", "sudo apt-get"]
  }
}
```

### Automatic Execution

If you want to execute commands without confirmation:

```json
{
  "serverCommands": {
    "autoExecute": true
  }
}
```

⚠️ **Warning!** Use `autoExecute: true` only in CI/CD systems or when you're completely sure about the commands.

## 🔒 Security

### SSH Keys

It's recommended to use SSH keys:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy key to server
ssh-copy-id user@server.com
```

### Command Whitelist

Always specify `whitelist` with allowed commands:

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
  }
}
```

### Node.js Project

```json
{
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
  }
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

### Error "Command not in whitelist"

Add command to `whitelist` in configuration:

```json
{
  "whitelist": ["npm", "composer", "php artisan", "sudo systemctl", "your-command"]
}
```

### Error "Permission denied"

Make sure the user has permissions to execute commands:

```bash
# Check user permissions
ssh user@server.com "sudo -l"
```

## 🎯 When to Use Regular Deploy?

- **Full Update** - when you need to update all components
- **Initial Deploy** - on first project deployment
- **Critical Updates** - when you need to ensure all commands are executed
- **CI/CD Systems** - in automated processes

## 🔗 Useful Links

- [Basic Commands](commands.md)
- [Smart Deploy](smart-deploy.md)
- [Configuration](configuration.md)
- [Usage Examples](examples.md)

