# Обычный деплой (deploy)

## 🚀 Что такое обычный деплой?

Обычный деплой выполняет все команды из конфигурации подряд, независимо от того, какие изменения были внесены. Это полезно для полного обновления проекта или когда нужно убедиться, что все команды выполнены.

## 🚀 Использование

```bash
smart-commit deploy
```

## ⚠️ Предупреждение

Команда покажет предупреждение с полным списком команд, которые будут выполнены:

```bash
⚠️  This will execute commands on the remote server:
Server: root@211.211.211.211

Commands to be executed:
  1. [git] git pull origin main
  2. [frontend] npm i
  3. [frontend] npm run build
  4. [backend] composer install --no-dev --optimize-autoloader
  5. [backend] php artisan optimize:clear
  6. [database] php artisan migrate --force
  7. [system] sudo apt-get update -y
  8. [system] sudo apt-get install php8.3-fpm -y
  9. [system] sudo systemctl restart php8.3-fpm
  10. [system] sudo systemctl restart nginx

Continue? [y/N]
```

## 📋 Категории команд

### Git команды
- `git pull origin main` - обновление кода с репозитория

### Frontend команды
- `npm install` - установка зависимостей
- `npm run build` - сборка фронтенда

### Backend команды
- `composer install --no-dev --optimize-autoloader` - установка PHP зависимостей
- `php artisan optimize:clear` - очистка кэша Laravel

### Database команды
- `php artisan migrate --force` - выполнение миграций

### System команды
- `sudo apt-get update -y` - обновление пакетов
- `sudo systemctl restart php8.3-fpm` - перезапуск PHP-FPM
- `sudo systemctl restart nginx` - перезапуск Nginx

## ⚙️ Настройка

### Конфигурация сервера

Создайте файл `.smart-commit.json` в корне проекта:

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
      "keyPath": "~/.ssh/id_rsa"
    },
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

### Автоматическое выполнение

Если вы хотите выполнять команды без подтверждения:

```json
{
  "serverCommands": {
    "autoExecute": true
  }
}
```

⚠️ **Внимание!** Используйте `autoExecute: true` только в CI/CD системах или когда вы полностью уверены в командах.

## 🔒 Безопасность

### SSH ключи

Рекомендуется использовать SSH ключи:

```bash
# Генерация SSH ключа
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Копирование ключа на сервер
ssh-copy-id user@server.com
```

### Whitelist команд

Всегда указывайте `whitelist` с разрешенными командами:

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

## 📊 Примеры конфигураций

### Laravel проект

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

### Node.js проект

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

## 🆘 Решение проблем

### Ошибка "Configuration file not found"

```bash
smart-commit generate-config
```

### Ошибка "Server configuration is missing"

Проверьте файл `.smart-commit.json` и убедитесь, что указаны все обязательные параметры.

### Ошибка SSH подключения

```bash
# Проверьте подключение
ssh user@server.com

# Проверьте SSH ключ
ssh-add -l
```

### Ошибка "Command not in whitelist"

Добавьте команду в `whitelist` в конфигурации:

```json
{
  "whitelist": ["npm", "composer", "php artisan", "sudo systemctl", "your-command"]
}
```

### Ошибка "Permission denied"

Убедитесь, что пользователь имеет права на выполнение команд:

```bash
# Проверьте права пользователя
ssh user@server.com "sudo -l"
```

## 🎯 Когда использовать обычный деплой?

- **Полное обновление** - когда нужно обновить все компоненты
- **Первоначальный деплой** - при первом развертывании проекта
- **Критические обновления** - когда нужно убедиться, что все команды выполнены
- **CI/CD системы** - в автоматизированных процессах

## 🔗 Полезные ссылки

- [Основные команды](commands.md)
- [Умный деплой](smart-deploy.md)
- [Конфигурация](configuration.md)
- [Примеры использования](examples.md)
