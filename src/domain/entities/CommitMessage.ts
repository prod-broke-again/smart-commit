/**
 * Represents a commit message with conventional commit format
 */
export class CommitMessage {
  private constructor(
    private readonly _type: string,
    private readonly _scope: string | null,
    private readonly _description: string,
    private readonly _body: string | null,
    private readonly _footer: string | null,
    private readonly _isBreaking: boolean
  ) {}

  public static create(
    type: string,
    description: string,
    scope?: string,
    body?: string,
    footer?: string,
    isBreaking: boolean = false
  ): CommitMessage {
    if (!type || type.trim().length === 0) {
      throw new Error('Commit type is required');
    }

    if (!description || description.trim().length === 0) {
      throw new Error('Commit description is required');
    }

    return new CommitMessage(
      type.trim().toLowerCase(),
      scope?.trim() || null,
      description.trim(),
      body?.trim() || null,
      footer?.trim() || null,
      isBreaking
    );
  }

  public get type(): string {
    return this._type;
  }

  public get scope(): string | null {
    return this._scope;
  }

  public get description(): string {
    return this._description;
  }

  public get body(): string | null {
    return this._body;
  }

  public get footer(): string | null {
    return this._footer;
  }

  public get isBreaking(): boolean {
    return this._isBreaking;
  }

  /**
   * Returns the full commit message in conventional commit format
   */
  public toString(): string {
    const scope = this._scope ? `(${this._scope})` : '';
    const breaking = this._isBreaking ? '!' : '';
    const header = `${this._type}${scope}${breaking}: ${this._description}`;

    const parts = [header];

    if (this._body) {
      parts.push('', this._body);
    }

    if (this._footer) {
      parts.push('', this._footer);
    }

    return parts.join('\n');
  }
}
