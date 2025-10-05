import chalk from 'chalk';
import { Container } from '../infrastructure/di/Container';
import { IWorkflowOrchestrator, WorkflowOptions } from '../application/interfaces/IWorkflowOrchestrator';
import { IConfigurationManager, GlobalConfig, ProjectConfig } from '../application/interfaces/IConfigurationManager';
import { ModelManager } from '../application/services/ModelManager';
import { ProjectAnalyzer } from '../application/services/ProjectAnalyzer';
import { ServerCommandExecutor } from '../application/services/ServerCommandExecutor';
import { IAiAssistant } from '../domain/services/IAiAssistant';
import { AiModel } from '../domain/entities/AiModel';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Main CLI class for Smart Commit Tool
 */
export class SmartCommitCli {
  private container: Container;
  private workflowOrchestrator: IWorkflowOrchestrator;
  private configManager: IConfigurationManager;
  private modelManager: ModelManager;

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
      this.modelManager = this.container.modelManager;

      // Load models in background (don't wait)
      this.modelManager.loadModels().catch(error => {
        // Silently ignore model loading errors in CLI
        console.debug('Failed to load models:', error.message);
      });
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
   * Refresh models from API
   */
  public async refreshModels(): Promise<void> {
    await this.initialize();

    console.log(chalk.blue('🔄 Refreshing models from API...'));

    try {
      await this.modelManager.refreshModels();
      console.log(chalk.green('✓ Models updated successfully!'));

      const models = AiModel.getAvailableModels();
      console.log(chalk.cyan(`Available models: ${models.length}`));
      for (const model of models.slice(0, 5)) {
        console.log(chalk.gray(`  - ${model.name} (${model.maxTokens} tokens)`));
      }
      if (models.length > 5) {
        console.log(chalk.gray(`  ... and ${models.length - 5} more`));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to refresh models:'), error.message);
      throw error;
    }
  }

  /**
   * List available models
   */
  public async listModels(showAll: boolean = false): Promise<void> {
    await this.initialize();

    // Wait for models to load (with timeout)
    await Promise.race([
      this.modelManager.loadModels(),
      new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
    ]).catch(() => {
      // Ignore errors, will use fallback models
    });

    const models = AiModel.getAvailableModels();
    const currentConfig = await this.configManager.getMergedConfig();

    console.log(chalk.blue(`Available models: ${models.length}`));

    const displayLimit = showAll ? models.length : 15;
    const displayModels = models.slice(0, displayLimit);

    for (const model of displayModels) {
      const isCurrent = model.name === currentConfig.aiModel.name;
      const marker = isCurrent ? '★' : ' ';
      const modelInfo = `${marker} ${chalk.cyan(model.name)} (${model.maxTokens} tokens)`;
      console.log(isCurrent ? chalk.green(modelInfo) : modelInfo);
    }

    if (models.length > displayLimit) {
      console.log(chalk.gray(`  ... and ${models.length - displayLimit} more`));
      console.log(chalk.gray(`Use --all to show all models`));
    }

    const currentModels = this.modelManager.getCurrentModels();
    if (currentModels) {
      console.log(chalk.gray(`\nLoaded from API: ${currentModels.length} models`));
    } else {
      console.log(chalk.yellow('\nUsing fallback models (API not loaded)'));
    }

    console.log(chalk.gray(`\nCurrent model: ${currentConfig.aiModel.name}`));
  }

  /**
   * Clear models cache
   */
  public async clearModelsCache(): Promise<void> {
    await this.initialize();

    await this.modelManager.clearCache();
    console.log(chalk.green('✓ Models cache cleared'));
  }

  /**
   * Generate project configuration
   */
  public async generateConfig(): Promise<void> {
    await this.initialize();

    console.log(chalk.blue('🔧 Generating project configuration...'));
    
    const projectPath = process.cwd();
    const aiAssistant = this.container.get<IAiAssistant>('IAiAssistant');
    const projectAnalyzer = new ProjectAnalyzer(aiAssistant);

    try {
      // Analyze project
      console.log(chalk.gray('Analyzing project structure...'));
      const projectInfo = await projectAnalyzer.analyzeProject(projectPath);
      
      console.log(chalk.green(`✓ Detected project type: ${projectInfo.type}`));
      if (projectInfo.framework) {
        console.log(chalk.green(`✓ Framework: ${projectInfo.framework}`));
      }
      if (projectInfo.packageManager) {
        console.log(chalk.green(`✓ Package manager: ${projectInfo.packageManager}`));
      }

      // Generate server commands config
      console.log(chalk.gray('Generating server commands configuration...'));
      const serverConfig = await projectAnalyzer.generateServerCommandsConfig(projectInfo, projectPath);

      // Create config file
      const configPath = path.join(projectPath, '.smart-commit.json');
      const config = {
        serverCommands: serverConfig,
        projectInfo: {
          type: projectInfo.type,
          framework: projectInfo.framework,
          packageManager: projectInfo.packageManager
        }
      };

      await fs.writeJson(configPath, config, { spaces: 2 });
      
      console.log(chalk.green(`✓ Configuration saved to ${configPath}`));
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.gray('1. Review the generated configuration'));
      console.log(chalk.gray('2. Update server connection details if needed'));
      console.log(chalk.gray('3. Test with: smart-commit deploy'));

    } catch (error) {
      console.error(chalk.red('Failed to generate configuration:'), error);
      throw error;
    }
  }

