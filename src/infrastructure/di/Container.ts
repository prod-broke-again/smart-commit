import { IGitAnalyzer } from '../../domain/services/IGitAnalyzer';
import { IAiAssistant } from '../../domain/services/IAiAssistant';
import { ICommitGenerator } from '../../domain/services/ICommitGenerator';
import { IConfigurationManager } from '../../application/interfaces/IConfigurationManager';
import { IWorkflowOrchestrator } from '../../application/interfaces/IWorkflowOrchestrator';

import { GitOperations } from '../git/GitOperations';
import { GptunnelApiClient } from '../ai/GptunnelApiClient';
import { ConfigFileManager } from '../filesystem/ConfigFileManager';
import { CommitGenerator } from '../../application/services/CommitGenerator';
import { WorkflowOrchestrator } from '../../application/services/WorkflowOrchestrator';
import { ModelManager } from '../../application/services/ModelManager';

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

    // Get global config to determine wallet balance setting
    const globalConfig = await configManager.getGlobalConfig();
    const aiAssistant = new GptunnelApiClient(globalConfig.useWalletBalance);

    this.registerSingleton<IGitAnalyzer>('IGitAnalyzer', gitAnalyzer);
    this.registerSingleton<IAiAssistant>('IAiAssistant', aiAssistant);
    this.registerSingleton<IConfigurationManager>('IConfigurationManager', configManager);

    // Application services
    const modelManager = new ModelManager(aiAssistant);
    const commitGenerator = new CommitGenerator(aiAssistant);
    const workflowOrchestrator = new WorkflowOrchestrator(gitAnalyzer, commitGenerator, configManager);

    this.registerSingleton<ModelManager>('ModelManager', modelManager);
    this.registerSingleton<ICommitGenerator>('ICommitGenerator', commitGenerator);
    this.registerSingleton<IWorkflowOrchestrator>('IWorkflowOrchestrator', workflowOrchestrator);

    // Load models on startup (don't wait for it)
    modelManager.loadModels().catch(error => {
      console.warn('Failed to load models on startup:', error);
    });
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
