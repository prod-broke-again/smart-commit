import { AiModel } from '../../domain/entities/AiModel';
import { ApiCredentials } from '../../domain/value-objects/ApiCredentials';

/**
 * Interface for configuration management
 */
export interface IConfigurationManager {
  /**
   * Gets global configuration
   */
  getGlobalConfig(): Promise<GlobalConfig>;

  /**
   * Gets project-specific configuration
   */
  getProjectConfig(): Promise<ProjectConfig>;

  /**
   * Merges global and project configurations
   */
  getMergedConfig(): Promise<MergedConfig>;

  /**
   * Saves global configuration
   */
  saveGlobalConfig(_config: Partial<GlobalConfig>): Promise<void>;

  /**
   * Saves project configuration
   */
  saveProjectConfig(_config: Partial<ProjectConfig>): Promise<void>;

  /**
   * Validates configuration
   */
  validateConfig(_config: unknown): ConfigValidationResult;
}

/**
 * Global configuration (user-specific)
 */
export interface GlobalConfig {
  /** @deprecated Use apiKeys instead. Kept for backward compatibility */
  readonly apiKey?: string | null;
  /** API keys for different providers: { "openai": "key1", "timeweb": "key2", ... } */
  readonly apiKeys?: Record<string, string>;
  /** Base URLs for different providers: { "openai": "https://...", "timeweb": "https://...", ... } */
  readonly baseUrls?: Record<string, string>;
  readonly defaultModel: string;
  readonly defaultProvider: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly language: string;
  readonly useWalletBalance: boolean;
  readonly analysisMode: 'lite' | 'full';
  readonly [key: string]: unknown;
}

/**
 * Project-specific configuration
 */
export interface ProjectConfig {
  readonly ignoredFiles: readonly string[];
  readonly customTypes: Record<string, string>;
  readonly maxCommitLength: number;
  readonly includeScope: boolean;
  readonly conventionalCommitsOnly: boolean;
  readonly customInstructions: string | null;
  /** Project-specific API key (overrides global for this project) */
  readonly apiKey?: string | null;
  /** Project-specific provider (overrides global for this project) */
  readonly defaultProvider?: string | null;
  /** Project-specific model (overrides global for this project) */
  readonly defaultModel?: string | null;
}

/**
 * Merged configuration (global + project)
 * After merging, defaultModel and defaultProvider are always defined (from global if not in project)
 */
export interface MergedConfig extends Omit<GlobalConfig, 'defaultModel' | 'defaultProvider'>, Omit<ProjectConfig, 'defaultModel' | 'defaultProvider' | 'apiKey'> {
  readonly apiCredentials: ApiCredentials | null;
  readonly aiModel: AiModel;
  readonly defaultModel: string; // Always defined after merge
  readonly defaultProvider: string; // Always defined after merge
  readonly [key: string]: unknown;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}
