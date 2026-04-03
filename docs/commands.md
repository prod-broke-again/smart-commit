# Основные команды

## 🚀 Генерация коммитов

### Стандартная генерация

```bash
smart-commit
```

Автоматически:
- Анализирует изменения в репозитории
- Генерирует осмысленное сообщение коммита
- Создает коммит и пушит в репозиторий

### Опции генерации

```bash
# Только показать что будет закоммичено (dry run)
smart-commit --dry-run

# Только сгенерировать сообщение без коммита
smart-commit --generate-only

# Использовать кастомное сообщение
smart-commit -m "fix: исправлена ошибка в API"

# Подробный вывод
smart-commit --verbose

# Принудительный коммит (игнорировать валидацию)
smart-commit --force
```

## 🔧 Управление конфигурацией

### Просмотр конфигурации

```bash
# Показать все настройки
smart-commit config --list

# Показать конкретную настройку
smart-commit config --get language
```

### Изменение конфигурации

```bash
# Установить значение
smart-commit config --set language=ru

# Установить ключи для разных провайдеров (новый способ - рекомендуется)
smart-commit config --global --set apiKeys.openai=sk-...
smart-commit config --global --set apiKeys.timeweb=tw-...
smart-commit config --global --set apiKeys.anthropic=sk-ant-...

# Установить глобально (старый способ - устарел)
smart-commit config --global --set apiKey=ваш_ключ

# Установить проект-специфичные настройки
smart-commit config --set apiKey=project-key
smart-commit config --set defaultProvider=timeweb
smart-commit config --set defaultModel=gpt-4o-mini
```

### Доступные настройки

| Параметр | Описание | Возможные значения |
|----------|----------|-------------------|
| `apiKey` | ⚠️ Устарел - API ключ (для обратной совместимости) | Строка |
| `apiKeys` | ✅ Рекомендуется - API ключи для провайдеров | Объект `{ "provider": "key" }` |
| `defaultProvider` | Провайдер ИИ | `gptunnel`, `openai`, `anthropic`, `claude`, `gemini`, `google`, `timeweb` |
| `defaultModel` | Модель ИИ | Зависит от провайдера |
| `language` | Язык коммитов | `ru`, `en` |
| `maxCommitLength` | Максимальная длина коммита | `50-100` |
| `includeScope` | Включать scope | `true`, `false` |
| `analysisMode` | Режим анализа | `lite`, `full` |
| `customInstructions` | Кастомные инструкции | Любой текст |

## 🤖 Управление моделями ИИ

### Просмотр моделей

```bash
# Показать первые 15 моделей
smart-commit models list

# Показать все модели
smart-commit models list --all
```

### Обновление моделей

```bash
# Обновить список моделей с API
smart-commit models refresh

# Очистить кэш моделей
smart-commit models clear-cache
```

## 📁 Управление проектами

### Генерация конфигурации проекта

```bash
smart-commit generate-config
```

Создает файл `.smart-commit.json` с настройками для текущего проекта.

### Первоначальная настройка

```bash
smart-commit setup
```

Интерактивная настройка всех параметров.

## 🚀 Команды деплоя

### Умный деплой

```bash
smart-commit deploy-smart
```

Анализирует изменения и выполняет только необходимые команды. Сначала выполняются `localCommands` (если заданы), затем команды по SSH; при ошибке — остановка (fail-fast). Подробнее: [Умный деплой](smart-deploy.md).

### Полный деплой

```bash
smart-commit deploy
```

Выполняет все команды из конфигурации (локально при необходимости, затем по SSH). См. [Обычный деплой](deploy.md).

## 📊 Примеры использования

### Базовый workflow

```bash
# 1. Добавить изменения
git add .

# 2. Сгенерировать и создать коммит
smart-commit

# 3. Умный деплой
smart-commit deploy-smart
```

### Работа с ветками

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

### Отладка

```bash
# Посмотреть что будет закоммичено
smart-commit --dry-run --verbose

# Только сгенерировать сообщение
smart-commit --generate-only

# Проверить конфигурацию
smart-commit config --list
```

## 🔗 Git Hooks

### Установка hooks

```bash
# Установить commit-msg hook для автоматической валидации
smart-commit install-hooks
```

После установки каждый `git commit` будет автоматически:
- Валидировать формат сообщения коммита
- Улучшать сообщение через AI при необходимости
- Предотвращать коммиты, не соответствующие conventional commits

### Удаление hooks

```bash
# Удалить Git hooks
smart-commit uninstall-hooks
```

### Как это работает

Когда вы выполняете `git commit -m "fix bug"`, hook будет:
1. Валидировать формат сообщения
2. Если невалидно, попытаться улучшить через AI
3. Заменить сообщение на улучшенную версию
4. Если улучшение не удалось, показать ошибки и предотвратить коммит

Можно пропустить hooks с помощью `git commit --no-verify` при необходимости.

## 🔗 Полезные ссылки

- [Установка и настройка](setup.md)
- [Умный деплой](smart-deploy.md)
- [Обычный деплой](deploy.md)
- [Конфигурация](configuration.md)
- [Примеры использования](examples.md)
