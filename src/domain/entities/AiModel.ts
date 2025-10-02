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
      provider.trim(),
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

  /**
   * Local storage for dynamically loaded models
   */
  private static _loadedModels: Map<string, AiModel> = new Map();

  /**
   * Load models from API response
   */
  public static loadFromApi(modelsInfo: readonly GptunnelModelInfo[]): void {
    AiModel._loadedModels.clear();
    for (const info of modelsInfo) {
      const model = AiModel.fromGptunnelInfo(info);
      AiModel._loadedModels.set(model.name, model);
    }
  }

  /**
   * Get all available models (loaded from API or fallback to predefined)
   */
  public static getAvailableModels(): readonly AiModel[] {
    if (AiModel._loadedModels.size > 0) {
      return Array.from(AiModel._loadedModels.values());
    }

    // Fallback to predefined models
    return [
      AiModel.GPT_3_5_TURBO,
      AiModel.GPT_4,
      AiModel.GPT_4_TURBO,
      AiModel.GPT_4O,
      AiModel.GPT_4O_MINI,
    ];
  }

  /**
   * Finds model by name
   */
  public static findByName(name: string): AiModel | null {
    return AiModel.getAvailableModels().find(model => model.name === name) || null;
  }
}
