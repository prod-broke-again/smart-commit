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
import * as readline from 'readline';

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
   * Supports nested keys like "apiKeys.timeweb" or "apiKeys.openai"
   */
  public async setConfig(key: string, value: string, global: boolean = false): Promise<void> {
    await this.initialize();
    const parsedValue = this.parseConfigValue(value);

    // Handle nested keys (e.g., "apiKeys.timeweb")
    if (key.includes('.')) {
      const parts = key.split('.');
      const rootKey = parts[0];
      const nestedKey = parts.slice(1).join('.');

      if (global) {
        const currentConfig = await this.configManager.getGlobalConfig();
        const rootValue = (currentConfig as any)[rootKey] || {};
        const updatedRoot = { ...rootValue, [nestedKey]: parsedValue };
        const config: Partial<GlobalConfig> = { [rootKey]: updatedRoot };
        await this.configManager.saveGlobalConfig(config);
        console.log(chalk.green(`Global config ${key} set to ${this.maskApiKeyIfNeeded(parsedValue as string)}`));
      } else {
        const currentConfig = await this.configManager.getProjectConfig();
        const rootValue = (currentConfig as any)[rootKey] || {};
        const updatedRoot = { ...rootValue, [nestedKey]: parsedValue };
        const config: Partial<ProjectConfig> = { [rootKey]: updatedRoot };
        await this.configManager.saveProjectConfig(config);
        console.log(chalk.green(`Project config ${key} set to ${this.maskApiKeyIfNeeded(parsedValue as string)}`));
      }
    } else {
      if (global) {
        const config: Partial<GlobalConfig> = { [key]: parsedValue };
        await this.configManager.saveGlobalConfig(config);
        console.log(chalk.green(`Global config ${key} set to ${this.maskApiKeyIfNeeded(parsedValue as string)}`));
      } else {
        const config: Partial<ProjectConfig> = { [key]: parsedValue };
        await this.configManager.saveProjectConfig(config);
        console.log(chalk.green(`Project config ${key} set to ${this.maskApiKeyIfNeeded(parsedValue as string)}`));
      }
    }
  }

  private maskApiKeyIfNeeded(value: string): string {
    if (typeof value === 'string' && value.length > 20) {
      return this.maskApiKey(value);
    }
    return String(value);
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

      const config = await this.configManager.getMergedConfig();
      const models = AiModel.getAvailableModels(config.defaultProvider);
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

    const currentConfig = await this.configManager.getMergedConfig();
    const models = AiModel.getAvailableModels(currentConfig.defaultProvider);

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
   * Execute smart server commands based on changes
   */
  public async deploySmart(): Promise<void> {
    await this.initialize();

    const projectPath = process.cwd();
    const configPath = path.join(projectPath, '.smart-commit.json');

    try {
      // Check if config exists
      if (!await fs.pathExists(configPath)) {
        throw new Error('Configuration file not found. Run "smart-commit generate-config" first.');
      }

      // Load configuration
      const configData = await fs.readJson(configPath);
      const serverConfig = configData.serverCommands;

      if (!serverConfig || !serverConfig.enabled) {
        throw new Error('Server commands are disabled in configuration');
      }

      // Validate configuration
      const executor = this.container.get<ServerCommandExecutor>('ServerCommandExecutor');
      const validationErrors = executor.validateConfig(serverConfig);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid server configuration: ${validationErrors.join(', ')}`);
      }

      console.log(chalk.blue('🔍 Analyzing changes for smart deployment...'));

      // Analyze changes
      const projectAnalyzer = this.container.get<ProjectAnalyzer>('ProjectAnalyzer');
      const analysis = await projectAnalyzer.analyzeChangesForSmartDeploy(projectPath);

      // Show analysis results
      console.log(chalk.green('\n📊 Analysis Results:'));
      analysis.reasons.forEach(reason => {
        console.log(chalk.gray(`  • ${reason}`));
      });

      // Generate smart commands
      const smartCommands = projectAnalyzer.generateSmartDeployCommands(analysis, serverConfig);

      if (smartCommands.length === 0) {
        console.log(chalk.yellow('✅ No deployment needed - no changes detected!'));
        return;
      }

      console.log(chalk.yellow(`\n⚠️  Smart deployment will execute ${smartCommands.length} commands:`));
      console.log(chalk.gray(`Server: ${serverConfig.server?.user}@${serverConfig.server?.host}`));
      
      smartCommands.forEach((command, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${command}`));
      });

      console.log(chalk.yellow('\nContinue? [y/N]'));
      
      // Ask for user confirmation
      const shouldContinue = await this.askForConfirmation();
      if (!shouldContinue) {
        console.log(chalk.red('Smart deployment cancelled by user.'));
        return;
      }

      // Execute smart commands
      console.log(chalk.blue(`\n🚀 Executing ${smartCommands.length} smart commands...`));
      
      const results = await executor.executeSmartCommands(serverConfig, smartCommands, serverConfig.projectPath);
      
      // Show summary
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      console.log(chalk.blue(`\n📊 Execution Summary:`));
      console.log(chalk.green(`✓ Successful: ${successCount}/${totalCount}`));
      console.log(chalk.red(`✗ Failed: ${totalCount - successCount}/${totalCount}`));

      if (successCount === totalCount) {
        console.log(chalk.green('\n🎉 Smart deployment completed successfully!'));
      } else {
        console.log(chalk.red('\n❌ Some commands failed. Check the output above.'));
      }

    } catch (error) {
      console.error(chalk.red(`Smart deployment failed: ${error instanceof Error ? error.message : String(error)}`));
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
        
        // Ask for user confirmation
        const shouldContinue = await this.askForConfirmation();
        if (!shouldContinue) {
          console.log(chalk.red('Deployment cancelled by user.'));
          return;
        }
      }

      // Execute commands
      const results = await executor.executeCommands(serverConfig, serverConfig.projectPath);
      
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
    const hasApiKey = globalConfig.apiKey || (globalConfig.apiKeys && Object.keys(globalConfig.apiKeys).length > 0);

    if (!hasApiKey) {
      console.log(chalk.yellow('API key not configured.'));
      console.log('Get your API key from your provider');
      console.log();

      // In a real implementation, you might use readline for interactive input
      console.log(chalk.cyan('Run the following command to set your API key:'));
      console.log(chalk.green('smart-commit config --global --set apiKey=YOUR_API_KEY'));
      console.log(chalk.green('  or for specific provider:'));
      console.log(chalk.green('smart-commit config --global --set apiKeys.openai=YOUR_OPENAI_KEY'));
      console.log(chalk.green('smart-commit config --global --set apiKeys.timeweb=YOUR_TIMEWEB_KEY'));
      console.log();
    } else {
      console.log(chalk.green('✓ API key is configured'));
      if (globalConfig.apiKeys && Object.keys(globalConfig.apiKeys).length > 0) {
        const providers = Object.keys(globalConfig.apiKeys).join(', ');
        console.log(chalk.cyan(`  Configured providers: ${providers}`));
      }
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
      let displayValue: string;
      
      if (key === 'apiKeys' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Special handling for apiKeys object
        const apiKeys = value as Record<string, string>;
        const maskedKeys: string[] = [];
        for (const [provider, keyValue] of Object.entries(apiKeys)) {
          maskedKeys.push(`${provider}: ${this.maskApiKey(keyValue)}`);
        }
        displayValue = `{ ${maskedKeys.join(', ')} }`;
      } else if (key.includes('apiKey') && typeof value === 'string') {
        displayValue = this.maskApiKey(value);
      } else {
        displayValue = String(value);
      }
      
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

  /**
   * Install Git hooks
   */
  public async installHooks(): Promise<void> {
    await this.initialize();
    
    const { GitHooksManager } = await import('../infrastructure/git/GitHooksManager');
    const hooksManager = new GitHooksManager();
    
    await hooksManager.installCommitMsgHook();
  }

  /**
   * Uninstall Git hooks
   */
  public async uninstallHooks(): Promise<void> {
    await this.initialize();
    
    const { GitHooksManager } = await import('../infrastructure/git/GitHooksManager');
    const hooksManager = new GitHooksManager();
    
    await hooksManager.uninstallCommitMsgHook();
  }

  /**
   * Handle commit-msg hook
   */
  public async handleCommitMsgHook(commitMsgFile: string): Promise<void> {
    await this.initialize();
    
    const fs = await import('fs-extra');
    const commitMessage = await fs.readFile(commitMsgFile, 'utf-8');
    
    const config = await this.configManager.getMergedConfig();
    const { CommitMessageValidator } = await import('../application/services/CommitMessageValidator');
    const aiAssistant = this.container.get<IAiAssistant>('IAiAssistant');
    const validator = new CommitMessageValidator(aiAssistant);
    
    const result = await validator.validateAndImprove(commitMessage.trim(), {
      autoImprove: true,
      language: config['language'] as string || 'en',
      maxLength: config.maxCommitLength,
      strict: config.conventionalCommitsOnly ?? true,
    });
    
    if (!result.isValid) {
      console.error('\n❌ Commit message validation failed:');
      result.errors.forEach(error => console.error(`  - ${error}`));
      console.error('\n💡 Tip: Use "smart-commit" to generate a proper commit message');
      process.exit(1);
    }
    
    if (result.improvedMessage && result.improvedMessage !== commitMessage.trim()) {
      console.log('\n✨ Improved commit message:');
      console.log(`  ${result.improvedMessage}`);
      await fs.writeFile(commitMsgFile, result.improvedMessage);
    }
  }

  /**
   * Ask user for confirmation
   */
  private async askForConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('', (answer) => {
        rl.close();
        const response = answer.toLowerCase().trim();
        resolve(response === 'y' || response === 'yes');
      });
    });
  }
}
