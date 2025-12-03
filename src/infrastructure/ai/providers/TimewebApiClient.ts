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
    // Ensure we have enough tokens for response
    // Timeweb has a limit of 8190 tokens for response generation
    const remainingTokens = Math.max(model.maxTokens - estimatedPromptTokens, 500);
    const maxTokens = options.maxTokens ?? Math.min(remainingTokens, 8190); // Timeweb limit: 8190 tokens
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

    // Timeweb agent endpoint structure:
    // baseURL: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agent_id}/v1
    // endpoint: /chat/completions
    // Full URL: baseURL + /chat/completions
    // Example: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agent_id}/v1/chat/completions
    const endpoint = '/chat/completions';
    
    try {
      // Log request details for debugging
      const promptLength = prompt.length;
      const estimatedTokens = this.estimateTokens(prompt);
      console.log('Timeweb API Request:', {
        baseURL: this.baseURL,
        endpoint,
        fullURL: `${this.baseURL}${endpoint}`,
        promptLength,
        estimatedTokens,
        maxTokens,
        temperature,
        messagesCount: messages.length,
      });
      
      const response = await this.httpClient.post(endpoint, requestBody);
      
      // Log response details
      console.log('Timeweb API Response:', {
        status: response.status,
        hasData: !!response.data,
        hasChoices: !!response.data?.choices,
        choicesCount: response.data?.choices?.length ?? 0,
      });
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Timeweb API вернул пустой ответ (нет поля data)');
      }
      
      if (!response.data.choices || !Array.isArray(response.data.choices)) {
        throw new Error(`Некорректная структура ответа Timeweb: отсутствует массив choices. Ответ: ${JSON.stringify(response.data).substring(0, 500)}`);
      }
      
      if (response.data.choices.length === 0) {
        throw new Error(`Timeweb API вернул пустой массив choices. Ответ: ${JSON.stringify(response.data).substring(0, 500)}`);
      }
      
      const choice = response.data.choices[0];
      
      if (!choice) {
        throw new Error('Timeweb API вернул undefined в качестве первого choice');
      }
      
      const content = choice?.message?.content;

      // Validate response
      if (!content || (typeof content === 'string' && content.trim().length === 0)) {
        const finishReason = choice?.finish_reason;
        const usage = response.data?.usage;
        const responseDataStr = JSON.stringify(response.data, null, 2);
        
        // Always log detailed error info when there's an issue
        console.error('Timeweb API Error Details:');
        console.error('  - finish_reason:', finishReason || 'не указан');
        console.error('  - usage:', usage || 'не указан');
        console.error('  - maxTokens в запросе:', maxTokens);
        console.error('  - Полный ответ API:', responseDataStr);
        console.error('  - choice объект:', JSON.stringify(choice, null, 2));
        
        // Provide more specific error message
        if (finishReason === 'length') {
          throw new Error(`Ответ от Timeweb был обрезан из-за лимита токенов. Увеличьте maxTokens (текущий: ${maxTokens}, использовано: ${usage?.completion_tokens ?? 0}, лимит: 8190)`);
        } else if (finishReason) {
          throw new Error(`Некорректный ответ от Timeweb: пустое сообщение (finish_reason: ${finishReason}). Полный ответ: ${responseDataStr.substring(0, 500)}`);
        } else {
          throw new Error(`Некорректный ответ от Timeweb: пустое сообщение. Полный ответ: ${responseDataStr.substring(0, 500)}`);
        }
      }

      return content.trim();
    } catch (error) {
      // Log all errors with full details
      console.error('Timeweb API Exception:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        const requestUrl = error.config?.url;
        const baseURL = error.config?.baseURL;
        
        // Log detailed error info
        console.error('Timeweb API Axios Error Details:');
        console.error('  - Status:', status || 'нет статуса');
        console.error('  - Status Text:', statusText || 'нет');
        console.error('  - Request URL:', requestUrl || 'неизвестно');
        console.error('  - Base URL:', baseURL || this.baseURL || 'неизвестно');
        console.error('  - Endpoint:', endpoint);
        console.error('  - Full URL:', baseURL && requestUrl ? `${baseURL}${requestUrl}` : `${this.baseURL}${endpoint}`);
        console.error('  - Response Data:', responseData ? JSON.stringify(responseData, null, 2) : 'нет данных');
        console.error('  - Request Body:', JSON.stringify(requestBody, null, 2).substring(0, 1000));
        
        // Enhanced error message with debugging info
        let errorMessage = `Ошибка Timeweb API`;
        if (status) {
          errorMessage += ` (${status} ${statusText || ''})`;
        }
        if (responseData?.error?.message) {
          errorMessage += `: ${responseData.error.message}`;
        } else if (responseData?.message) {
          errorMessage += `: ${responseData.message}`;
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        // Add detailed debugging info
        const fullUrl = baseURL && requestUrl ? `${baseURL}${requestUrl}` : `${this.baseURL}${endpoint}`;
        errorMessage += `\nURL: ${fullUrl}`;
        errorMessage += `\nBaseURL: ${this.baseURL}`;
        errorMessage += `\nEndpoint: ${endpoint}`;
        if (responseData) {
          errorMessage += `\nResponse: ${JSON.stringify(responseData).substring(0, 500)}`;
        }
        
        // Log to console for debugging
        console.error('Timeweb API Error Summary:', {
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

