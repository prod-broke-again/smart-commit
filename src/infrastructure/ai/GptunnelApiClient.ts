import axios, { AxiosInstance } from 'axios';
import { AiModel, GptunnelModelInfo } from '../../domain/entities/AiModel';
import { ApiCredentials } from '../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../domain/services/IAiAssistant';

/**
 * GPTunnel API client implementation
 */
export class GptunnelApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL = 'https://gptunnel.ru/v1';
  private useWalletBalance: boolean;

  constructor(useWalletBalance: boolean = true) {
    this.useWalletBalance = useWalletBalance;
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public async generateText(prompt: string, options: AiGenerationOptions = {}): Promise<string> {
    const model = options.model || AiModel.GPT_3_5_TURBO;
    const maxTokens = options.maxTokens || Math.min(500, model.maxTokens - this.estimateTokens(prompt) - 100);

    // GPT-5 models only support temperature = 1 (default)
    const temperature = model.name.startsWith('gpt-5') ? 1 : (options.temperature ?? model.temperature);

    const requestBody: any = {
      model: model.name,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stop: options.stopSequences,
    };

    // Add temperature only if it's not the default value or for non-GPT-5 models
    if (model.name.startsWith('gpt-5')) {
      // GPT-5 models use default temperature (1), don't specify it
    } else {
      requestBody.temperature = temperature;
    }

    // Different models use different parameter names for max tokens
    if (model.name.startsWith('gpt-5')) {
      // GPT-5 models use max_completion_tokens - allow full token limit for GPT-5-nano
      requestBody.max_completion_tokens = maxTokens;
    } else {
      // GPT-4 and other models use max_tokens
      requestBody.max_tokens = maxTokens;
    }

    // Add useWalletBalance for individual users (not companies)
    if (this.useWalletBalance) {
      requestBody.useWalletBalance = true;
    }

    try {
      console.log('Generating commit message with AI...');

      const response = await this.httpClient.post('/chat/completions', requestBody);

      const choice = response.data.choices?.[0];
      if (!choice?.message) {
        throw new Error('Invalid response format from GPTunnel API');
      }

      // Handle empty content (can happen with very short responses)
      const content = choice.message.content || '';
      if (content.trim().length === 0 && choice.finish_reason === 'length') {
        throw new Error('Response was truncated due to max_completion_tokens limit. Try increasing the limit.');
      }

      // Show AI response after successful generation
      console.log('\n--- AI Response ---');
      console.log(content.trim());
      console.log('--- End ---\n');

      return content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('GPTunnel API Error Details:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Headers:', error.response?.headers);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Request Body:', JSON.stringify(requestBody, null, 2));
        console.error('Prompt length:', prompt.length);
        console.error('Estimated tokens:', this.estimateTokens(prompt));

        if (error.response?.status === 401) {
          throw new Error('Invalid API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.error?.message || 'Invalid request parameters';
          const fullError = `Invalid request parameters: ${errorMessage}`;
          throw new Error(fullError);
        }
        throw new Error(`GPTunnel API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  public async validateCredentials(credentials: ApiCredentials): Promise<boolean> {
    if (!credentials.isValid()) {
      return false;
    }

    // Set API key in headers for validation
    this.httpClient.defaults.headers.common['Authorization'] = credentials.apiKey;

    try {
      // Try a simple request to validate credentials
      await this.httpClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
        useWalletBalance: this.useWalletBalance,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  public async getAvailableModels(): Promise<readonly AiModel[]> {
    return AiModel.getAvailableModels();
  }

  /**
   * Fetch models from GPTunnel API
   */
  public async fetchModelsFromApi(): Promise<readonly GptunnelModelInfo[]> {
    try {
      const response = await this.httpClient.get('/models');

      if (response.data?.object === 'list' && Array.isArray(response.data?.data)) {
        return response.data.data as GptunnelModelInfo[];
      }

      throw new Error('Invalid response format from models API');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key for models request');
        }
        throw new Error(`Failed to fetch models: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  public estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  public getModelCapabilities(model: AiModel): ModelCapabilities {
    return {
      maxTokens: model.maxTokens,
      supportsStreaming: false, // GPTunnel doesn't support streaming in basic implementation
      supportsFunctions: false,
      contextWindow: model.maxTokens,
      pricing: {
        inputTokens: 0.0015, // Example pricing, should be fetched from API
        outputTokens: 0.002,
      },
    };
  }

  /**
   * Sets API credentials for subsequent requests
   */
  public setCredentials(credentials: ApiCredentials): void {
    // GPTunnel API expects just the API key in Authorization header
    this.httpClient.defaults.headers.common['Authorization'] = credentials.apiKey;
  }

  /**
   * Clears API credentials
   */
  public clearCredentials(): void {
    delete this.httpClient.defaults.headers.common['Authorization'];
  }

  /**
   * Sets whether to use wallet balance for payments
   */
  public setUseWalletBalance(useWalletBalance: boolean): void {
    this.useWalletBalance = useWalletBalance;
  }

  /**
   * Gets current wallet balance setting
   */
  public getUseWalletBalance(): boolean {
    return this.useWalletBalance;
  }
}
