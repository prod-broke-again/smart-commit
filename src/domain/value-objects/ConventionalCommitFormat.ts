/**
 * Value object representing conventional commit format specification
 */
export class ConventionalCommitFormat {
  private constructor(
    private readonly _pattern: RegExp,
    private readonly _maxHeaderLength: number,
    private readonly _maxBodyLineLength: number
  ) {}

  public static readonly STANDARD = new ConventionalCommitFormat(
    /^(\w+)(\(.+\))?!?: (.+)$/,
    72,
    100
  );

  public get pattern(): RegExp {
    return this._pattern;
  }

  public get maxHeaderLength(): number {
    return this._maxHeaderLength;
  }

  public get maxBodyLineLength(): number {
    return this._maxBodyLineLength;
  }

  /**
   * Validates if a commit message follows conventional commit format
   */
  public validate(message: string): ConventionalCommitValidation {
    const lines = message.split('\n');
    const header = lines[0];

    if (!header) {
      return {
        isValid: false,
        errors: ['Commit message cannot be empty'],
      };
    }

    const errors: string[] = [];

    // Check header length
    if (header.length > this._maxHeaderLength) {
      errors.push(`Header is too long (${header.length} > ${this._maxHeaderLength})`);
    }

    // Check header format
    const match = header.match(this._pattern);
    if (!match) {
      errors.push('Header does not match conventional commit format: type(scope): description');
    }

    // Check body line lengths
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line && line.length > this._maxBodyLineLength) {
          errors.push(`Line ${i + 1} is too long (${line.length} > ${this._maxBodyLineLength})`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parses conventional commit message
   */
  public parse(message: string): ConventionalCommitParseResult | null {
    const lines = message.split('\n');
    const header = lines[0];

    if (!header) {
      return null;
    }

    const match = header.match(this._pattern);
    if (!match) {
      return null;
    }

    const [, type, scopeWithParens, description] = match;
    const scope = scopeWithParens ? scopeWithParens.slice(1, -1) : null; // Remove parentheses
    const isBreaking = header.includes('!');

    let body: string | null = null;
    let footer: string | null = null;

    if (lines.length > 1) {
      // Find footer (starts with BREAKING CHANGE or type:)
      const footerIndex = lines.findIndex((line, index) =>
        index > 0 && line && (line.startsWith('BREAKING CHANGE:') || /^\w+(\(.+\))?!?:/.test(line))
      );

      if (footerIndex > 0) {
        body = lines.slice(1, footerIndex).join('\n').trim();
        footer = lines.slice(footerIndex).join('\n').trim();
      } else {
        body = lines.slice(1).join('\n').trim();
      }

      if (!body) {
        body = null;
      }
    }

    return {
      type,
      scope,
      description,
      body,
      footer,
      isBreaking,
    };
  }
}

/**
 * Result of conventional commit validation
 */
export interface ConventionalCommitValidation {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Result of conventional commit parsing
 */
export interface ConventionalCommitParseResult {
  readonly type: string;
  readonly scope: string | null;
  readonly description: string | undefined;
  readonly body: string | null;
  readonly footer: string | null;
  readonly isBreaking: boolean;
}
