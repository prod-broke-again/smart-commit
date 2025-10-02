import { GitChange } from '../entities/GitChange';

/**
 * Interface for git repository analysis service
 */
export interface IGitAnalyzer {
  /**
   * Checks if current directory is a git repository
   */
  isGitRepository(): Promise<boolean>;

  /**
   * Gets all staged changes
   */
  getStagedChanges(): Promise<readonly GitChange[]>;

  /**
   * Gets all unstaged changes
   */
  getUnstagedChanges(): Promise<readonly GitChange[]>;

  /**
   * Gets diff for staged changes
   */
  getStagedDiff(): Promise<string>;

  /**
   * Gets status of working directory
   */
  getStatus(): Promise<GitStatus>;

  /**
   * Stages all changes
   */
  stageAllChanges(): Promise<void>;

  /**
   * Creates and pushes commit
   */
  commitAndPush(message: string): Promise<void>;

  /**
   * Gets current branch name
   */
  getCurrentBranch(): Promise<string>;

  /**
   * Checks if remote exists and is accessible
   */
  hasRemote(): Promise<boolean>;
}

/**
 * Git repository status
 */
export interface GitStatus {
  readonly isRepository: boolean;
  readonly hasStagedChanges: boolean;
  readonly hasUnstagedChanges: boolean;
  readonly currentBranch: string;
  readonly hasRemote: boolean;
  readonly stagedChanges: readonly GitChange[];
  readonly unstagedChanges: readonly GitChange[];
}