  /**
   * Execute server commands
   */
  public async deployServer(): Promise<void> {
    await this.initialize();

    const projectPath = process.cwd();
    const configPath = path.join(projectPath, '.smart-commit.json');

    try {
      // Check if config exists
      if (!await fs.pathExists(configPath)) {
        throw new Error('Configuration file not found. Run "smart-commit generate-config" first.');
      }

      // Load configuration
      const config = await fs.readJson(configPath);
      const serverConfig = config.serverCommands;

      if (!serverConfig) {
        throw new Error('Server commands configuration not found in config file.');
      }

      // Validate configuration
      const executor = new ServerCommandExecutor();
      const validationErrors = executor.validateConfig(serverConfig);
      
      if (validationErrors.length > 0) {
        console.error(chalk.red('Configuration validation failed:'));
        validationErrors.forEach(error => console.error(chalk.red(`- ${error}`)));
        throw new Error('Invalid server configuration');
      }

      // Ask for confirmation
      console.log(chalk.yellow('\n⚠️  This will execute commands on the remote server:'));
      console.log(chalk.gray(`Server: ${serverConfig.server?.user}@${serverConfig.server?.host}`));
      
      if (!serverConfig.autoExecute) {
        console.log(chalk.yellow('\nCommands to be executed:'));
        
        const allCommands: { category: string; command: string }[] = [];
        if (serverConfig.commands.git) {
          serverConfig.commands.git.forEach((cmd: string) => allCommands.push({ category: 'git', command: cmd }));
        }
        if (serverConfig.commands.frontend) {
          serverConfig.commands.frontend.forEach((cmd: string) => allCommands.push({ category: 'frontend', command: cmd }));
        }
        if (serverConfig.commands.backend) {
          serverConfig.commands.backend.forEach((cmd: string) => allCommands.push({ category: 'backend', command: cmd }));
        }
        if (serverConfig.commands.database) {
          serverConfig.commands.database.forEach((cmd: string) => allCommands.push({ category: 'database', command: cmd }));
        }
        if (serverConfig.commands.docker) {
          serverConfig.commands.docker.forEach((cmd: string) => allCommands.push({ category: 'docker', command: cmd }));
        }
        if (serverConfig.commands.system) {
          serverConfig.commands.system.forEach((cmd: string) => allCommands.push({ category: 'system', command: cmd }));
        }

        allCommands.forEach(({ category, command }, index) => {
          console.log(chalk.gray(`  ${index + 1}. [${category}] ${command}`));
        });

        console.log(chalk.yellow('\nContinue? [y/N]'));
        // For now, auto-continue (can be made interactive later)
      }

      // Execute commands
      const results = await executor.executeCommands(serverConfig);
      
      // Show summary
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      console.log(chalk.blue(`\n📊 Execution Summary:`));
      console.log(chalk.green(`✓ Successful: ${successCount}/${totalCount}`));
      console.log(chalk.red(`✗ Failed: ${totalCount - successCount}/${totalCount}`));

      if (successCount === totalCount) {
        console.log(chalk.green('\n🎉 All commands executed successfully!'));
      } else {
        console.log(chalk.yellow('\n⚠️  Some commands failed. Check the output above for details.'));
      }

    } catch (error) {
      console.error(chalk.red('Deployment failed:'), error);
      throw error;
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
