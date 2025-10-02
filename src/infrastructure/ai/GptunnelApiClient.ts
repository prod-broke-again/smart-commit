import axios, { AxiosInstance } from 'axios';
import { AiModel } from '../../domain/entities/AiModel';
import { ApiCredentials } from '../../domain/value-objects/ApiCredentials';
import { IAiAssistant, AiGenerationOptions, ModelCapabilities } from '../../domain/services/IAiAssistant';

/**
 * GPTunnel API client implementation
 */
export class GptunnelApiClient implements IAiAssistant {
  private readonly httpClient: AxiosInstance;
  private readonly baseURL = 'https://gptunnel.ru/v1';

  constructor() {
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
    const maxTokens = options.maxTokens || Math.min(1000, model.maxTokens - this.estimateTokens(prompt) - 100);
    const temperature = options.temperature ?? model.temperature;

    const requestBody = {
      model: model.name,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
      stop: options.stopSequences,
    };

    try {
      const response = await this.httpClient.post('/chat/completions', requestBody);

      const choice = response.data.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('Invalid response format from GPTunnel API');
      }

      return choice.message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response?.status === 400) {
          throw new Error('Invalid request parameters');
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
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  public async getAvailableModels(): Promise<readonly AiModel[]> {
    // For now, return predefined models since GPTunnel doesn't have a models endpoint
    // In production, this could be fetched from API if available
    return AiModel.getAvailableModels();
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
    this.httpClient.defaults.headers.common['Authorization'] = credentials.apiKey;
  }

  /**
   * Clears API credentials
   */
  public clearCredentials(): void {
    delete this.httpClient.defaults.headers.common['Authorization'];
  }
}
