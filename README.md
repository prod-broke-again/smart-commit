# Smart Commit AI

Умный инструмент для генерации осмысленных сообщений коммитов с использованием ИИ и автоматического деплоя.

## 🚀 Быстрый старт

```bash
# Установка
npm install -g smart-commit-ai

# Первоначальная настройка
smart-commit setup

# Генерация коммита
smart-commit

# Умный деплой
smart-commit deploy-smart
```

## ✨ Основные возможности

- **🤖 ИИ-генерация коммитов** - автоматическое создание осмысленных сообщений коммитов
- **📋 Conventional Commits** - поддержка стандарта conventional commits
- **🌍 Многоязычность** - генерация коммитов на русском и английском языках
- **🔧 Умный деплой** - анализ изменений и выполнение только необходимых команд
- **⚡ Быстрый деплой** - полный деплой всех команд
- **🎯 Анализ проекта** - автоматическое определение типа проекта и настройка

## 📚 Документация

- [📖 Полная документация](docs/README.md)
- [🚀 Установка и настройка](docs/setup.md)
- [🛠️ Основные команды](docs/commands.md)
- [🧠 Умный деплой](docs/smart-deploy.md)
- [⚡ Обычный деплой](docs/deploy.md)
- [⚙️ Конфигурация](docs/configuration.md)
- [📊 Примеры использования](docs/examples.md)

## 🛠️ Команды

| Команда | Описание |
|---------|----------|
| `smart-commit` | Генерация и создание коммита |
| `smart-commit deploy-smart` | Умный деплой (только нужные команды) |
| `smart-commit deploy` | Полный деплой всех команд |
| `smart-commit setup` | Первоначальная настройка |
| `smart-commit generate-config` | Генерация конфигурации проекта |
| `smart-commit config` | Управление конфигурацией |
| `smart-commit models` | Управление ИИ моделями |

## 🔧 Поддерживаемые проекты

- **PHP/Laravel** - полная поддержка с анализом composer.json
- **Node.js** - поддержка npm/yarn проектов
- **Vue.js/React** - анализ фронтенд файлов
- **TypeScript** - поддержка TS проектов
- **Docker** - базовые команды Docker

## 🎯 Умный деплой в действии

```bash
🔍 Analyzing changes for smart deployment...

📊 Analysis Results:
  • Detected changes in 2 files
  • Frontend files changed (resources/js/components/Button.vue)
  • NPM dependencies changed (package.json)

⚠️  Smart deployment will execute 3 commands:
  1. git pull origin main
  2. npm install
  3. npm run build

Continue? [y/N]
```

## 📦 Установка

```bash
npm install -g smart-commit-ai
```

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! См. [CONTRIBUTING.md](CONTRIBUTING.md) для деталей.

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:
- Создайте [Issue](https://github.com/prod-broke-again/smart-commit/issues)
- Обратитесь к [документации](docs/)

---

**Версия:** 1.0.10  
**Автор:** [Eugene (prod-broke-again)](https://github.com/prod-broke-again)