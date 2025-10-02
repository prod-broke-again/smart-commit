import { CommitMessage } from '../../domain/entities/CommitMessage';

/**
 * Interface for workflow orchestration
 */
export interface IWorkflowOrchestrator {
  /**
   * Runs the standard commit workflow
   */
  runStandardWorkflow(options?: WorkflowOptions): Promise<void>;

  /**
   * Runs dry-run workflow (shows what would be committed)
   */
  runDryRunWorkflow(options?: WorkflowOptions): Promise<void>;

  /**
   * Runs generate-only workflow (only generates message)
   */
  runGenerateOnlyWorkflow(options?: WorkflowOptions): Promise<string>;

  /**
   * Runs custom message workflow
   */
  runCustomMessageWorkflow(message: string, options?: WorkflowOptions): Promise<void>;
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
  readonly skipValidation?: boolean;
  readonly force?: boolean;
  readonly verbose?: boolean;
  readonly customInstructions?: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  readonly success: boolean;
  readonly commitMessage?: CommitMessage;
  readonly error?: Error;
  readonly generatedMessage?: string;
}
