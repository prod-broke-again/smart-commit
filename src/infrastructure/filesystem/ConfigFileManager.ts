import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { AiModel } from '../../domain/entities/AiModel';
import { ApiCredentials } from '../../domain/value-objects/ApiCredentials';
import {
  IConfigurationManager,
  GlobalConfig,
  ProjectConfig,
  MergedConfig,
  ConfigValidationResult
} from '../../application/interfaces/IConfigurationManager';

/**
 * Configuration file manager implementation
 */
export class ConfigFileManager implements IConfigurationManager {
  private readonly globalConfigPath: string;
  private readonly projectConfigPath: string;

  constructor() {
    // Global config stored in user's home directory
    this.globalConfigPath = path.join(os.homedir(), '.smart-commit', 'config.json');
    // Project config stored in project root
    this.projectConfigPath = path.join(process.cwd(), '.smart-commit.json');
  }

  public async getGlobalConfig(): Promise<GlobalConfig> {
    const defaultConfig: GlobalConfig = {
      apiKey: null,
      defaultModel: 'gpt-3.5-turbo',
      defaultProvider: 'gptunnel',
      maxTokens: 1000,
      temperature: 0.7,
      language: 'en',
      useWalletBalance: true,
    };

    try {
      const config = await fs.readJson(this.globalConfigPath);
      return { ...defaultConfig, ...config };
    } catch {
      return defaultConfig;
    }
  }

  public async getProjectConfig(): Promise<ProjectConfig> {
    const defaultConfig: ProjectConfig = {
      ignoredFiles: [],
      customTypes: {},
      maxCommitLength: 72,
      includeScope: false,
      conventionalCommitsOnly: true,
      customInstructions: null,
    };

    try {
      const config = await fs.readJson(this.projectConfigPath);
      return { ...defaultConfig, ...config };
    } catch {
      return defaultConfig;
    }
  }

  public async getMergedConfig(): Promise<MergedConfig> {
    const [globalConfig, projectConfig] = await Promise.all([
      this.getGlobalConfig(),
      this.getProjectConfig(),
    ]);

    const merged = { ...globalConfig, ...projectConfig };

    // Create API credentials if API key is available
    const apiCredentials = merged.apiKey
      ? ApiCredentials.create(merged.apiKey, merged.defaultProvider)
      : null;

    // Get AI model - try to find it, if not found, create a basic model for this provider
    let aiModel = AiModel.findByName(merged.defaultModel);
    if (!aiModel) {
      // If model not found, create a basic model with default parameters
      // This allows using models that aren't in the static list or API cache
      aiModel = AiModel.create(merged.defaultModel, merged.defaultProvider, 400000, 0.7);
    }

    return {
      ...merged,
      apiCredentials,
      aiModel,
    };
  }

  public async saveGlobalConfig(config: Partial<GlobalConfig>): Promise<void> {
    await fs.ensureDir(path.dirname(this.globalConfigPath));
    const currentConfig = await this.getGlobalConfig();
    const newConfig = { ...currentConfig, ...config };
    await fs.writeJson(this.globalConfigPath, newConfig, { spaces: 2 });
  }

  public async saveProjectConfig(config: Partial<ProjectConfig>): Promise<void> {
    const currentConfig = await this.getProjectConfig();
    const newConfig = { ...currentConfig, ...config };
    await fs.writeJson(this.projectConfigPath, newConfig, { spaces: 2 });
  }

  public validateConfig(config: unknown): ConfigValidationResult {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      return { isValid: false, errors: ['Configuration must be an object'] };
    }

    const cfg = config as Record<string, unknown>;

    // Validate API key if present
    if (cfg['apiKey'] !== undefined && cfg['apiKey'] !== null) {
      if (typeof cfg['apiKey'] !== 'string' || cfg['apiKey'].length < 10) {
        errors.push('API key must be a string with at least 10 characters');
      }
    }

    // Validate model
    if (cfg['defaultModel'] !== undefined) {
      if (typeof cfg['defaultModel'] !== 'string') {
        errors.push('Default model must be a string');
      }
      // Note: We don't validate if model exists since models can be loaded dynamically from API
    }

    // Validate provider
    if (cfg['defaultProvider'] !== undefined) {
      if (typeof cfg['defaultProvider'] !== 'string') {
        errors.push('Default provider must be a string');
      }
    }

    // Validate max tokens
    if (cfg['maxTokens'] !== undefined) {
      if (typeof cfg['maxTokens'] !== 'number' || cfg['maxTokens'] <= 0) {
        errors.push('Max tokens must be a positive number');
      }
    }

    // Validate temperature
    if (cfg['temperature'] !== undefined) {
      if (typeof cfg['temperature'] !== 'number' || cfg['temperature'] < 0 || cfg['temperature'] > 2) {
        errors.push('Temperature must be a number between 0 and 2');
      }
    }

    // Validate language
    if (cfg['language'] !== undefined) {
      if (typeof cfg['language'] !== 'string') {
        errors.push('Language must be a string');
      }
    }

    // Validate ignored files
    if (cfg['ignoredFiles'] !== undefined) {
      if (!Array.isArray(cfg['ignoredFiles'])) {
        errors.push('Ignored files must be an array');
      } else if (!cfg['ignoredFiles'].every((item: unknown) => typeof item === 'string')) {
        errors.push('All ignored files must be strings');
      }
    }

    // Validate custom types
    if (cfg['customTypes'] !== undefined) {
      if (typeof cfg['customTypes'] !== 'object' || Array.isArray(cfg['customTypes'])) {
        errors.push('Custom types must be an object');
      }
    }

    // Validate max commit length
    if (cfg['maxCommitLength'] !== undefined) {
      if (typeof cfg['maxCommitLength'] !== 'number' || cfg['maxCommitLength'] <= 0) {
        errors.push('Max commit length must be a positive number');
      }
    }

    // Validate boolean flags
    const booleanFields = ['includeScope', 'conventionalCommitsOnly', 'useWalletBalance'];
    for (const field of booleanFields) {
      if (cfg[field] !== undefined && typeof cfg[field] !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
