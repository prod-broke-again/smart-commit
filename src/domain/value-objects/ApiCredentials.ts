/**
 * Value object representing API credentials for AI services
 */
export class ApiCredentials {
  private constructor(
    private readonly _apiKey: string,
    private readonly _provider: string
  ) {}

  public static create(apiKey: string, provider: string = 'gptunnel'): ApiCredentials {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    if (!provider || provider.trim().length === 0) {
      throw new Error('Provider is required');
    }

    // Basic validation for API key format
    if (apiKey.length < 10) {
      throw new Error('API key appears to be too short');
    }

    return new ApiCredentials(apiKey.trim(), provider.trim().toLowerCase());
  }

  public get apiKey(): string {
    return this._apiKey;
  }

  public get provider(): string {
    return this._provider;
  }

  /**
   * Returns masked API key for logging (shows first 4 and last 4 characters)
   */
  public getMaskedKey(): string {
    if (this._apiKey.length <= 8) {
      return '*'.repeat(this._apiKey.length);
    }

    const start = this._apiKey.substring(0, 4);
    const end = this._apiKey.substring(this._apiKey.length - 4);
    const mask = '*'.repeat(this._apiKey.length - 8);

    return `${start}${mask}${end}`;
  }

  /**
   * Validates if credentials are properly formatted
   */
  public isValid(): boolean {
    return this._apiKey.length >= 10 && this._provider.length > 0;
  }

  public equals(other: ApiCredentials): boolean {
    return this._apiKey === other._apiKey && this._provider === other._provider;
  }
}
