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
    // Формат: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{access_id}/v1
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

  /**
   * Generates text using Timeweb AI API
   * 
   * @param prompt - The prompt text to send to the AI
   * @param options - Generation options (model, temperature, maxTokens, etc.)
   * @returns Generated text response
   * @throws Error if API key is not set or API request fails
   */
  public async generateText(prompt: string, options: AiGenerationOptions = {}): Promise<string> {
    this.ensureApiKey();

    // Use provided model or fallback to default
    const model = options.model || AiModel.OPENAI_GPT_4O_MINI;
    // Calculate token limits and temperature
    const estimatedPromptTokens = this.estimateTokens(prompt);
    const remainingTokens = Math.max(model.maxTokens - estimatedPromptTokens, 100);
    const maxTokens = Math.min(options.maxTokens ?? remainingTokens, model.maxTokens);
    const temperature = options.temperature ?? model.temperature;

    // Build messages array for OpenAI-compatible format
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    // Add system message if custom instructions provided
    if (options.customInstructions) {
      messages.push({
        role: 'system',
        content: options.customInstructions,
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    // Timeweb uses OpenAI-compatible request format
    // Note: model in request may be ignored, agent's configured model is used
    const requestBody = {
      model: model.name,
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: options.stopSequences,
    };

    try {
      // Timeweb предоставляет OpenAI-совместимый endpoint
      // Если baseURL уже содержит /v1, используем /chat/completions
      // Иначе используем полный путь /v1/chat/completions
      const endpoint = this.baseURL.includes('/v1') ? '/chat/completions' : '/v1/chat/completions';
      const response = await this.httpClient.post(endpoint, requestBody);
      const choice = response.data?.choices?.[0];
      const content = choice?.message?.content;

      // Validate response
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

  /**
   * Validates API credentials
   * 
   * Since Timeweb doesn't have a /models endpoint, we validate
   * by making a small test request to chat/completions endpoint.
   */
  public async validateCredentials(credentials: ApiCredentials): Promise<boolean> {
    try {
      this.setCredentials(credentials);
      // Timeweb doesn't have /models endpoint, so we can't validate this way
      // Just check if API key is set
      return this.apiKey !== null && this.apiKey.length > 0;
    } catch {
      return false;
    }
  }

  public async getAvailableModels(): Promise<readonly AiModel[]> {
    return AiModel.getAvailableModels(this.getProviderId());
  }

  /**
   * Fetch models from API
   * 
   * Note: Timeweb API does not provide a models list endpoint.
   * This method returns an empty array to indicate that models
   * should be taken from predefined list (getAvailableModels).
   * 
   * @returns Empty array (Timeweb doesn't support model listing)
   */
  public async fetchModelsFromApi(): Promise<readonly AiModelDescriptor[]> {
    // Timeweb API does not provide a /models endpoint
    // Return empty array to use predefined models from getAvailableModels()
    return [];
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

}

