import axios, { AxiosInstance } from 'axios';
import { AiModel, AiModelDescriptor } from '../../../domain/entities/AiModel';
import { ApiCredentials } from '../../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../../domain/services/IAiAssistant';

/**
 * Timeweb AI API client implementation
 * 
 * Timeweb provides OpenAI-compatible API for AI agents.
 * 
 * IMPORTANT: In Timeweb, the model is selected when creating the agent,
 * not in each API request. The model parameter in requests is ignored.
 * Each agent has a pre-configured model that cannot be changed per request.
 * 
 * @see https://agent.timeweb.cloud/docs
 */
export class TimewebApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL: string;
  private apiKey: string | null = null;

  constructor(baseURL?: string) {
    // Базовый URL можно настроить через конфигурацию или использовать дефолтный
    // По документации, базовый URL находится в дашборде агента
    // Формат: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{access_id}/v1
    // Этот URL уже является полным baseURL для агента, к нему просто добавляется /chat/completions
    this.baseURL = baseURL ?? 'https://agent.timeweb.cloud';
    
    // Убедимся, что baseURL не заканчивается на /
    if (this.baseURL.endsWith('/')) {
      this.baseURL = this.baseURL.slice(0, -1);
    }
    
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
    // IMPORTANT: Model is configured in the agent settings, not in the request
    // The model parameter in request is ignored - agent uses its pre-configured model
    // We still include it for compatibility, but it won't affect which model is used
    const requestBody = {
      model: model.name, // Included for compatibility, but ignored by Timeweb API
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: options.stopSequences,
    };

    // Timeweb agent endpoint structure (based on PHP implementation):
    // baseURL: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agent_id}/v1
    // endpoint: /chat/completions
    // Full URL: baseURL + /chat/completions
    // Example: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agent_id}/v1/chat/completions
    const endpoint = '/chat/completions';
    
    try {
      // Log for debugging
      if (process.env['DEBUG']) {
        console.log('Timeweb API Request:', {
          baseURL: this.baseURL,
          endpoint,
          fullURL: `${this.baseURL}${endpoint}`,
          hasApiKey: !!this.apiKey,
        });
      }
      
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
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        const requestUrl = error.config?.url;
        const baseURL = error.config?.baseURL;
        
        // Enhanced error message with debugging info
        let errorMessage = `Ошибка Timeweb API`;
        if (status) {
          errorMessage += ` (${status} ${statusText || ''})`;
        }
        if (responseData?.error?.message) {
          errorMessage += `: ${responseData.error.message}`;
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        // Add detailed debugging info
        const fullUrl = baseURL && requestUrl ? `${baseURL}${requestUrl}` : 'unknown';
        errorMessage += `\nURL: ${fullUrl}`;
        errorMessage += `\nBaseURL: ${this.baseURL}`;
        errorMessage += `\nEndpoint: ${endpoint}`;
        if (responseData) {
          errorMessage += `\nResponse: ${JSON.stringify(responseData).substring(0, 200)}`;
        }
        
        // Log to console for debugging
        console.error('Timeweb API Error Details:', {
          status,
          statusText,
          baseURL: this.baseURL,
          endpoint,
          fullUrl,
          hasApiKey: !!this.apiKey,
          apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 20)}...` : 'none',
          responseData,
        });
        
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Validates API credentials
   * 
   * Since Timeweb doesn't have a /models endpoint and model is configured
   * in agent settings, we can only validate that the API key is present.
   * A real validation would require making a test request to the agent.
   */
  public async validateCredentials(credentials: ApiCredentials): Promise<boolean> {
    try {
      this.setCredentials(credentials);
      // Timeweb doesn't have /models endpoint for validation
      // Just check if API key is set (format validation)
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
   * Timeweb doesn't provide a models list endpoint because:
   * - Models are selected when creating an agent, not per request
   * - Each agent has a pre-configured model that cannot be changed
   * - The model is part of agent configuration, not API request
   * 
   * This method returns an empty array to indicate that models
   * should be taken from predefined list (getAvailableModels).
   * 
   * @returns Empty array (Timeweb doesn't support model listing via API)
   */
  public async fetchModelsFromApi(): Promise<readonly AiModelDescriptor[]> {
    // Timeweb API does not provide a /models endpoint
    // Models are configured in agent settings, not via API
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

