import axios, { AxiosInstance } from 'axios';
import { AiModel, AiModelDescriptor } from '../../../domain/entities/AiModel';
import { ApiCredentials } from '../../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../../domain/services/IAiAssistant';

/**
 * Anthropic Claude API client implementation
 */
export class AnthropicApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL: string;
  private apiKey: string | null = null;
  private readonly apiVersion: string;

  constructor(baseURL?: string, apiVersion?: string) {
    this.baseURL = baseURL ?? 'https://api.anthropic.com/v1';
    this.apiVersion = apiVersion ?? '2023-06-01';

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': this.apiVersion,
      },
    });
  }

  public getProviderId(): string {
    return 'anthropic';
  }

  public async generateText(prompt: string, options: AiGenerationOptions = {}): Promise<string> {
    this.ensureApiKey();

    const model = options.model || AiModel.CLAUDE_3_SONNET;
    const estimatedTokens = this.estimateTokens(prompt);
    const remainingTokens = Math.max(model.maxTokens - estimatedTokens, 100);
    const maxTokens = Math.min(options.maxTokens ?? remainingTokens, model.maxTokens);
    const temperature = options.temperature ?? model.temperature;

    const requestBody = {
      model: model.name,
      max_tokens: maxTokens,
      temperature,
      system: options.customInstructions ?? undefined,
      stop_sequences: options.stopSequences,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    try {
      const response = await this.httpClient.post('/messages', requestBody);
      const content = response.data?.content;

      if (!Array.isArray(content) || content.length === 0) {
        throw new Error('Некорректный ответ от Anthropic: пустое содержимое');
      }

      const textBlock = content.find((item: any) => item?.type === 'text');
      const text = typeof textBlock?.text === 'string' ? textBlock.text : null;

      if (!text) {
        throw new Error('Anthropic вернул ответ без текстового блока');
      }

      return text.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Ошибка Anthropic: ${message}`);
      }
      throw error;
    }
  }

  public async validateCredentials(credentials: ApiCredentials): Promise<boolean> {
    try {
      this.setCredentials(credentials);
      await this.httpClient.get('/models');
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
      const response = await this.httpClient.get('/models');
      const models = response.data?.data;

      if (!Array.isArray(models)) {
        throw new Error('Некорректный формат ответа при загрузке моделей Anthropic');
      }

      return models
        .filter((model: any) => typeof model?.id === 'string')
        .map(
          (model: any): AiModelDescriptor => ({
            name: model.id,
            provider: this.getProviderId(),
            maxTokens: this.extractContextWindow(model),
            temperature: 0.6,
            supportsStreaming: Boolean(model?.capabilities?.streaming ?? true),
          })
        );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Не удалось получить список моделей Anthropic: ${message}`);
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
      supportsFunctions: false,
      contextWindow: model.maxTokens,
      pricing: {
        inputTokens: 0.008,
        outputTokens: 0.024,
      },
    };
  }

  public setCredentials(credentials: ApiCredentials): void {
    this.apiKey = credentials.apiKey;
    this.httpClient.defaults.headers.common['x-api-key'] = credentials.apiKey;
  }

  public clearCredentials(): void {
    this.apiKey = null;
    delete this.httpClient.defaults.headers.common['x-api-key'];
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('API ключ Anthropic не задан. Укажите ключ в конфигурации.');
    }
  }

  private extractContextWindow(model: any): number {
    if (typeof model?.context_window === 'number') {
      return model.context_window;
    }

    if (typeof model?.max_context_tokens === 'number') {
      return model.max_context_tokens;
    }

    return 200000;
  }
}

