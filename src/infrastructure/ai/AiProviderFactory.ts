import { IAiAssistant } from '../../domain/services/IAiAssistant';
import { ApiCredentials } from '../../domain/value-objects/ApiCredentials';
import { GptunnelApiClient } from './GptunnelApiClient';
import { OpenAiApiClient } from './providers/OpenAiApiClient';
import { AnthropicApiClient } from './providers/AnthropicApiClient';
import { GeminiApiClient } from './providers/GeminiApiClient';
import { TimewebApiClient } from './providers/TimewebApiClient';

export interface AiProviderFactoryOptions {
  readonly credentials?: ApiCredentials | null;
  readonly useWalletBalance?: boolean;
  readonly baseUrls?: Partial<Record<string, string>>;
  readonly anthropicApiVersion?: string;
}

export class AiProviderFactory {
  public static create(provider: string, options: AiProviderFactoryOptions = {}): IAiAssistant {
    const normalizedProvider = (provider ?? '').trim().toLowerCase() || 'gptunnel';
    const baseUrls = options.baseUrls ?? {};

    let assistant: IAiAssistant;

    switch (normalizedProvider) {
      case 'openai':
        assistant = new OpenAiApiClient(baseUrls['openai']);
        break;
      case 'anthropic':
      case 'claude':
        assistant = new AnthropicApiClient(baseUrls['anthropic'], options.anthropicApiVersion);
        break;
      case 'gemini':
      case 'google':
        assistant = new GeminiApiClient(baseUrls['gemini']);
        break;
      case 'timeweb':
        assistant = new TimewebApiClient(baseUrls['timeweb']);
        break;
      case 'gptunnel':
      default:
        assistant = new GptunnelApiClient(options.useWalletBalance ?? true);
        break;
    }

    if (options.credentials) {
      assistant.setCredentials?.(options.credentials);
    }

    return assistant;
  }
}

