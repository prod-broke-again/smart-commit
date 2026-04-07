# Деплой (deploy)

## 🧠 Умный деплой по умолчанию

Начиная с текущей версии команда `deploy` работает в **smart-режиме** по умолчанию: анализирует изменённые файлы последнего коммита и запускает только те удалённые команды, которые действительно нужны.

Для полного запуска всех команд используйте флаг `--full`.

## 🚀 Использование

```bash
# Smart-режим (по умолчанию): только нужные команды на основе git diff
smart-commit deploy

# Full-режим: все категории команд (git / frontend / backend / database / system)
smart-commit deploy --full
```

## 🔍 Как работает smart-режим

1. **Анализ изменений** — система смотрит на `git diff HEAD~1 HEAD` и определяет, какие файлы изменились.
2. **Определение действий** — на основе типов файлов выбираются только нужные remote-команды.
3. **Подтверждение** — выводятся локальные команды (`localCommands`, если есть) и список remote-команд.
4. **Выполнение** — сначала `localCommands` на вашей машине (например, `npm run build`, `scp …`), затем SSH. При ошибке — **fail-fast**.

## ⚙️ Локальная сборка и передача фронтенда

Чтобы собирать фронтенд локально и отправлять артефакты на сервер, используйте поле `localCommands` в `.smart-commit.json`:

```json
{
  "serverCommands": {
    "localCommands": [
      "npm run build",
      "scp -r public/build deploy@203.0.113.10:/var/www/example-app/public/build"
    ]
  }
}
```

Или через rsync (рекомендуется для больших объёмов):

```json
{
  "serverCommands": {
    "localCommands": [
      "npm run build",
      "rsync -az --delete public/build/ deploy@203.0.113.10:/var/www/example-app/public/build/"
    ]
  }
}
```

> `localCommands` выполняются **до** SSH-подключения. Ошибка любой локальной команды останавливает процесс — сервер не затрагивается.

## ⚠️ Full-режим: порядок выполнения

При запуске `deploy --full` сначала выполняются `localCommands` (если заданы), затем по SSH — все секции в порядке: `git` → `frontend` → `backend` → `database` → `docker` → `system`.

```bash
⚠️  This will run local commands (if any), then remote commands over SSH:
Server: deploy@203.0.113.10

Commands to be executed:
Local (this machine):
  1. [local] npm run build
  2. [local] rsync -az --delete public/build/ deploy@203.0.113.10:/var/www/example-app/public/build/
Remote (SSH):
  1. [git] git pull origin main
  2. [backend] composer install --no-dev --optimize-autoloader
  3. [backend] php artisan optimize:clear
  ...

Continue? [y/N]
```

## 📊 Примеры smart-анализа

### Только фронтенд изменился

```bash
📊 Analysis Results:
  • Frontend files changed (resources/js/components/Button.vue)

⚠️  Smart deployment will run 3 step(s):
  Local (this machine):
    1. npm run build
    2. rsync -az --delete public/build/ deploy@203.0.113.10:/var/www/example-app/public/build/
  Remote (SSH):
    1. git pull origin main
    2. npm run build
```

### Только backend (PHP)

```bash
📊 Analysis Results:
  • Laravel configuration changed (config/app.php)

⚠️  Smart deployment will run 2 step(s):
  Remote (SSH):
    1. git pull origin main
    2. php artisan optimize:clear
```

### Нет изменений

```bash
✅ No deployment needed - no changes detected!
```

## ⚙️ Полная конфигурация

```json
{
  "serverCommands": {
    "enabled": true,
    "autoExecute": false,
    "projectPath": "/var/www/your-project",
    "localCommands": [
      "npm run build",
      "scp -r public/build deploy@your-server.com:/var/www/your-project/public/build"
    ],
    "server": {
      "host": "your-server.com",
      "user": "deploy",
      "port": 22,
      "keyPath": "~/.ssh/id_rsa",
      "commandTimeoutSeconds": 300
    },
    "commands": {
      "git": ["git pull origin main"],
      "frontend": ["npm install", "npm run build"],
      "backend": ["composer install --no-dev --optimize-autoloader", "php artisan optimize:clear"],
      "database": ["php artisan migrate --force"],
      "docker": [],
      "system": ["sudo systemctl reload php8.3-fpm", "sudo systemctl reload nginx"]
    },
    "whitelist": ["npm", "yarn", "composer", "php artisan", "sudo systemctl"]
  }
}
```

## 🔒 Безопасность

```bash
# Рекомендуется: SSH-ключ
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
ssh-copy-id deploy@your-server.com
```

Для CI/CD без подтверждений:

```json
{ "serverCommands": { "autoExecute": true } }
```

## 🆘 Решение проблем

### Ошибка "Configuration file not found"

```bash
smart-commit generate-config
```

### rsync не найден

Убедитесь, что `rsync` установлен и доступен в `PATH`. На Windows можно использовать WSL, Git Bash или `scp` вместо `rsync`.

### Ошибка SSH

```bash
ssh deploy@your-server.com  # проверить подключение
ssh-add -l                  # проверить загруженные ключи
```

## 🔗 Полезные ссылки

- [Основные команды](commands.md)
- [Конфигурация](configuration.md)
- [Примеры использования](examples.md)
