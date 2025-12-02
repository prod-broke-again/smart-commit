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
      apiKeys: {},
      defaultModel: 'gpt-5-nano',
      defaultProvider: 'gptunnel',
      maxTokens: 1000,
      temperature: 0.7,
      language: 'en',
      useWalletBalance: true,
      analysisMode: 'lite',
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

    // Determine provider: project config overrides global
    const provider = projectConfig.defaultProvider ?? globalConfig.defaultProvider;

    // Determine model: project config overrides global
    const model = projectConfig.defaultModel ?? globalConfig.defaultModel;

    // Find API key with priority: project apiKey > global apiKeys[provider] > global apiKey (backward compatibility)
    let apiKey: string | null = null;
    
    if (projectConfig.apiKey) {
      // Project-specific key takes highest priority
      apiKey = projectConfig.apiKey;
    } else if (globalConfig.apiKeys && globalConfig.apiKeys[provider]) {
      // Use key from apiKeys map for the specific provider
      apiKey = globalConfig.apiKeys[provider];
    } else if (globalConfig.apiKey) {
      // Fallback to old apiKey field for backward compatibility
      apiKey = globalConfig.apiKey;
    }

    // Create API credentials if API key is available
    const apiCredentials = apiKey
      ? ApiCredentials.create(apiKey, provider)
      : null;

    // Get AI model - try to find it, if not found, create a basic model for this provider
    let aiModel = AiModel.findByName(model);
    if (!aiModel) {
      // If model not found, create a basic model with default parameters
      // This allows using models that aren't in the static list or API cache
      aiModel = AiModel.create(model, provider, 400000, 0.7);
    }

    // Merge configs (project overrides global)
    const merged: MergedConfig = {
      ...globalConfig,
      ...projectConfig,
      defaultProvider: provider,
      defaultModel: model,
      apiCredentials,
      aiModel,
    };

    return merged;
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

    // Validate API key if present (backward compatibility)
    if (cfg['apiKey'] !== undefined && cfg['apiKey'] !== null) {
      if (typeof cfg['apiKey'] !== 'string' || cfg['apiKey'].length < 10) {
        errors.push('API key must be a string with at least 10 characters');
      }
    }

    // Validate apiKeys object if present
    if (cfg['apiKeys'] !== undefined) {
      if (typeof cfg['apiKeys'] !== 'object' || Array.isArray(cfg['apiKeys']) || cfg['apiKeys'] === null) {
        errors.push('apiKeys must be an object');
      } else {
        const apiKeys = cfg['apiKeys'] as Record<string, unknown>;
        for (const [provider, key] of Object.entries(apiKeys)) {
          if (typeof key !== 'string' || key.length < 10) {
            errors.push(`API key for provider "${provider}" must be a string with at least 10 characters`);
          }
        }
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

    // Validate analysis mode
    if (cfg['analysisMode'] !== undefined) {
      if (typeof cfg['analysisMode'] !== 'string' || !['lite', 'full'].includes(cfg['analysisMode'])) {
        errors.push('Analysis mode must be either "lite" or "full"');
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
