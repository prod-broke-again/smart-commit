// Import GitChange for type checking
import { GitChange, GitChangeType } from '../entities/GitChange';

/**
 * Value object representing commit types according to conventional commits
 */
export class CommitType {
  private constructor(
    private readonly _value: string,
    private readonly _description: string,
    private readonly _changelogTitle: string
  ) {}

  public static readonly FEAT = new CommitType('feat', 'A new feature', 'Features');
  public static readonly FIX = new CommitType('fix', 'A bug fix', 'Bug Fixes');
  public static readonly DOCS = new CommitType('docs', 'Documentation only changes', 'Documentation');
  public static readonly STYLE = new CommitType('style', 'Changes that do not affect the meaning of the code', 'Styles');
  public static readonly REFACTOR = new CommitType('refactor', 'A code change that neither fixes a bug nor adds a feature', 'Code Refactoring');
  public static readonly TEST = new CommitType('test', 'Adding missing tests or correcting existing tests', 'Tests');
  public static readonly CHORE = new CommitType('chore', 'Changes to the build process or auxiliary tools', 'Chores');
  public static readonly PERF = new CommitType('perf', 'A code change that improves performance', 'Performance Improvements');
  public static readonly CI = new CommitType('ci', 'Changes to CI configuration files and scripts', 'Continuous Integration');
  public static readonly BUILD = new CommitType('build', 'Changes that affect the build system or external dependencies', 'Build System');
  public static readonly REVERT = new CommitType('revert', 'Reverts a previous commit', 'Reverts');

  public get value(): string {
    return this._value;
  }

  public get description(): string {
    return this._description;
  }

  public get changelogTitle(): string {
    return this._changelogTitle;
  }

  public toString(): string {
    return this._value;
  }

  public equals(other: CommitType): boolean {
    return this._value === other._value;
  }

  /**
   * Determines commit type based on file changes
   */
  public static determineFromChanges(changes: readonly GitChange[]): CommitType {
    const hasTests = changes.some(change => change.isTestFile);
    const hasConfig = changes.some(change => change.isConfigFile);
    const hasCode = changes.some(change =>
      !change.isTestFile && !change.isConfigFile && change.changeType !== GitChangeType.DELETED
    );

    if (hasTests && !hasCode && !hasConfig) {
      return CommitType.TEST;
    }

    if (hasConfig && !hasCode) {
      return changes.some(change => change.filePath.includes('package.json'))
        ? CommitType.BUILD
        : CommitType.CHORE;
    }

    // Default to feat for new features, could be enhanced with more analysis
    return CommitType.FEAT;
  }

  /**
   * Gets all available commit types
   */
  public static getAll(): readonly CommitType[] {
    return [
      CommitType.FEAT,
      CommitType.FIX,
      CommitType.DOCS,
      CommitType.STYLE,
      CommitType.REFACTOR,
      CommitType.TEST,
      CommitType.CHORE,
      CommitType.PERF,
      CommitType.CI,
      CommitType.BUILD,
      CommitType.REVERT,
    ];
  }

  /**
   * Finds commit type by value
   */
  public static fromString(value: string): CommitType | null {
    return CommitType.getAll().find(type => type.value === value.toLowerCase()) || null;
  }
}
