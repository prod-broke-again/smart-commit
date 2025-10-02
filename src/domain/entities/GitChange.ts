/**
 * Represents a single file change in git
 */
export class GitChange {
  private constructor(
    private readonly _filePath: string,
    private readonly _changeType: GitChangeType,
    private readonly _linesAdded: number,
    private readonly _linesDeleted: number
  ) {}

  public static create(
    filePath: string,
    changeType: GitChangeType,
    linesAdded: number = 0,
    linesDeleted: number = 0
  ): GitChange {
    if (!filePath || filePath.trim().length === 0) {
      throw new Error('File path is required');
    }

    return new GitChange(
      filePath.trim(),
      changeType,
      Math.max(0, linesAdded),
      Math.max(0, linesDeleted)
    );
  }

  public get filePath(): string {
    return this._filePath;
  }

  public get changeType(): GitChangeType {
    return this._changeType;
  }

  public get linesAdded(): number {
    return this._linesAdded;
  }

  public get linesDeleted(): number {
    return this._linesDeleted;
  }

  public get totalLinesChanged(): number {
    return this._linesAdded + this._linesDeleted;
  }

  public get fileExtension(): string {
    const lastDotIndex = this._filePath.lastIndexOf('.');
    return lastDotIndex > 0 ? this._filePath.substring(lastDotIndex + 1) : '';
  }

  public get isTestFile(): boolean {
    return this._filePath.includes('/test/') ||
           this._filePath.includes('/tests/') ||
           this._filePath.includes('/__tests__/') ||
           this._filePath.includes('.test.') ||
           this._filePath.includes('.spec.');
  }

  public get isConfigFile(): boolean {
    const configPatterns = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'tsconfig.json',
      '.eslintrc',
      '.prettierrc',
      'jest.config',
      '.gitignore',
      'README.md',
      'LICENSE'
    ];

    return configPatterns.some(pattern => this._filePath.includes(pattern)) ||
           this._filePath.startsWith('.');
  }
}

/**
 * Types of git changes
 */
export enum GitChangeType {
  ADDED = 'added',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
}
