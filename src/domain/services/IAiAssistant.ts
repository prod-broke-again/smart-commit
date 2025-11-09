import { AiModel } from '../entities/AiModel';
import { ApiCredentials } from '../value-objects/ApiCredentials';

/**
 * Interface for AI assistant service
 */
export interface IAiAssistant {
  /**
   * Returns unique provider identifier
   */
  getProviderId(): string;

  /**
   * Generates text using AI model
   */
  generateText(
    prompt: string,
    options?: AiGenerationOptions
  ): Promise<string>;

  /**
   * Validates API credentials
   */
  validateCredentials(credentials: ApiCredentials): Promise<boolean>;

  /**
   * Gets available models
   */
  getAvailableModels(): Promise<readonly AiModel[]>;

  /**
   * Fetches models from remote API (optional, provider-specific)
   */
  fetchModelsFromApi?(): Promise<readonly unknown[]>;

  /**
   * Estimates token count for text
   */
  estimateTokens(text: string): number;

  /**
   * Gets model capabilities and limits
   */
  getModelCapabilities(model: AiModel): ModelCapabilities;

  /**
   * Sets API credentials (optional)
   */
  setCredentials?(credentials: ApiCredentials): void;

  /**
   * Clears API credentials (optional)
   */
  clearCredentials?(): void;
}

/**
 * Options for AI text generation
 */
export interface AiGenerationOptions {
  readonly model?: AiModel;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly stopSequences?: readonly string[];
  readonly customInstructions?: string | null;
}

/**
 * AI model capabilities and limits
 */
export interface ModelCapabilities {
  readonly maxTokens: number;
  readonly supportsStreaming: boolean;
  readonly supportsFunctions: boolean;
  readonly contextWindow: number;
  readonly pricing: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
}
