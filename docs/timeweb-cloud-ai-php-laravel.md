# Timeweb Cloud AI: использование с PHP и Laravel

Документация по интеграции **Timeweb Cloud AI** в приложения на PHP и Laravel. API совместим с форматом OpenAI (chat completions), поэтому можно использовать те же структуры запросов и ответов.

> Примеры и форматы API взяты из реализации в проекте Smart Commit ([`TimewebApiClient.ts`](../src/infrastructure/ai/providers/TimewebApiClient.ts)).

---

## 1. Подготовка

### 1.1 Получение доступа

1. Войдите в [Timeweb Cloud Console](https://console.timeweb.cloud).
2. Перейдите в раздел **AI / Cloud AI** (агенты).
3. Создайте агента или откройте существующего.
4. Скопируйте:
   - **API-ключ** (формат обычно `tw-...`);
   - **URL агента** — полный base URL для запросов.

### 1.2 URL агента

Формат base URL из панели Timeweb:

```
https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{AGENT_ID}/v1
```

- `{AGENT_ID}` — идентификатор (access_id) вашего агента.
- К этому URL добавляется endpoint: `/chat/completions`.

Полный URL для чат-запросов:

```
https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{AGENT_ID}/v1/chat/completions
```

### 1.3 Важные ограничения

- **Модель** выбирается при создании агента в панели Timeweb; в запросе поле `model` может передаваться для совместимости, но **игнорируется**.
- Лимит на ответ: до **8190 токенов** на один ответ.
- Аутентификация: заголовок **Bearer** с API-ключом.

---

## 2. Формат API (OpenAI-совместимый)

### 2.1 Запрос POST /chat/completions

| Параметр       | Тип   | Описание |
|----------------|-------|----------|
| `model`        | string| Игнорируется Timeweb (модель задана в агенте), можно передать для совместимости |
| `messages`     | array | Массив объектов `{ "role": "system"|"user"|"assistant", "content": "..." }` |
| `temperature`  | float | 0–2, опционально (например 0.7) |
| `max_tokens`   | int   | Макс. токенов в ответе (до 8190) |
| `stop`         | array | Опционально, последовательности остановки |

Пример тела запроса (как в проекте):

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "Ты помощник." },
    { "role": "user", "content": "Напиши короткое приветствие." }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 2.2 Ответ

Структура как у OpenAI Chat Completions:

- `choices` — массив; обычно берётся `choices[0]`;
- `choices[0].message.content` — текст ответа;
- `choices[0].finish_reason` — причина завершения (`stop`, `length` и т.д.);
- `usage` — опционально (токены входа/выхода).

---

## 3. Примеры на PHP

### 3.1 Чистый PHP (cURL)

```php
<?php

function timewebChat(string $apiKey, string $baseUrl, array $messages, float $temperature = 0.7, int $maxTokens = 2000): string
{
    $url = rtrim($baseUrl, '/') . '/chat/completions';

    $body = [
        'model'       => 'gpt-4o-mini',
        'messages'    => $messages,
        'temperature' => $temperature,
        'max_tokens'  => $maxTokens,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new RuntimeException('Timeweb API request failed');
    }

    $data = json_decode($response, true);
    if ($httpCode >= 400) {
        $message = $data['error']['message'] ?? $data['message'] ?? $response;
        throw new RuntimeException('Timeweb API error: ' . $message, $httpCode);
    }

    if (empty($data['choices'][0]['message']['content'])) {
        throw new RuntimeException('Empty or invalid Timeweb API response');
    }

    return trim($data['choices'][0]['message']['content']);
}

// Использование
$apiKey  = 'tw-...';
$baseUrl = 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/YOUR_AGENT_ID/v1';

$messages = [
    ['role' => 'user', 'content' => 'Привет! Кратко представься.'],
];

echo timewebChat($apiKey, $baseUrl, $messages);
```

### 3.2 PHP с Guzzle

```php
<?php

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

function timewebChatGuzzle(string $apiKey, string $baseUrl, array $messages, float $temperature = 0.7, int $maxTokens = 2000): string
{
    $client = new Client([
        'base_uri' => rtrim($baseUrl, '/') . '/',
        'timeout'  => 30,
        'headers'  => [
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $apiKey,
        ],
    ]);

    $response = $client->post('chat/completions', [
        'json' => [
            'model'       => 'gpt-4o-mini',
            'messages'    => $messages,
            'temperature' => $temperature,
            'max_tokens'  => $maxTokens,
        ],
    ]);

    $data = json_decode($response->getBody()->getContents(), true);
    if (empty($data['choices'][0]['message']['content'])) {
        throw new RuntimeException('Empty or invalid Timeweb API response');
    }

    return trim($data['choices'][0]['message']['content']);
}
```

---

## 4. Примеры для Laravel

### 4.1 Конфигурация

В `.env`:

```env
TIMEWEB_AI_API_KEY=tw-...
TIMEWEB_AI_BASE_URL=https://agent.timeweb.cloud/api/v1/cloud-ai/agents/YOUR_AGENT_ID/v1
```

В `config/services.php` (или отдельный `config/timeweb-ai.php`):

```php
return [
    'timeweb_ai' => [
        'api_key'  => env('TIMEWEB_AI_API_KEY'),
        'base_url' => env('TIMEWEB_AI_BASE_URL'),
    ],
];
```

