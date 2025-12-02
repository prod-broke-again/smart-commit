import { IGitAnalyzer } from '../../domain/services/IGitAnalyzer';
import { IAiAssistant } from '../../domain/services/IAiAssistant';
import { ICommitGenerator } from '../../domain/services/ICommitGenerator';
import { IConfigurationManager } from '../../application/interfaces/IConfigurationManager';
import { IWorkflowOrchestrator } from '../../application/interfaces/IWorkflowOrchestrator';

import { GitOperations } from '../git/GitOperations';
import { AiProviderFactory } from '../ai/AiProviderFactory';
import { ConfigFileManager } from '../filesystem/ConfigFileManager';
import { CommitGenerator } from '../../application/services/CommitGenerator';
import { WorkflowOrchestrator } from '../../application/services/WorkflowOrchestrator';
import { ModelManager } from '../../application/services/ModelManager';
import { ProjectAnalyzer } from '../../application/services/ProjectAnalyzer';
import { ServerCommandExecutor } from '../../application/services/ServerCommandExecutor';

/**
 * Dependency injection container
 */
export class Container {
  private static instance: Container;
  private services = new Map<string, unknown>();

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Gets a service instance
   */
  public get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not registered`);
    }
    return service as T;
  }

  /**
   * Registers a service
   */
  public register<T>(serviceName: string, factory: () => T): void {
    this.services.set(serviceName, factory());
  }

  /**
   * Registers a singleton service
   */
  public registerSingleton<T>(serviceName: string, instance: T): void {
    this.services.set(serviceName, instance);
  }

  /**
   * Initializes all services
   */
  public async initialize(): Promise<void> {
    // Infrastructure services
    const gitAnalyzer = new GitOperations();
    const configManager = new ConfigFileManager();

    // Get merged config (project config overrides global)
    const mergedConfig = await configManager.getMergedConfig();

    const aiAssistant = AiProviderFactory.create(mergedConfig.defaultProvider, {
      credentials: mergedConfig.apiCredentials ?? null,
      useWalletBalance: mergedConfig['useWalletBalance'] as boolean ?? true,
    });

    this.registerSingleton<IGitAnalyzer>('IGitAnalyzer', gitAnalyzer);
    this.registerSingleton<IAiAssistant>('IAiAssistant', aiAssistant);
    this.registerSingleton<IConfigurationManager>('IConfigurationManager', configManager);

    // Application services
    const modelManager = new ModelManager(aiAssistant);
    const commitGenerator = new CommitGenerator(aiAssistant);
    const workflowOrchestrator = new WorkflowOrchestrator(gitAnalyzer, commitGenerator, configManager);
    const projectAnalyzer = new ProjectAnalyzer(aiAssistant);
    const serverCommandExecutor = new ServerCommandExecutor();

    this.registerSingleton<ModelManager>('ModelManager', modelManager);
    this.registerSingleton<ICommitGenerator>('ICommitGenerator', commitGenerator);
    this.registerSingleton<IWorkflowOrchestrator>('IWorkflowOrchestrator', workflowOrchestrator);
    this.registerSingleton<ProjectAnalyzer>('ProjectAnalyzer', projectAnalyzer);
    this.registerSingleton<ServerCommandExecutor>('ServerCommandExecutor', serverCommandExecutor);

    // Don't load models on startup to avoid blocking with API errors
  }

  /**
   * Gets git analyzer service
   */
  public get gitAnalyzer(): IGitAnalyzer {
    return this.get<IGitAnalyzer>('IGitAnalyzer');
  }

  /**
   * Gets AI assistant service
   */
  public get aiAssistant(): IAiAssistant {
    return this.get<IAiAssistant>('IAiAssistant');
  }

  /**
   * Gets configuration manager
   */
  public get configManager(): IConfigurationManager {
    return this.get<IConfigurationManager>('IConfigurationManager');
  }

  /**
   * Gets commit generator service
   */
  public get commitGenerator(): ICommitGenerator {
    return this.get<ICommitGenerator>('ICommitGenerator');
  }

  /**
   * Gets workflow orchestrator
   */
  public get workflowOrchestrator(): IWorkflowOrchestrator {
    return this.get<IWorkflowOrchestrator>('IWorkflowOrchestrator');
  }

  /**
   * Gets model manager
   */
  public get modelManager(): ModelManager {
    return this.get<ModelManager>('ModelManager');
  }
}
