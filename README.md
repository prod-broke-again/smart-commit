# Smart Commit Tool

[![npm version](https://badge.fury.io/js/smart-commit.svg)](https://badge.fury.io/js/smart-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Глобальный инструмент для генерации осмысленных сообщений коммитов с использованием ИИ.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/prod-broke-again/smart-commit)

## 🚀 Особенности

- 🤖 **AI-powered**: Генерация сообщений коммитов с помощью GPT моделей через [gptunnel.ru](https://docs.gptunnel.ru)
- 💰 **Экономичный**: Использует самую дешевую модель GPT-5-nano ($0.001 за токен)
- 📝 **Conventional Commits**: Поддержка формата conventional commits
- 🔧 **Гибкая конфигурация**: Глобальные и проектные настройки
- 🎯 **Несколько режимов**: Стандартный, dry-run, только генерация, пользовательское сообщение
- ⚡ **Быстрый**: Генерация сообщений за < 30 секунд
- 🛠️ **Расширяемый**: Чистая архитектура с поддержкой SOLID принципов
- 🎨 **Красивый CLI**: Цветной вывод с индикаторами прогресса

## 📦 Установка

### 🚀 Быстрая установка

```bash
# Клонируйте репозиторий
git clone https://github.com/prod-broke-again/smart-commit.git
cd smart-commit

# Установите зависимости и соберите
npm install && npm run build

# Свяжите глобально (для разработки)
npm link

# Проверьте установку
smart-commit --version
```

### ⚡ Использование

```bash
# Перейдите в ваш git проект
cd your-project

# Обычный коммит (автоматически добавит все изменения)
smart-commit

# Только сгенерировать сообщение без коммита
smart-commit --generate-only

# Dry-run режим (показать что будет сделано)
smart-commit --dry-run

# Использовать свое сообщение
smart-commit -m "feat: add new feature"
```

## ⚙️ Настройка

### Первоначальная настройка

```bash
smart-commit setup
```

### Настройка API ключа

Получите API ключ на [gptunnel.ru/profile/business](https://gptunnel.ru/profile/business), затем:

```bash
smart-commit config --global --set apiKey=YOUR_API_KEY
```

### Основные настройки

```bash
# Выбор модели ИИ
smart-commit config --global --set defaultModel=gpt-4

# Настройка языка
smart-commit config --global --set language=ru

# Максимальная длина заголовка коммита
smart-commit config --global --set maxCommitLength=72

# Использование баланса кошелька для оплаты (для обычных пользователей, не компаний)
smart-commit config --global --set useWalletBalance=true

# Работа с моделями ИИ
smart-commit models list                    # Показать доступные модели
smart-commit models refresh                 # Обновить список моделей из API
smart-commit models clear-cache             # Очистить кэш моделей
```

## 📖 Использование

### Стандартный режим
Автоматически анализирует изменения, генерирует сообщение и создает коммит:

```bash
smart-commit
```

### Dry-run режим
Показывает, какое сообщение будет сгенерировано, без создания коммита:

```bash
smart-commit --dry-run
```

### Только генерация
Генерирует сообщение без создания коммита:

```bash
smart-commit --generate-only
```

### Пользовательское сообщение
Использует указанное сообщение вместо генерации:

```bash
smart-commit --message "feat: add new authentication system"
```

## 📋 Конфигурация

### Глобальная конфигурация
Хранится в `~/.smart-commit/config.json`:

```json
{
  "apiKey": "your-api-key",
  "defaultModel": "gpt-3.5-turbo",
  "defaultProvider": "gptunnel",
  "maxTokens": 1000,
  "temperature": 0.7,
  "language": "en",
  "useWalletBalance": true
}
```

### Проектная конфигурация
Хранится в `.smart-commit.json` в корне проекта:

```json
{
  "ignoredFiles": ["*.log", "dist/"],
  "customTypes": {},
  "maxCommitLength": 72,
  "includeScope": false,
  "conventionalCommitsOnly": true,
  "customInstructions": null
}
```

### 💰 Настройка оплаты

#### useWalletBalance

Настройка `useWalletBalance` определяет, откуда будут списываться средства за использование GPTunnel API:

- **`true`** (по умолчанию): Средства списываются с баланса вашего личного кошелька. Используйте для обычных пользователей без компании.
- **`false`**: Средства списываются с баланса компании (если у вас есть корпоративный аккаунт).

```bash
# Для обычных пользователей (использование баланса кошелька)
smart-commit config --global --set useWalletBalance=true

# Для корпоративных пользователей (баланс компании)
smart-commit config --global --set useWalletBalance=false
```

## 🤖 Управление моделями ИИ

Smart Commit Tool поддерживает динамическую загрузку моделей из API GPTunnel. Это позволяет всегда использовать актуальный список доступных моделей.

### Автоматическая загрузка

При первом запуске инструмент автоматически пытается загрузить модели из API. Если загрузка не удалась, используются встроенные модели-заглушки.

### Команды управления моделями

```bash
# Показать все доступные модели
smart-commit models list

# Принудительно обновить модели из API
smart-commit models refresh

# Очистить кэш моделей (вернуться к встроенным)
smart-commit models clear-cache
```

### Кэширование

- Модели кэшируются на 24 часа в `~/.smart-commit/models-cache.json`
- При отсутствии интернета используются закешированные модели
- При недоступности API используются встроенные модели

### Примеры вывода

```
Available models: 12
★ gpt-3.5-turbo (4096 tokens)
  gpt-4 (8192 tokens)
  gpt-4-turbo (128000 tokens)
  gpt-4o (128000 tokens)
  gpt-4o-mini (128000 tokens)
  ... and 7 more

Loaded from API: 12 models
```

## 🔧 Команды

```bash
smart-commit                    # Стандартный режим
smart-commit --dry-run         # Превью без коммита
smart-commit --generate-only   # Только генерация сообщения
smart-commit -m "message"      # Пользовательское сообщение

# Управление моделями
smart-commit models list       # Список доступных моделей
smart-commit models refresh    # Обновить модели из API
smart-commit models clear-cache # Очистить кэш моделей
smart-commit -v                # Verbose режим

# Конфигурация
smart-commit config --global --set key=value    # Установить глобальную настройку
smart-commit config --global --get key          # Получить настройку
smart-commit config --global --list             # Показать все настройки

# Настройка
smart-commit setup                             # Первоначальная настройка
```

## 🏗️ Архитектура

Проект построен с соблюдением принципов **SOLID**, **DRY**, **KISS**, **YAGNI** и **DDD**:

- **Domain Layer**: Бизнес-логика (сущности, value objects, сервисы)
- **Application Layer**: Оркестрация процессов
- **Infrastructure Layer**: Работа с внешними системами (Git, API, файловая система)
- **Presentation Layer**: CLI интерфейс

## 🤝 Разработка

### Системные требования

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git >= 2.0.0

### Сборка и тестирование

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Запуск тестов
npm test

# Линтинг
npm run lint

# Форматирование кода
npm run format
```

## 📚 API

Проект предоставляет программный API для интеграции:

```typescript
import { Container } from 'smart-commit';

const container = Container.getInstance();
container.initialize();

const workflow = container.workflowOrchestrator;
await workflow.runStandardWorkflow();
```

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🤝 Вклад в проект

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Поддержка

- 📖 [Документация](https://docs.gptunnel.ru)
- 🐛 [Issues](https://github.com/your-username/smart-commit/issues)
- 💬 [Discussions](https://github.com/your-username/smart-commit/discussions)

## 🙏 Благодарности

- [gptunnel.ru](https://gptunnel.ru) за API доступа к ИИ моделям
- [Conventional Commits](https://conventionalcommits.org) за стандарт формата коммитов
- Сообществу разработчиков за вклад в open source
