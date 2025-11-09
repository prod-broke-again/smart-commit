import axios, { AxiosInstance } from 'axios';
import { AiModel, AiModelDescriptor } from '../../../domain/entities/AiModel';
import { ApiCredentials } from '../../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../../domain/services/IAiAssistant';

/**
 * Google Gemini API client implementation
 */
export class GeminiApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL: string;
  private apiKey: string | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public getProviderId(): string {
    return 'gemini';
  }

  public async generateText(prompt: string, options: AiGenerationOptions = {}): Promise<string> {
    this.ensureApiKey();

    const model = options.model || AiModel.GEMINI_1_5_FLASH;
    const estimatedTokens = this.estimateTokens(prompt);
    const remainingTokens = Math.max(model.maxTokens - estimatedTokens, 100);
    const maxTokens = Math.min(options.maxTokens ?? remainingTokens, model.maxTokens);
    const temperature = options.temperature ?? model.temperature;

    const requestBody: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        stopSequences: options.stopSequences,
      },
    };

    if (options.customInstructions) {
      requestBody['systemInstruction'] = {
        parts: [{ text: options.customInstructions }],
      };
    }

    try {
      const endpoint = `/models/${model.name}:generateContent`;
      const response = await this.httpClient.post(`${endpoint}?key=${this.apiKey}`, requestBody);
      const candidates = response.data?.candidates;

      if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error('Некорректный ответ от Gemini: отсутствуют варианты ответа');
      }

      const firstCandidate = candidates[0];
      const parts = firstCandidate?.content?.parts;

      if (!Array.isArray(parts) || parts.length === 0) {
        throw new Error('Gemini вернул ответ без текстовых частей');
      }

      const textPart = parts.find((part: any) => typeof part?.text === 'string');
      const text = textPart?.text;

      if (!text) {
        throw new Error('Gemini вернул ответ без текста');
      }

      return text.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Ошибка Gemini: ${message}`);
      }
      throw error;
    }
  }

  public async validateCredentials(credentials: ApiCredentials): Promise<boolean> {
    try {
      this.setCredentials(credentials);
      await this.httpClient.get(`/models?key=${this.apiKey}`);
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
      const response = await this.httpClient.get(`/models?key=${this.apiKey}`);
      const models = response.data?.models;

      if (!Array.isArray(models)) {
        throw new Error('Некорректный формат ответа при загрузке моделей Gemini');
      }

      return models
        .filter((model: any) => typeof model?.name === 'string')
        .map(
          (model: any): AiModelDescriptor => ({
            name: model.name.replace('models/', ''),
            provider: this.getProviderId(),
            maxTokens: this.extractContextWindow(model),
            temperature: 0.7,
            supportsStreaming: Boolean(model?.supportedGenerationMethods?.includes('STREAM')),
          })
        );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Не удалось получить список моделей Gemini: ${message}`);
      }
      throw error;
    }
  }

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 3);
  }

  public getModelCapabilities(model: AiModel): ModelCapabilities {
    return {
      maxTokens: model.maxTokens,
      supportsStreaming: true,
      supportsFunctions: true,
      contextWindow: model.maxTokens,
      pricing: {
        inputTokens: 0.00075,
        outputTokens: 0.00075,
      },
    };
  }

  public setCredentials(credentials: ApiCredentials): void {
    this.apiKey = credentials.apiKey;
  }

  public clearCredentials(): void {
    this.apiKey = null;
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error('API ключ Gemini не задан. Укажите ключ в конфигурации.');
    }
  }

  private extractContextWindow(model: any): number {
    if (typeof model?.inputTokenLimit === 'number') {
      return model.inputTokenLimit;
    }

    if (typeof model?.outputTokenLimit === 'number') {
      return model.outputTokenLimit;
    }

    return 1_048_576;
  }
}

