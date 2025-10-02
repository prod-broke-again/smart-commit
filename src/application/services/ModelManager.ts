import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { AiModel, GptunnelModelInfo } from '../../domain/entities/AiModel';
import { IAiAssistant } from '../../domain/services/IAiAssistant';

/**
 * Model manager for handling dynamic model loading and caching
 */
export class ModelManager {
  private readonly modelsCachePath: string;
  private cachedModels: GptunnelModelInfo[] | null = null;
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
      // Try to load from cache first
      if (!forceRefresh && this.cachedModels && this.isCacheValid()) {
        AiModel.loadFromApi(this.cachedModels);
        return;
      }

      // Load from cache file
      if (!forceRefresh) {
        const cachedData = await this.loadFromCache();
        if (cachedData && this.isCacheValid()) {
          this.cachedModels = cachedData;
          AiModel.loadFromApi(cachedData);
          return;
        }
      }

      // Fetch from API
      await this.fetchAndCacheModels();

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
    await this.fetchAndCacheModels();
  }

  /**
   * Get current models info
   */
  public getCurrentModels(): readonly GptunnelModelInfo[] | null {
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
  private async loadFromCache(): Promise<GptunnelModelInfo[] | null> {
    try {
      const cacheData = await fs.readJson(this.modelsCachePath);
      if (cacheData.models && Array.isArray(cacheData.models) && cacheData.timestamp) {
        this.lastFetchTime = cacheData.timestamp;
        return cacheData.models;
      }
    } catch {
      // Cache doesn't exist or is invalid
    }
    return null;
  }

  /**
   * Fetch models from API and save to cache
   */
  private async fetchAndCacheModels(): Promise<void> {
    if (!(this.aiAssistant instanceof Object && 'fetchModelsFromApi' in this.aiAssistant)) {
      throw new Error('AI assistant does not support model fetching');
    }

    const models = await (this.aiAssistant as any).fetchModelsFromApi();
    this.cachedModels = models;
    this.lastFetchTime = Date.now();

    // Save to cache
    await this.saveToCache(models);

    // Load into AiModel
    AiModel.loadFromApi(models);
  }

  /**
   * Save models to cache file
   */
  private async saveToCache(models: GptunnelModelInfo[]): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.modelsCachePath));
      await fs.writeJson(this.modelsCachePath, {
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
      this.lastFetchTime = 0;
    } catch (error) {
      console.warn('Failed to clear models cache:', error);
    }
  }
}
