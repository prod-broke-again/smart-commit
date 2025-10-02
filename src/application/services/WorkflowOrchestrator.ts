import chalk from 'chalk';
import ora from 'ora';
import { IGitAnalyzer } from '../../domain/services/IGitAnalyzer';
import { ICommitGenerator, CommitGenerationOptions } from '../../domain/services/ICommitGenerator';
import { IConfigurationManager } from '../interfaces/IConfigurationManager';
import { IWorkflowOrchestrator, WorkflowOptions } from '../interfaces/IWorkflowOrchestrator';

/**
 * Workflow orchestrator implementation
 */
export class WorkflowOrchestrator implements IWorkflowOrchestrator {
  constructor(
    private readonly gitAnalyzer: IGitAnalyzer,
    private readonly commitGenerator: ICommitGenerator,
    private readonly configManager: IConfigurationManager
  ) {}

  public async runStandardWorkflow(options: WorkflowOptions = {}): Promise<void> {
    const spinner = ora('Analyzing repository...').start();

    try {
      // Check if we're in a git repository
      const isGitRepo = await this.gitAnalyzer.isGitRepository();
      if (!isGitRepo) {
        throw new Error('Not a git repository. Please run this command from a git repository.');
      }

      spinner.text = 'Checking for changes...';

      // Get repository status
      const status = await this.gitAnalyzer.getStatus();

      if (!status.hasStagedChanges && !status.hasUnstagedChanges) {
        throw new Error('No changes to commit. Stage your changes first with "git add".');
      }

      // Stage all changes if there are unstaged changes
      if (status.hasUnstagedChanges) {
        spinner.text = 'Staging changes...';
        await this.gitAnalyzer.stageAllChanges();
      }

      spinner.text = 'Generating commit message...';

      // Get merged configuration
      const config = await this.configManager.getMergedConfig();

      // Get staged changes
      const stagedChanges = await this.gitAnalyzer.getStagedChanges();

      // Get diff if full analysis mode is enabled
      const diff = config.analysisMode === 'full' ? await this.gitAnalyzer.getStagedDiff() : undefined;

      // Generate commit message
      const generationOptions: CommitGenerationOptions = {
        model: config.aiModel,
        language: config.language,
        maxLength: config.maxCommitLength,
        includeScope: config.includeScope,
        customInstructions: config.customInstructions,
        analysisMode: config.analysisMode,
      };

      const commitMessage = await this.commitGenerator.generateCommitMessage(
        stagedChanges,
        diff,
        generationOptions
      );

      spinner.text = 'Creating commit...';

      // Create commit and push
      await this.gitAnalyzer.commitAndPush(commitMessage.toString());

      spinner.succeed('Commit created and pushed successfully!');

      if (options.verbose) {
        console.log(chalk.green('\nCommit details:'));
        console.log(chalk.cyan(`Message: ${commitMessage.toString()}`));
        console.log(chalk.cyan(`Files changed: ${stagedChanges.length}`));
      }

    } catch (error) {
      spinner.fail('Workflow failed');
      throw error;
    }
  }

  public async runDryRunWorkflow(): Promise<void> {
    const spinner = ora('Analyzing repository...').start();

    try {
      // Check if we're in a git repository
      const isGitRepo = await this.gitAnalyzer.isGitRepository();
      if (!isGitRepo) {
        throw new Error('Not a git repository. Please run this command from a git repository.');
      }

      spinner.text = 'Checking for changes...';

      // Get repository status
      const status = await this.gitAnalyzer.getStatus();

      if (!status.hasStagedChanges && !status.hasUnstagedChanges) {
        throw new Error('No changes to commit. Stage your changes first with "git add".');
      }

      // Get staged changes (or all changes if none staged)
      let changesToAnalyze = status.stagedChanges;
      if (changesToAnalyze.length === 0) {
        changesToAnalyze = status.unstagedChanges;
      }

      spinner.text = 'Generating commit message...';

      // Get merged configuration
      const config = await this.configManager.getMergedConfig();

      // Get diff if full analysis mode is enabled
      const diff = config.analysisMode === 'full' ? await this.gitAnalyzer.getStagedDiff() : undefined;

      // Generate commit message
      const generationOptions: CommitGenerationOptions = {
        model: config.aiModel,
        language: config.language,
        maxLength: config.maxCommitLength,
        includeScope: config.includeScope,
        customInstructions: config.customInstructions,
        analysisMode: config.analysisMode,
      };

      const commitMessage = await this.commitGenerator.generateCommitMessage(
        changesToAnalyze,
        diff,
        generationOptions
      );

      spinner.succeed('Dry run completed');

      console.log(chalk.green('\nGenerated commit message:'));
      console.log(chalk.cyan(commitMessage.toString()));

      console.log(chalk.green('\nFiles that would be committed:'));
      for (const change of changesToAnalyze) {
        console.log(chalk.gray(`  ${change.changeType} ${change.filePath}`));
      }

      console.log(chalk.yellow('\nTo commit these changes, run: git add . && smart-commit'));

    } catch (error) {
      spinner.fail('Dry run failed');
      throw error;
    }
  }

