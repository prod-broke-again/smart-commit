# Умный деплой (deploy-smart)

## 🧠 Что такое умный деплой?

Умный деплой анализирует изменения в вашем проекте и выполняет только те команды, которые действительно необходимы. Это экономит время, ресурсы сервера и снижает риск ошибок.

## 🚀 Использование

```bash
smart-commit deploy-smart
```

## 🔍 Как это работает?

1. **Анализ изменений** — система анализирует последний коммит и определяет, какие файлы изменились
2. **Определение действий** — на основе типов изменённых файлов определяется, какие команды нужны
3. **Генерация команд** — создаётся список только необходимых **удалённых** команд
4. **Подтверждение** — показываются локальные команды (`localCommands`, если есть) и удалённые; пользователь подтверждает
5. **Выполнение** — сначала `localCommands` на вашей машине, затем команды на сервере по SSH. Ошибка на любом шаге останавливает процесс (**fail-fast**); таймаут на удалённые команды — `server.commandTimeoutSeconds` (по умолчанию 300 с)

## 📊 Анализ файлов

### Composer зависимости
- `composer.json` или `composer.lock` → `composer install --no-dev --optimize-autoloader`

### NPM зависимости
- `package.json` или `package-lock.json` → `npm install`

### Фронтенд файлы
- `resources/js/`, `resources/css/`, `resources/views/` → `npm run build`
- `webpack.mix.js`, `vite.config.js` → `npm run build`

### Laravel конфигурация
- `config/`, `.env`, `routes/`, `app/Providers/` → `php artisan optimize:clear`

### Миграции базы данных
- `database/migrations/` → `php artisan migrate --force`

### Системные файлы
- `nginx.conf`, `php.ini`, `supervisor/` → перезапуск сервисов

## 📋 Примеры работы

### Изменения только во фронтенде

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

### Изменения в конфигурации Laravel

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

### Добавление новой библиотеки

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

### Нет изменений

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • No changes detected in last commit

✅ No deployment needed - no changes detected!
```

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

### Параметры конфигурации

| Параметр | Описание | Обязательный |
|----------|----------|--------------|
| `enabled` | Включить команды сервера | Да |
| `autoExecute` | Автоматическое выполнение без подтверждения | Нет |
| `projectPath` | Путь к проекту на сервере | Да |
| `server.host` | IP или домен сервера | Да |
| `server.user` | Пользователь для SSH | Да |
| `server.port` | Порт SSH (по умолчанию 22) | Нет |
| `server.keyPath` | Путь к SSH ключу | Нет |
| `server.commandTimeoutSeconds` | Лимит (сек) на одну удалённую команду (по умолчанию 300) | Нет |
| `localCommands` | Команды локально до SSH | Нет |
| `whitelist` | Разрешенные команды | Да |

См. также: [Конфигурация — локальная подготовка и поведение](configuration.md).

## 🔒 Безопасность

### SSH ключи

Рекомендуется использовать SSH ключи вместо паролей:

```bash
# Генерация SSH ключа
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Копирование ключа на сервер
ssh-copy-id user@server.com
```

### Whitelist команд

Всегда указывайте `whitelist` с разрешенными командами для безопасности:

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

### Ошибка "Git analysis failed"

Убедитесь, что вы находитесь в Git репозитории и есть коммиты:

```bash
git status
git log --oneline -5
```

## 🎯 Преимущества умного деплоя

- **⚡ Быстрее** - выполняет только нужные команды
- **🔒 Безопаснее** - не перезапускает сервисы без необходимости  
- **💰 Экономичнее** - меньше нагрузки на сервер
- **🎯 Точнее** - анализирует изменения и принимает решения
- **🛡️ Надежнее** - меньше риск ошибок от ненужных команд

## 🔗 Полезные ссылки

- [Основные команды](commands.md)
- [Обычный деплой](deploy.md)
- [Конфигурация](configuration.md)
- [Примеры использования](examples.md)
