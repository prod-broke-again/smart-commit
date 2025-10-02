import { CommitMessage } from '../entities/CommitMessage';
import { GitChange } from '../entities/GitChange';
import { AiModel } from '../entities/AiModel';

/**
 * Interface for commit message generation service
 */
export interface ICommitGenerator {
  /**
   * Generates a commit message based on git changes
   */
  generateCommitMessage(
    changes: readonly GitChange[],
    options?: CommitGenerationOptions
  ): Promise<CommitMessage>;

  /**
   * Generates a release version title
   */
  generateReleaseTitle(
    changes: readonly GitChange[],
    version: string,
    options?: ReleaseGenerationOptions
  ): Promise<string>;

  /**
   * Generates a release description with categorized changes
   */
  generateReleaseDescription(
    changes: readonly GitChange[],
    version: string,
    options?: ReleaseGenerationOptions
  ): Promise<string>;
}

/**
 * Options for commit message generation
 */
export interface CommitGenerationOptions {
  readonly model?: AiModel;
  readonly language?: string;
  readonly maxLength?: number;
  readonly includeScope?: boolean;
  readonly customInstructions?: string | null;
}

/**
 * Options for release generation
 */
export interface ReleaseGenerationOptions {
  readonly model?: AiModel;
  readonly language?: string;
  readonly includeBreakingChanges?: boolean;
  readonly includeContributors?: boolean;
  readonly customInstructions?: string;
}
