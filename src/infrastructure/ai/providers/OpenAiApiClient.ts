import axios, { AxiosInstance } from 'axios';
import { AiModel, AiModelDescriptor } from '../../../domain/entities/AiModel';
import { ApiCredentials } from '../../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../../domain/services/IAiAssistant';

/**
 * OpenAI API client implementation
 */
export class OpenAiApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL: string;
  private apiKey: string | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL ?? 'https://api.openai.com/v1';
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public getProviderId(): string {
    return 'openai';
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

    const requestBody = {
      model: model.name,
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: options.stopSequences,
    };

    try {
      const response = await this.httpClient.post('/chat/completions', requestBody);
      const choice = response.data?.choices?.[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new Error('Некорректный ответ от OpenAI: пустое сообщение');
      }

      return content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Ошибка OpenAI: ${message}`);
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
        throw new Error('Некорректный формат ответа при загрузке моделей OpenAI');
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
        throw new Error(`Не удалось получить список моделей OpenAI: ${message}`);
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
      supportsFunctions: true,
      contextWindow: model.maxTokens,
      pricing: {
        inputTokens: 0.01,
        outputTokens: 0.03,
      },
    };
  }

  public setCredentials(credentials: ApiCredentials): void {
    this.apiKey = credentials.apiKey;
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${credentials.apiKey}`;
  }

  public clearCredentials(): void {
    this.apiKey = null;
    delete this.httpClient.defaults.headers.common['Authorization'];
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('API ключ OpenAI не задан. Укажите ключ в конфигурации.');
    }
  }

  private extractContextWindow(model: any): number {
    if (typeof model?.context_window === 'number') {
      return model.context_window;
    }

    if (typeof model?.metadata?.context_length === 'number') {
      return model.metadata.context_length;
    }

    // Разумное значение по умолчанию
    return 128000;
  }
}