  public async runGenerateOnlyWorkflow(): Promise<string> {
    const spinner = ora('Analyzing repository...').start();

    try {
      // Check if we're in a git repository
      const isGitRepo = await this.gitAnalyzer.isGitRepository();
      if (!isGitRepo) {
        throw new Error('Not a git repository. Please run this command from a git repository.');
      }

      spinner.text = 'Checking for changes...';

      // Get repository status
      const status = await this.gitAnalyzer.getStatus();

      if (!status.hasStagedChanges && !status.hasUnstagedChanges) {
        throw new Error('No changes to commit. Stage your changes first with "git add".');
      }

      // Get staged changes (or all changes if none staged)
      let changesToAnalyze = status.stagedChanges;
      if (changesToAnalyze.length === 0) {
        changesToAnalyze = status.unstagedChanges;
      }

      spinner.text = 'Generating commit message...';

      // Get merged configuration
      const config = await this.configManager.getMergedConfig();

      // Get diff if full analysis mode is enabled
      const diff = config.analysisMode === 'full' ? await this.gitAnalyzer.getStagedDiff() : undefined;

      // Generate commit message
      const generationOptions: CommitGenerationOptions = {
        model: config.aiModel,
        language: config.language,
        maxLength: config.maxCommitLength,
        includeScope: config.includeScope,
        customInstructions: config.customInstructions,
        analysisMode: config.analysisMode,
      };

      const commitMessage = await this.commitGenerator.generateCommitMessage(
        changesToAnalyze,
        diff,
        generationOptions
      );

      spinner.succeed('Message generated');

      const message = commitMessage.toString();
      console.log(chalk.green('\nGenerated commit message:'));
      console.log(chalk.cyan(message));

      return message;

    } catch (error) {
      spinner.fail('Generation failed');
      throw error;
    }
  }

  public async runCustomMessageWorkflow(message: string, _options: WorkflowOptions = {}): Promise<void> {
    const spinner = ora('Analyzing repository...').start();

    try {
      // Check if we're in a git repository
      const isGitRepo = await this.gitAnalyzer.isGitRepository();
      if (!isGitRepo) {
        throw new Error('Not a git repository. Please run this command from a git repository.');
      }

      spinner.text = 'Checking for changes...';

      // Get repository status
      const status = await this.gitAnalyzer.getStatus();

      if (!status.hasStagedChanges && !status.hasUnstagedChanges) {
        throw new Error('No changes to commit. Stage your changes first with "git add".');
      }

      // Stage all changes if there are unstaged changes
      if (status.hasUnstagedChanges) {
        spinner.text = 'Staging changes...';
        await this.gitAnalyzer.stageAllChanges();
      }

      // Validate message format if required
      if (!_options.skipValidation) {
        const config = await this.configManager.getProjectConfig();
        if (config.conventionalCommitsOnly) {
          // TODO: Add validation logic
        }
      }

      spinner.text = 'Creating commit...';

      // Create commit and push
      await this.gitAnalyzer.commitAndPush(message);

      spinner.succeed('Commit created with custom message!');

      if (_options.verbose) {
        console.log(chalk.green('\nCommit details:'));
        console.log(chalk.cyan(`Message: ${message}`));
      }

    } catch (error) {
      spinner.fail('Custom message workflow failed');
      throw error;
    }
  }
}
