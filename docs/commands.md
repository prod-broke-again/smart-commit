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

# Установить глобально
smart-commit config --global --set apiKey=ваш_ключ
```

### Доступные настройки

| Параметр | Описание | Возможные значения |
|----------|----------|-------------------|
| `language` | Язык коммитов | `ru`, `en` |
| `aiModel` | Модель ИИ | `gpt-4`, `gpt-3.5-turbo` |
| `maxCommitLength` | Максимальная длина коммита | `50-100` |
| `includeScope` | Включать scope | `true`, `false` |
| `analysisMode` | Режим анализа | `basic`, `full` |
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

Анализирует изменения и выполняет только необходимые команды.

### Полный деплой

```bash
smart-commit deploy
```

Выполняет все команды из конфигурации.

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

## 🔗 Полезные ссылки

- [Установка и настройка](setup.md)
- [Умный деплой](smart-deploy.md)
- [Обычный деплой](deploy.md)
- [Конфигурация](configuration.md)
- [Примеры использования](examples.md)
