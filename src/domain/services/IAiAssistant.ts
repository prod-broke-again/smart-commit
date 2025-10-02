import { AiModel } from '../entities/AiModel';
import { ApiCredentials } from '../value-objects/ApiCredentials';

/**
 * Interface for AI assistant service
 */
export interface IAiAssistant {
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
   * Estimates token count for text
   */
  estimateTokens(text: string): number;

  /**
   * Gets model capabilities and limits
   */
  getModelCapabilities(model: AiModel): ModelCapabilities;
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
