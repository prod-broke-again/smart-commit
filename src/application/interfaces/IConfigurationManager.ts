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
  saveGlobalConfig(config: Partial<GlobalConfig>): Promise<void>;

  /**
   * Saves project configuration
   */
  saveProjectConfig(config: Partial<ProjectConfig>): Promise<void>;

  /**
   * Validates configuration
   */
  validateConfig(config: unknown): ConfigValidationResult;
}

/**
 * Global configuration (user-specific)
 */
export interface GlobalConfig {
  readonly apiKey: string | null;
  readonly defaultModel: string;
  readonly defaultProvider: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly language: string;
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
}

/**
 * Merged configuration (global + project)
 */
export interface MergedConfig extends GlobalConfig, ProjectConfig {
  readonly apiCredentials: ApiCredentials | null;
  readonly aiModel: AiModel;
  readonly [key: string]: unknown;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}
