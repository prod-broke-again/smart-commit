/**
 * Model information from GPTunnel API
 */
export interface GptunnelModelInfo {
  readonly id: string;
  readonly object: string;
  readonly created: number;
  readonly title: string;
  readonly max_capacity: number;
  readonly cost_context: string;
  readonly cost_completion: string;
}

/**
 * Generic model descriptor used for serialization and provider integrations
 */
export interface AiModelDescriptor {
  readonly name: string;
  readonly provider: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly supportsStreaming: boolean;
}

/**
 * Represents an AI model configuration
 */
export class AiModel {
  private constructor(
    private readonly _name: string,
    private readonly _provider: string,
    private readonly _maxTokens: number,
    private readonly _temperature: number,
    private readonly _supportsStreaming: boolean
  ) {}

  public static create(
    name: string,
    provider: string,
    maxTokens: number = 4096,
    temperature: number = 0.7,
    supportsStreaming: boolean = false
  ): AiModel {
    if (!name || name.trim().length === 0) {
      throw new Error('Model name is required');
    }

    if (!provider || provider.trim().length === 0) {
      throw new Error('Provider is required');
    }

    if (maxTokens <= 0) {
      throw new Error('Max tokens must be positive');
    }

    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }

    return new AiModel(
      name.trim(),
      provider.trim().toLowerCase(),
      maxTokens,
      temperature,
      supportsStreaming
    );
  }

  public get name(): string {
    return this._name;
  }

  public get provider(): string {
    return this._provider;
  }

  public get maxTokens(): number {
    return this._maxTokens;
  }

  public get temperature(): number {
    return this._temperature;
  }

  public get supportsStreaming(): boolean {
    return this._supportsStreaming;
  }

  /**
   * Checks if this model is suitable for commit message generation
   */
  public isSuitableForCommits(): boolean {
    return this._maxTokens >= 1000; // Minimum tokens needed for commit generation
  }

  /**
   * Returns model identifier for API calls
   */
  public getApiIdentifier(): string {
    return this._name;
  }

  /**
   * Create AiModel from GPTunnel API model info
   */
  public static fromGptunnelInfo(info: GptunnelModelInfo): AiModel {
    return AiModel.create(
      info.id,
      'gptunnel',
      info.max_capacity,
      0.7, // Default temperature
      false // No streaming support by default
    );
  }

  /**
   * Predefined models (fallback when API is not available)
   */
  public static readonly GPT_3_5_TURBO = AiModel.create('gpt-3.5-turbo', 'gptunnel', 4096, 0.7);
  public static readonly GPT_4 = AiModel.create('gpt-4', 'gptunnel', 8192, 0.7);
  public static readonly GPT_4_TURBO = AiModel.create('gpt-4-turbo', 'gptunnel', 128000, 0.7);
  public static readonly GPT_4O = AiModel.create('gpt-4o', 'gptunnel', 128000, 0.7);
  public static readonly GPT_4O_MINI = AiModel.create('gpt-4o-mini', 'gptunnel', 128000, 0.7);

  public static readonly OPENAI_GPT_4O = AiModel.create('gpt-4o', 'openai', 128000, 0.7, true);
  public static readonly OPENAI_GPT_4O_MINI = AiModel.create('gpt-4o-mini', 'openai', 128000, 0.7, true);
  public static readonly OPENAI_GPT_3_5_TURBO = AiModel.create('gpt-3.5-turbo-0125', 'openai', 16385, 0.7, true);

  public static readonly CLAUDE_3_OPUS = AiModel.create('claude-3-opus-20240229', 'anthropic', 200000, 0.6, true);
  public static readonly CLAUDE_3_SONNET = AiModel.create('claude-3-5-sonnet-20241022', 'anthropic', 200000, 0.6, true);
  public static readonly CLAUDE_3_HAIKU = AiModel.create('claude-3-haiku-20240307', 'anthropic', 200000, 0.6, true);

  public static readonly GEMINI_1_5_PRO = AiModel.create('gemini-1.5-pro-latest', 'gemini', 1048576, 0.7, true);
  public static readonly GEMINI_1_5_FLASH = AiModel.create('gemini-1.5-flash-latest', 'gemini', 1048576, 0.7, true);
  public static readonly GEMINI_PRO = AiModel.create('gemini-pro', 'gemini', 32000, 0.7, true);

  public static readonly TIMEWEB_GPT_4O = AiModel.create('gpt-4o', 'timeweb', 128000, 0.7, true);
  public static readonly TIMEWEB_GPT_4O_MINI = AiModel.create('gpt-4o-mini', 'timeweb', 128000, 0.7, true);
  public static readonly TIMEWEB_GPT_3_5_TURBO = AiModel.create('gpt-3.5-turbo', 'timeweb', 16385, 0.7, true);

  private static readonly DEFAULT_MODELS: Record<string, readonly AiModel[]> = Object.freeze({
    gptunnel: Object.freeze([
      AiModel.GPT_3_5_TURBO,
      AiModel.GPT_4,
      AiModel.GPT_4_TURBO,
      AiModel.GPT_4O,
      AiModel.GPT_4O_MINI,
    ]),
    openai: Object.freeze([
      AiModel.OPENAI_GPT_4O,
      AiModel.OPENAI_GPT_4O_MINI,
      AiModel.OPENAI_GPT_3_5_TURBO,
    ]),
    anthropic: Object.freeze([
      AiModel.CLAUDE_3_OPUS,
      AiModel.CLAUDE_3_SONNET,
      AiModel.CLAUDE_3_HAIKU,
    ]),
    gemini: Object.freeze([
      AiModel.GEMINI_1_5_PRO,
      AiModel.GEMINI_1_5_FLASH,
      AiModel.GEMINI_PRO,
    ]),
    timeweb: Object.freeze([
      AiModel.TIMEWEB_GPT_4O,
      AiModel.TIMEWEB_GPT_4O_MINI,
      AiModel.TIMEWEB_GPT_3_5_TURBO,
    ]),
  });

  /**
   * Local storage for dynamically loaded models
   */
  private static _loadedModelsByProvider: Map<string, readonly AiModel[]> = new Map();

  private static normalizeProvider(provider: string): string {
    return provider.trim().toLowerCase();
  }

  /**
   * Load models from API response
   */
  public static loadFromApi(modelsInfo: readonly GptunnelModelInfo[], provider: string = 'gptunnel'): void {
    const normalizedProvider = AiModel.normalizeProvider(provider);
    const models = modelsInfo.map(info => AiModel.fromGptunnelInfo(info));
    AiModel.registerProviderModels(normalizedProvider, models);
  }

  /**
   * Register models for a provider (overwrites previous registration)
   */
  public static registerProviderModels(provider: string, models: readonly AiModel[]): void {
    const normalizedProvider = AiModel.normalizeProvider(provider);

    const normalizedModels = models.map(model =>
      model.provider === normalizedProvider
        ? model
        : AiModel.create(model.name, normalizedProvider, model.maxTokens, model.temperature, model.supportsStreaming)
    );

    AiModel._loadedModelsByProvider.set(normalizedProvider, Object.freeze([...normalizedModels]));
  }

  /**
   * Register models based on lightweight descriptors
   */
  public static registerProviderDescriptors(provider: string, descriptors: readonly AiModelDescriptor[]): void {
    const models = descriptors.map(descriptor => AiModel.fromDescriptor(descriptor));
    AiModel.registerProviderModels(provider, models);
  }

  /**
   * Converts descriptor to AiModel
   */
  public static fromDescriptor(descriptor: AiModelDescriptor): AiModel {
    return AiModel.create(
      descriptor.name,
      descriptor.provider,
      descriptor.maxTokens,
      descriptor.temperature,
      descriptor.supportsStreaming
    );
  }

  /**
   * Get all available models (loaded from API or fallback to predefined)
   */
  public static getAvailableModels(provider: string = 'gptunnel'): readonly AiModel[] {
    const normalizedProvider = AiModel.normalizeProvider(provider);
    const loaded = AiModel._loadedModelsByProvider.get(normalizedProvider);
    if (loaded && loaded.length > 0) {
      return loaded;
    }

    const defaults = AiModel.DEFAULT_MODELS[normalizedProvider];
    if (defaults && defaults.length > 0) {
      return defaults;
    }

    const fallback = AiModel.DEFAULT_MODELS['gptunnel'];
    return fallback || [];
  }

  /**
   * Finds model by name
   */
  public static findByName(name: string, provider?: string): AiModel | null {
    if (provider) {
      const normalizedProvider = AiModel.normalizeProvider(provider);
      const models = AiModel.getAvailableModels(normalizedProvider);
      return models.find(model => model.name === name) || null;
    }

    for (const models of AiModel._loadedModelsByProvider.values()) {
      const match = models.find(model => model.name === name);
      if (match) {
        return match;
      }
    }

    for (const models of Object.values(AiModel.DEFAULT_MODELS)) {
      const match = models.find(model => model.name === name);
      if (match) {
        return match;
      }
    }

    return null;
  }
}
