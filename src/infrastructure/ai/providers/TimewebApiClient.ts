import axios, { AxiosInstance } from 'axios';
import { AiModel, AiModelDescriptor } from '../../../domain/entities/AiModel';
import { ApiCredentials } from '../../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../../domain/services/IAiAssistant';

/**
 * Timeweb AI API client implementation
 * Timeweb provides OpenAI-compatible API for AI agents
 */
export class TimewebApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL: string;
  private apiKey: string | null = null;

  constructor(baseURL?: string) {
    // Базовый URL можно настроить через конфигурацию или использовать дефолтный
    // По документации, базовый URL находится в дашборде агента
    this.baseURL = baseURL ?? 'https://agent.timeweb.cloud';
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public getProviderId(): string {
    return 'timeweb';
  }

  public async generateText(prompt: string, options: AiGenerationOptions = {}): Promise<string> {
    this.ensureApiKey();

    const model = options.model || AiModel.OPENAI_GPT_4O_MINI;
    const estimatedPromptTokens = this.estimateTokens(prompt);
    const remainingTokens = Math.max(model.maxTokens - estimatedPromptTokens, 100);
    const maxTokens = Math.min(options.maxTokens ?? remainingTokens, model.maxTokens);
    const temperature = options.temperature ?? model.temperature;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (options.customInstructions) {
      messages.push({
        role: 'system',
        content: options.customInstructions,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    // Timeweb использует OpenAI-совместимый формат запроса
    // Примечание: модель в запросе может игнорироваться, используется модель из настроек агента
    const requestBody = {
      model: model.name,
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: options.stopSequences,
    };

    try {
      // Timeweb предоставляет OpenAI-совместимый endpoint /v1/chat/completions
      const response = await this.httpClient.post('/v1/chat/completions', requestBody);
      const choice = response.data?.choices?.[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new Error('Некорректный ответ от Timeweb: пустое сообщение');
      }

      return content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Ошибка Timeweb: ${message}`);
      }
      throw error;
    }
  }

  public async validateCredentials(credentials: ApiCredentials): Promise<boolean> {
    try {
      this.setCredentials(credentials);
      // Попытка получить список моделей для валидации
      await this.httpClient.get('/v1/models');
      return true;
    } catch {
      return false;
    }
  }

  public async getAvailableModels(): Promise<readonly AiModel[]> {
    return AiModel.getAvailableModels(this.getProviderId());
  }

  public async fetchModelsFromApi(): Promise<readonly AiModelDescriptor[]> {
    this.ensureApiKey();

    try {
      const response = await this.httpClient.get('/v1/models');
      const models = response.data?.data;

      if (!Array.isArray(models)) {
        throw new Error('Некорректный формат ответа при загрузке моделей Timeweb');
      }

      return models
        .filter((model: any) => typeof model?.id === 'string')
        .map(
          (model: any): AiModelDescriptor => ({
            name: model.id,
            provider: this.getProviderId(),
            maxTokens: this.extractContextWindow(model),
            temperature: 0.7,
            supportsStreaming: Boolean(model?.capabilities?.streaming ?? true),
          })
        );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Не удалось получить список моделей Timeweb: ${message}`);
      }
      throw error;
    }
  }

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public getModelCapabilities(model: AiModel): ModelCapabilities {
    return {
      maxTokens: model.maxTokens,
      supportsStreaming: true,
      supportsFunctions: false, // По документации function calling не поддерживается
      contextWindow: model.maxTokens,
      pricing: {
        inputTokens: 0.01, // Примерные значения, могут отличаться
        outputTokens: 0.03,
      },
    };
  }

  public setCredentials(credentials: ApiCredentials): void {
    this.apiKey = credentials.apiKey;
    // Timeweb использует Bearer токен для аутентификации
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${credentials.apiKey}`;
  }

  public clearCredentials(): void {
    this.apiKey = null;
    delete this.httpClient.defaults.headers.common['Authorization'];
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('API ключ Timeweb не задан. Укажите ключ в конфигурации.');
    }
  }

  private extractContextWindow(model: any): number {
    if (typeof model?.context_window === 'number') {
      return model.context_window;
    }

    if (typeof model?.metadata?.context_length === 'number') {
      return model.metadata.context_length;
    }

    // Разумное значение по умолчанию для Timeweb
    return 128000;
  }
}