### 4.2 Сервис-обёртка

`app/Services/TimewebAiService.php`:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class TimewebAiService
{
    public function __construct(
        protected string $apiKey,
        protected string $baseUrl
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    /**
     * Отправка сообщений в Timeweb Cloud AI (OpenAI-совместимый chat completions).
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function chat(
        array $messages,
        float $temperature = 0.7,
        int $maxTokens = 2000,
        ?array $stop = null
    ): string {
        $payload = [
            'model'       => 'gpt-4o-mini',
            'messages'    => $messages,
            'temperature' => $temperature,
            'max_tokens'  => min($maxTokens, 8190),
        ];

        if ($stop !== null) {
            $payload['stop'] = $stop;
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(30)
            ->post($this->baseUrl . '/chat/completions', $payload);

        if ($response->failed()) {
            $message = $response->json('error.message') ?? $response->json('message') ?? $response->body();
            throw new RequestException($response, "Timeweb AI error: {$message}");
        }

        $content = $response->json('choices.0.message.content');
        if (empty($content)) {
            throw new \RuntimeException('Timeweb AI returned empty or invalid response');
        }

        return trim($content);
    }

    /**
     * Удобный вызов с одним пользовательским сообщением и опциональным system-сообщением.
     */
    public function ask(string $userMessage, ?string $systemMessage = null, float $temperature = 0.7, int $maxTokens = 2000): string
    {
        $messages = [];
        if ($systemMessage !== null) {
            $messages[] = ['role' => 'system', 'content' => $systemMessage];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        return $this->chat($messages, $temperature, $maxTokens);
    }
}
```

### 4.3 Регистрация в Laravel

В `app/Providers/AppServiceProvider.php` (или отдельном сервис-провайдере):

```php
use App\Services\TimewebAiService;

public function register(): void
{
    $this->app->singleton(TimewebAiService::class, function ($app) {
        $config = config('services.timeweb_ai', config('timeweb_ai', []));
        return new TimewebAiService(
            $config['api_key'] ?? '',
            $config['base_url'] ?? ''
        );
    });
}
```

### 4.4 Использование в контроллере

```php
<?php

namespace App\Http\Controllers;

use App\Services\TimewebAiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(
        protected TimewebAiService $timewebAi
    ) {}

    public function ask(Request $request)
    {
        $request->validate(['message' => 'required|string|max:10000']);

        $answer = $this->timewebAi->ask(
            $request->input('message'),
            'Ты вежливый помощник. Отвечай кратко.',
            0.7,
            2000
        );

        return response()->json(['answer' => $answer]);
    }
}
```

### 4.5 Использование в Artisan-команде

```php
<?php

namespace App\Console\Commands;

use App\Services\TimewebAiService;
use Illuminate\Console\Command;

class AiAskCommand extends Command
{
    protected $signature = 'ai:ask {message : Текст вопроса}';

    public function handle(TimewebAiService $timewebAi): int
    {
        $message = $this->argument('message');
        $answer  = $timewebAi->ask($message);

        $this->line($answer);
        return self::SUCCESS;
    }
}
```

### 4.6 Многошаговый диалог (история сообщений)

Как в проекте Smart Commit: передаётся массив `messages` с ролями `system`, `user`, `assistant`.

```php
$messages = [
    ['role' => 'system', 'content' => 'Ты помощник по коду.'],
    ['role' => 'user', 'content' => 'Что такое REST?'],
    ['role' => 'assistant', 'content' => 'REST — архитектурный стиль для API...'],
    ['role' => 'user', 'content' => 'Дай пример на PHP.'],
];

$nextAnswer = $timewebAi->chat($messages, 0.7, 2000);
```

---

## 5. Оценка токенов и лимиты

В проекте Smart Commit токены оцениваются приблизительно как `ceil(strlen($text) / 4)`. Лимит ответа Timeweb — **8190 токенов**. Имеет смысл ограничивать `max_tokens` и размер входящего текста, чтобы не получать обрезку по `finish_reason: length`.

Пример проверки в Laravel:

```php
// Грубая оценка токенов (как в TimewebApiClient)
$estimatedTokens = (int) ceil(strlen($prompt) / 4);
$maxTokens = min(8190 - $estimatedTokens, 8190);
$maxTokens = max(1000, $maxTokens);
```

---

## 6. Ссылки и конфиг в Smart Commit

В этом же репозитории Timeweb используется так:

- Конфиг: `apiKeys.timeweb`, `baseUrls.timeweb`, `defaultProvider=timeweb`.
- Пример из README:
  - `smart-commit config --global --set apiKeys.timeweb=tw-...`
  - `smart-commit config --global --set baseUrls.timeweb=https://agent.timeweb.cloud/api/v1/cloud-ai/agents/YOUR_AGENT_ID/v1`
  - `smart-commit config --global --set defaultProvider=timeweb`

Подробнее: [README](../README.md), [Конфигурация](configuration.md), [Примеры](examples.md).

---

## 7. Официальная документация

- Документация по агентам: [https://agent.timeweb.cloud/docs](https://agent.timeweb.cloud/docs)
- Timeweb Cloud: [https://timeweb.cloud](https://timeweb.cloud) / [API docs](https://timeweb.cloud/api-docs)
