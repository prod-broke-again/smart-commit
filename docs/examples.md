# Примеры использования

## 🚀 Базовые сценарии

### 1. Первоначальная настройка

```bash
# Установка
npm install -g smart-commit-ai

# Настройка
smart-commit setup

# Генерация конфигурации проекта
smart-commit generate-config
```

### 2. Ежедневная работа

```bash
# Добавить изменения
git add .

# Создать коммит
smart-commit

# Умный деплой
smart-commit deploy-smart
```

### 3. Работа с ветками

```bash
# Создать новую ветку
git checkout -b feature/new-feature

# Внести изменения и закоммитить
git add .
smart-commit

# Переключиться на main и смержить
git checkout main
git merge feature/new-feature

# Деплой
smart-commit deploy-smart
```

## 🔧 Специальные случаи

### Dry run (проверка без коммита)

```bash
# Посмотреть что будет закоммичено
smart-commit --dry-run --verbose
```

### Только генерация сообщения

```bash
# Сгенерировать сообщение без коммита
smart-commit --generate-only
```

### Кастомное сообщение

```bash
# Использовать свое сообщение
smart-commit -m "fix: исправлена критическая ошибка"
```

### Принудительный коммит

```bash
# Игнорировать валидацию
smart-commit --force
```

## 🏗️ Проекты разных типов

### Laravel проект

```bash
# Настройка Laravel проекта
smart-commit generate-config

# Результат: .smart-commit.json
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

# Деплой
smart-commit deploy-smart
```

### Node.js проект

```bash
# Настройка Node.js проекта
smart-commit generate-config

# Результат: .smart-commit.json
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

# Деплой
smart-commit deploy-smart
```

### Vue.js проект

```bash
# Настройка Vue.js проекта
smart-commit generate-config

# Результат: .smart-commit.json
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

# Деплой
smart-commit deploy-smart
```

## 🎯 Умный деплой в действии

### Изменения только во фронтенде

```bash
# Изменили Vue компонент
git add resources/js/components/Button.vue
git commit -m "feat: добавил новую кнопку"

# Умный деплой
smart-commit deploy-smart

# Результат:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • Detected changes in 1 files
#   • Frontend files changed (resources/js/components/Button.vue)
# ⚠️ Smart deployment will execute 2 commands:
#   1. git pull origin main
#   2. npm run build
```

### Изменения в конфигурации Laravel

```bash
# Изменили конфигурацию
git add config/app.php
git commit -m "config: обновил настройки приложения"

# Умный деплой
smart-commit deploy-smart

# Результат:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • Detected changes in 1 files
#   • Laravel configuration changed (config/app.php)
# ⚠️ Smart deployment will execute 2 commands:
#   1. git pull origin main
#   2. php artisan optimize:clear
```

### Добавление новой библиотеки

```bash
# Добавили новую библиотеку
composer require laravel/sanctum
git add composer.json composer.lock
git commit -m "feat: добавил Laravel Sanctum"

# Умный деплой
smart-commit deploy-smart

# Результат:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • Detected changes in 2 files
#   • Composer dependencies changed (composer.json)
#   • Composer dependencies changed (composer.lock)
# ⚠️ Smart deployment will execute 2 commands:
#   1. git pull origin main
#   2. composer install --no-dev --optimize-autoloader
```

### Нет изменений

```bash
# Попытка деплоя без изменений
smart-commit deploy-smart

# Результат:
# 🔍 Analyzing changes for smart deployment...
# 📊 Analysis Results:
#   • No changes detected in last commit
# ✅ No deployment needed - no changes detected!
```

## 🔧 Настройка конфигурации

### Изменение языка

```bash
# Русский язык
smart-commit config --set language=ru

# Английский язык
smart-commit config --set language=en
```

### Изменение модели ИИ

```bash
# GPT-4 (лучше, но дороже)
smart-commit config --set aiModel=gpt-4

# GPT-3.5 Turbo (быстрее, дешевле)
smart-commit config --set aiModel=gpt-3.5-turbo
```

### Изменение длины коммита

```bash
# Короткие коммиты
smart-commit config --set maxCommitLength=50

# Длинные коммиты
smart-commit config --set maxCommitLength=100
```

### Включение/отключение scope

```bash
# Включить scope
smart-commit config --set includeScope=true

# Отключить scope
smart-commit config --set includeScope=false
```

### Кастомные инструкции

```bash
# Установить кастомные инструкции
smart-commit config --set customInstructions="Используй conventional commits формат с scope"
```

## 🚀 CI/CD интеграция

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
      - run: smart-commit config --set apiKey=${{ secrets.API_KEY }}
      - run: smart-commit deploy-smart
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - npm install -g smart-commit-ai
    - smart-commit config --set apiKey=$API_KEY
    - smart-commit deploy-smart
  only:
    - main
```

## 🆘 Решение проблем

### Ошибка "No changes to commit"

```bash
# Добавить изменения
git add .

# Проверить статус
git status

# Создать коммит
smart-commit
```

### Ошибка "Configuration file not found"

```bash
# Создать конфигурацию
smart-commit generate-config
```

### Ошибка "API key not found"

```bash
# Установить API ключ
smart-commit config --set apiKey=your-key
```

### Ошибка SSH подключения

```bash
# Проверить подключение
ssh user@server.com

# Проверить SSH ключ
ssh-add -l

# Добавить SSH ключ
ssh-add ~/.ssh/id_rsa
```

## 🔗 Полезные ссылки

- [Установка и настройка](setup.md)
- [Основные команды](commands.md)
- [Умный деплой](smart-deploy.md)
- [Обычный деплой](deploy.md)
- [Конфигурация](configuration.md)
