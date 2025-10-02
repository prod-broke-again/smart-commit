import chalk from 'chalk';
import { Container } from '../infrastructure/di/Container';
import { IWorkflowOrchestrator, WorkflowOptions } from '../application/interfaces/IWorkflowOrchestrator';
import { IConfigurationManager, GlobalConfig, ProjectConfig } from '../application/interfaces/IConfigurationManager';

/**
 * Main CLI class for Smart Commit Tool
 */
export class SmartCommitCli {
  private container: Container;
  private workflowOrchestrator: IWorkflowOrchestrator;
  private configManager: IConfigurationManager;

  constructor() {
    this.container = Container.getInstance();
  }

  /**
   * Initializes the CLI
   */
  private async initialize(): Promise<void> {
    if (!this.workflowOrchestrator) {
      await this.container.initialize();
      this.workflowOrchestrator = this.container.workflowOrchestrator;
      this.configManager = this.container.configManager;
    }
  }

  /**
   * Run standard commit workflow
   */
  public async runStandard(options: WorkflowOptions = {}): Promise<void> {
    await this.initialize();
    await this.workflowOrchestrator.runStandardWorkflow(options);
  }

  /**
   * Run dry-run workflow
   */
  public async runDryRun(): Promise<void> {
    await this.initialize();
    await this.workflowOrchestrator.runDryRunWorkflow();
  }

  /**
   * Run generate-only workflow
   */
  public async runGenerateOnly(): Promise<void> {
    await this.initialize();
    const message = await this.workflowOrchestrator.runGenerateOnlyWorkflow();
    console.log(message);
  }

  /**
   * Run workflow with custom message
   */
  public async runWithCustomMessage(message: string, options: WorkflowOptions = {}): Promise<void> {
    await this.initialize();
    await this.workflowOrchestrator.runCustomMessageWorkflow(message, options);
  }

  /**
   * Set configuration value
   */
  public async setConfig(key: string, value: string, global: boolean = false): Promise<void> {
    await this.initialize();
    const parsedValue = this.parseConfigValue(value);

    if (global) {
      const config: Partial<GlobalConfig> = { [key]: parsedValue };
      await this.configManager.saveGlobalConfig(config);
      console.log(chalk.green(`Global config ${key} set to ${parsedValue}`));
    } else {
      const config: Partial<ProjectConfig> = { [key]: parsedValue };
      await this.configManager.saveProjectConfig(config);
      console.log(chalk.green(`Project config ${key} set to ${parsedValue}`));
    }
  }

  /**
   * Get configuration value
   */
  public async getConfig(key: string, global: boolean = false): Promise<unknown> {
    await this.initialize();
    if (global) {
      const config = await this.configManager.getGlobalConfig();
      return (config as any)[key];
    } else {
      const mergedConfig = await this.configManager.getMergedConfig();
      return (mergedConfig as any)[key];
    }
  }

  /**
   * List all configuration
   */
  public async listConfig(global: boolean = false): Promise<void> {
    await this.initialize();
    if (global) {
      const config = await this.configManager.getGlobalConfig();
      console.log(chalk.blue('Global configuration:'));
      this.printConfig(config);
    } else {
      const config = await this.configManager.getMergedConfig();
      console.log(chalk.blue('Merged configuration (project + global):'));
      this.printConfig(config);
    }
  }

  /**
   * Run initial setup
   */
  public async runSetup(): Promise<void> {
    await this.initialize();
    console.log(chalk.blue('🚀 Smart Commit Tool Setup'));
    console.log();

    // Check if API key is already configured
    const globalConfig = await this.configManager.getGlobalConfig();

    if (!globalConfig.apiKey) {
      console.log(chalk.yellow('API key not configured.'));
      console.log('Get your API key from https://gptunnel.ru/profile/business');
      console.log();

      // In a real implementation, you might use readline for interactive input
      console.log(chalk.cyan('Run the following command to set your API key:'));
      console.log(chalk.green('smart-commit config --global --set apiKey=YOUR_API_KEY'));
      console.log();
    } else {
      console.log(chalk.green('✓ API key is configured'));
    }

    // Check current directory
    const gitAnalyzer = this.container.gitAnalyzer;
    const isGitRepo = await gitAnalyzer.isGitRepository();

    if (isGitRepo) {
      console.log(chalk.green('✓ Current directory is a git repository'));

      const status = await gitAnalyzer.getStatus();
      console.log(chalk.cyan(`Current branch: ${status.currentBranch}`));
      console.log(chalk.cyan(`Has remote: ${status.hasRemote ? 'Yes' : 'No'}`));
    } else {
      console.log(chalk.yellow('⚠ Current directory is not a git repository'));
      console.log('Make sure to run smart-commit from a git repository');
    }

    console.log();
    console.log(chalk.green('Setup complete!'));
    console.log();
    console.log(chalk.cyan('Usage examples:'));
    console.log('  smart-commit                    # Standard workflow');
    console.log('  smart-commit --dry-run         # Preview changes');
    console.log('  smart-commit --generate-only   # Only generate message');
    console.log('  smart-commit -m "feat: add new feature"  # Custom message');
  }

  private parseConfigValue(value: string): unknown {
    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Try to parse as number
    const numValue = Number(value);
    if (!isNaN(numValue)) return numValue;

    // Return as string
    return value;
  }

  private printConfig(config: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(config)) {
      const displayValue = key.includes('apiKey') && typeof value === 'string'
        ? this.maskApiKey(value)
        : String(value);
      console.log(`  ${key}: ${displayValue}`);
    }
  }

  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }

    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const mask = '*'.repeat(apiKey.length - 8);

    return `${start}${mask}${end}`;
  }
}
