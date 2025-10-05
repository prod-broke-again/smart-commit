# Установка и настройка

## 📦 Установка

### Глобальная установка (рекомендуется)

```bash
npm install -g smart-commit-ai
```

### Локальная установка

```bash
npm install smart-commit-ai
npx smart-commit
```

## 🔧 Первоначальная настройка

После установки выполните команду настройки:

```bash
smart-commit setup
```

Эта команда поможет вам:
- Настроить API ключи для ИИ
- Выбрать провайдера ИИ (GPTunnel, OpenAI)
- Настроить язык по умолчанию
- Выбрать модель ИИ

## 🔑 Настройка API ключей

### GPTunnel (рекомендуется)

1. Зарегистрируйтесь на [GPTunnel](https://gptunnel.com)
2. Получите API ключ
3. Выполните: `smart-commit config --set apiKey=ваш_ключ`

### OpenAI

1. Получите API ключ на [OpenAI](https://platform.openai.com)
2. Выполните: `smart-commit config --set apiKey=ваш_ключ`

## 🌍 Настройка языка

```bash
# Русский язык
smart-commit config --set language=ru

# Английский язык
smart-commit config --set language=en
```

## 🤖 Настройка модели ИИ

Посмотрите доступные модели:

```bash
smart-commit models list
```

Установите модель по умолчанию:

```bash
smart-commit config --set defaultModel=gpt-4
```

## 📁 Настройка проекта

Для каждого проекта создайте конфигурацию:

```bash
smart-commit generate-config
```

Эта команда:
- Проанализирует структуру проекта
- Определит тип проекта (PHP/Laravel, Node.js, etc.)
- Создаст файл `.smart-commit.json` с настройками

## ⚙️ Глобальная конфигурация

Посмотрите текущие настройки:

```bash
smart-commit config --list
```

Измените настройки:

```bash
smart-commit config --set key=value
```

## 🔄 Обновление

```bash
npm update -g smart-commit-ai
```

## 🗑️ Удаление

```bash
npm uninstall -g smart-commit-ai
```

## 🆘 Решение проблем

### Ошибка "API key not found"

```bash
smart-commit config --set apiKey=ваш_ключ
```

### Ошибка "Configuration file not found"

```bash
smart-commit generate-config
```

### Ошибка "Not a git repository"

Убедитесь, что вы находитесь в папке с Git репозиторием.

### Ошибка "No changes to commit"

```bash
git add .
smart-commit
```

## 📝 Примеры конфигурации

### Минимальная конфигурация

```json
{
  "language": "ru",
  "aiModel": "gpt-4",
  "maxCommitLength": 72
}
```

### Полная конфигурация

```json
{
  "language": "ru",
  "aiModel": "gpt-4",
  "maxCommitLength": 72,
  "includeScope": true,
  "analysisMode": "full",
  "customInstructions": "Используй conventional commits формат"
}
```

## 🔗 Полезные ссылки

- [Основные команды](commands.md)
- [Конфигурация](configuration.md)
- [Примеры использования](examples.md)
