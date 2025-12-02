import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { AiModel, AiModelDescriptor, GptunnelModelInfo } from '../../domain/entities/AiModel';
import { IAiAssistant } from '../../domain/services/IAiAssistant';

/**
 * Model manager for handling dynamic model loading and caching
 */
export class ModelManager {
  private readonly modelsCachePath: string;
  private cachedModels: AiModelDescriptor[] | null = null;
  private cachedProvider: string | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly aiAssistant: IAiAssistant) {
    this.modelsCachePath = path.join(os.homedir(), '.smart-commit', 'models-cache.json');
  }

  /**
   * Load models from cache or API
   */
  public async loadModels(forceRefresh: boolean = false): Promise<void> {
    try {
      const provider = this.aiAssistant.getProviderId();
      const canFetch = typeof this.aiAssistant.fetchModelsFromApi === 'function';

      if (!canFetch) {
        // Provider does not support dynamic model discovery
        return;
      }

      // Try to load from cache first
      if (
        !forceRefresh &&
        this.cachedModels &&
        this.cachedProvider === provider &&
        this.isCacheValid()
      ) {
        AiModel.registerProviderDescriptors(provider, this.cachedModels);
        return;
      }

      // Load from cache file
      if (!forceRefresh) {
        const cachedData = await this.loadFromCache();
        if (
          cachedData &&
          cachedData.provider === provider &&
          this.isCacheValid()
        ) {
          this.cachedModels = cachedData.models;
          this.cachedProvider = provider;
          AiModel.registerProviderDescriptors(provider, cachedData.models);
          return;
        }
      }

      // Fetch from API
      await this.fetchAndCacheModels(provider);

    } catch (error) {
      console.warn('Failed to load models from API, using fallback models:', error);
      // Use fallback models (predefined)
      this.cachedModels = null;
    }
  }

  /**
   * Force refresh models from API
   */
  public async refreshModels(): Promise<void> {
    const provider = this.aiAssistant.getProviderId();
    await this.fetchAndCacheModels(provider);
  }

  /**
   * Get current models info
   */
  public getCurrentModels(): readonly AiModelDescriptor[] | null {
    return this.cachedModels;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastFetchTime < this.CACHE_DURATION;
  }

  /**
   * Load models from cache file
   */
  private async loadFromCache(): Promise<{ provider: string; models: AiModelDescriptor[] } | null> {
    try {
      const cacheData = await fs.readJson(this.modelsCachePath);
      if (cacheData.models && Array.isArray(cacheData.models) && cacheData.timestamp) {
        this.lastFetchTime = cacheData.timestamp;
        const provider = typeof cacheData.provider === 'string' ? cacheData.provider.toLowerCase() : 'gptunnel';

        const rawModels = cacheData.models as any[];
        const models: AiModelDescriptor[] = rawModels.every((model: any) => typeof model?.name === 'string')
          ? rawModels.map(model => ({
              name: String(model.name),
              provider: (model.provider ?? provider).toLowerCase(),
              maxTokens: typeof model.maxTokens === 'number' ? model.maxTokens : 128000,
              temperature: typeof model.temperature === 'number' ? model.temperature : 0.7,
              supportsStreaming: Boolean(model.supportsStreaming),
            }))
          : (rawModels as GptunnelModelInfo[]).map(model => ({
              name: model.id,
              provider: 'gptunnel',
              maxTokens: model.max_capacity,
              temperature: 0.7,
              supportsStreaming: false,
            }));

        return {
          provider,
          models,
        };
      }
    } catch {
      // Cache doesn't exist or is invalid
    }
    return null;
  }

  /**
   * Fetch models from API and save to cache
   * 
   * Some providers (like Timeweb) don't support model listing.
   * If fetchModelsFromApi returns empty array, we skip caching
   * and use predefined models from getAvailableModels().
   */
  private async fetchAndCacheModels(provider: string): Promise<void> {
    if (typeof this.aiAssistant.fetchModelsFromApi !== 'function') {
      throw new Error('AI assistant does not support model fetching');
    }

    const models = await this.aiAssistant.fetchModelsFromApi() as readonly AiModelDescriptor[];
    
    // If provider doesn't support model listing (returns empty array),
    // skip caching and use predefined models
    if (models.length === 0) {
      return;
    }
    
    const descriptors = models.map(model => ({
      ...model,
      provider: model.provider.toLowerCase(),
    }));
    this.cachedModels = descriptors;
    this.cachedProvider = provider;
    this.lastFetchTime = Date.now();

    // Save to cache
    await this.saveToCache(provider, descriptors);

    // Load into AiModel
    AiModel.registerProviderDescriptors(provider, descriptors);
  }

  /**
   * Save models to cache file
   */
  private async saveToCache(provider: string, models: AiModelDescriptor[]): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.modelsCachePath));
      await fs.writeJson(this.modelsCachePath, {
        provider,
        models,
        timestamp: this.lastFetchTime,
        version: '1.0'
      }, { spaces: 2 });
    } catch (error) {
      console.warn('Failed to save models cache:', error);
    }
  }

  /**
   * Clear models cache
   */
  public async clearCache(): Promise<void> {
    try {
      await fs.remove(this.modelsCachePath);
      this.cachedModels = null;
      this.cachedProvider = null;
      this.lastFetchTime = 0;
    } catch (error) {
      console.warn('Failed to clear models cache:', error);
    }
  }
}
