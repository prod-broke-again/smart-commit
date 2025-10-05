# Конфигурация

## 📁 Структура конфигурации

Smart Commit использует два уровня конфигурации:

1. **Глобальная конфигурация** - настройки пользователя (хранится в `~/.smart-commit/config.json`)
2. **Конфигурация проекта** - настройки для конкретного проекта (файл `.smart-commit.json`)

## 🌍 Глобальная конфигурация

### Расположение файла

- **Windows**: `%USERPROFILE%\.smart-commit\config.json`
- **macOS/Linux**: `~/.smart-commit/config.json`

### Основные параметры

```json
{
  "apiKey": "your-api-key",
  "defaultProvider": "gptunnel",
  "language": "ru",
  "aiModel": "gpt-4",
  "maxCommitLength": 72,
  "includeScope": true,
  "analysisMode": "full",
  "customInstructions": "Используй conventional commits формат",
  "useWalletBalance": false
}
```

### Параметры

| Параметр | Описание | Возможные значения | По умолчанию |
|----------|----------|-------------------|--------------|
| `apiKey` | API ключ для ИИ | Строка | - |
| `defaultProvider` | Провайдер ИИ | `gptunnel`, `openai` | `gptunnel` |
| `language` | Язык коммитов | `ru`, `en` | `ru` |
| `aiModel` | Модель ИИ | `gpt-4`, `gpt-3.5-turbo` | `gpt-4` |
| `maxCommitLength` | Максимальная длина коммита | `50-100` | `72` |
| `includeScope` | Включать scope в коммиты | `true`, `false` | `true` |
| `analysisMode` | Режим анализа | `basic`, `full` | `full` |
| `customInstructions` | Кастомные инструкции | Любой текст | - |
| `useWalletBalance` | Использовать баланс кошелька | `true`, `false` | `false` |

## 📁 Конфигурация проекта

### Расположение файла

Файл `.smart-commit.json` должен находиться в корне проекта.

### Структура

```json
{
  "language": "ru",
  "aiModel": "gpt-4",
  "maxCommitLength": 72,
  "includeScope": true,
  "analysisMode": "full",
  "customInstructions": "Используй conventional commits формат",
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

## 🔧 Управление конфигурацией

### Просмотр настроек

```bash
# Показать все настройки
smart-commit config --list

# Показать глобальные настройки
smart-commit config --global --list

# Показать конкретную настройку
smart-commit config --get language
```

### Изменение настроек

```bash
# Установить значение
smart-commit config --set language=ru

# Установить глобально
smart-commit config --global --set apiKey=your-key

# Установить для проекта
smart-commit config --set maxCommitLength=50
```

### Генерация конфигурации проекта

```bash
smart-commit generate-config
```

Эта команда:
- Анализирует структуру проекта
- Определяет тип проекта
- Создает базовую конфигурацию
- Предлагает настройки для деплоя

## 🚀 Конфигурация деплоя

### Основные параметры

| Параметр | Описание | Обязательный |
|----------|----------|--------------|
| `enabled` | Включить команды сервера | Да |
| `autoExecute` | Автоматическое выполнение | Нет |
| `projectPath` | Путь к проекту на сервере | Да |
| `server.host` | IP или домен сервера | Да |
| `server.user` | Пользователь для SSH | Да |
| `server.port` | Порт SSH | Нет (22) |
| `server.keyPath` | Путь к SSH ключу | Нет |

### Категории команд

#### Git команды
```json
{
  "commands": {
    "git": ["git pull origin main", "git checkout main"]
  }
}
```

#### Frontend команды
```json
{
  "commands": {
    "frontend": ["npm install", "npm run build", "npm run test"]
  }
}
```

#### Backend команды
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

#### Database команды
```json
{
  "commands": {
    "database": ["php artisan migrate --force", "php artisan db:seed"]
  }
}
```

#### System команды
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

### Whitelist команд

Для безопасности всегда указывайте разрешенные команды:

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
  "language": "ru",
  "aiModel": "gpt-4",
  "maxCommitLength": 72,
  "includeScope": true,
  "analysisMode": "full",
  "customInstructions": "Используй conventional commits формат для Laravel проекта",
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

### Node.js проект

```json
{
  "language": "en",
  "aiModel": "gpt-3.5-turbo",
  "maxCommitLength": 50,
  "includeScope": false,
  "analysisMode": "basic",
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

### Vue.js проект

```json
{
  "language": "ru",
  "aiModel": "gpt-4",
  "maxCommitLength": 72,
  "includeScope": true,
  "analysisMode": "full",
  "customInstructions": "Используй conventional commits с scope для Vue.js компонентов",
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

## 🔒 Безопасность

### SSH ключи

Рекомендуется использовать SSH ключи вместо паролей:

```bash
# Генерация SSH ключа
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Копирование ключа на сервер
ssh-copy-id user@server.com
```

### Ограничение команд

Всегда используйте `whitelist` для ограничения доступных команд:

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

### Права пользователя

Убедитесь, что пользователь имеет минимально необходимые права:

```bash
# Проверьте права пользователя
ssh user@server.com "sudo -l"
```

## 🆘 Решение проблем

### Ошибка "Configuration file not found"

```bash
smart-commit generate-config
```

### Ошибка "Invalid configuration"

Проверьте синтаксис JSON в файле конфигурации.

### Ошибка "API key not found"

```bash
smart-commit config --set apiKey=your-key
```

### Ошибка "Server configuration is missing"

Проверьте секцию `serverCommands` в `.smart-commit.json`.

## 🔗 Полезные ссылки

- [Установка и настройка](setup.md)
- [Основные команды](commands.md)
- [Умный деплой](smart-deploy.md)
- [Обычный деплой](deploy.md)
- [Примеры использования](examples.md)
