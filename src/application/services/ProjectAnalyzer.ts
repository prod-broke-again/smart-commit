import * as fs from 'fs-extra';
import * as path from 'path';
import { IAiAssistant } from '../../domain/services/IAiAssistant';
import { AiModel } from '../../domain/entities/AiModel';

export interface ProjectInfo {
  type: 'php' | 'nodejs' | 'python' | 'java' | 'dotnet' | 'unknown';
  framework?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'composer' | 'pip' | 'maven' | 'gradle';
  hasDocker: boolean;
  hasDatabase: boolean;
  files: string[];
  directories: string[];
}

export interface ServerCommandsConfig {
  enabled: boolean;
  autoExecute: boolean;
  server?: {
    host: string;
    user: string;
    port?: number;
    keyPath?: string;
  };
  commands: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    docker?: string[];
    system?: string[];
  };
  whitelist: string[];
}

export class ProjectAnalyzer {
  constructor(private readonly aiAssistant: IAiAssistant) {}

  /**
   * Analyze project structure and determine project type
   */
  public async analyzeProject(projectPath: string): Promise<ProjectInfo> {
    const files = await this.getProjectFiles(projectPath);
    const directories = await this.getProjectDirectories(projectPath);
    
    const projectInfo: ProjectInfo = {
      type: 'unknown',
      hasDocker: false,
      hasDatabase: false,
      files,
      directories
    };

    // Detect project type based on files
    if (files.includes('composer.json')) {
      projectInfo.type = 'php';
      projectInfo.packageManager = 'composer';
    } else if (files.includes('package.json')) {
      projectInfo.type = 'nodejs';
      projectInfo.packageManager = 'npm';
    } else if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
      projectInfo.type = 'python';
      projectInfo.packageManager = 'pip';
    } else if (files.includes('pom.xml')) {
      projectInfo.type = 'java';
      projectInfo.packageManager = 'maven';
    } else if (files.includes('build.gradle')) {
      projectInfo.type = 'java';
      projectInfo.packageManager = 'gradle';
    } else if (files.includes('*.csproj') || files.includes('*.sln')) {
      projectInfo.type = 'dotnet';
    }

    // Detect framework
    if (projectInfo.type === 'php') {
      if (files.includes('artisan') || files.includes('app/Http/Kernel.php')) {
        projectInfo.framework = 'laravel';
      } else if (files.includes('symfony.lock')) {
        projectInfo.framework = 'symfony';
      }
    } else if (projectInfo.type === 'nodejs') {
      if (files.includes('next.config.js')) {
        projectInfo.framework = 'nextjs';
      } else if (files.includes('nuxt.config.js')) {
        projectInfo.framework = 'nuxt';
      } else if (files.includes('angular.json')) {
        projectInfo.framework = 'angular';
      } else if (files.includes('vue.config.js')) {
        projectInfo.framework = 'vue';
      }
    }

    // Detect Docker
    projectInfo.hasDocker = files.includes('Dockerfile') || files.includes('docker-compose.yml');

    // Detect database
    projectInfo.hasDatabase = files.some(file => 
      file.includes('migration') || 
      file.includes('schema') || 
      file.includes('.sql') ||
      file.includes('database')
    );

    return projectInfo;
  }

  /**
   * Generate server commands configuration using AI
   */
  public async generateServerCommandsConfig(projectInfo: ProjectInfo, projectPath: string): Promise<ServerCommandsConfig> {
    const projectFiles = await this.getRelevantProjectFiles(projectPath);
    
    const prompt = `Analyze this project and generate server deployment commands configuration.

Project Info:
- Type: ${projectInfo.type}
- Framework: ${projectInfo.framework || 'none'}
- Package Manager: ${projectInfo.packageManager || 'none'}
- Has Docker: ${projectInfo.hasDocker}
- Has Database: ${projectInfo.hasDatabase}

Project Files:
${projectFiles.map(file => `- ${file}`).join('\n')}

Generate a JSON configuration for server commands that should be executed after git push.
Include commands for:
1. Frontend build (if applicable)
2. Backend deployment (if applicable) 
3. Database migrations (if applicable)
4. Docker operations (if applicable)
5. System services restart (if applicable)

Return ONLY valid JSON in this format:
{
  "enabled": true,
  "autoExecute": false,
  "server": {
    "host": "example.com",
    "user": "deploy",
    "port": 22,
    "keyPath": "~/.ssh/id_rsa"
  },
  "commands": {
    "frontend": ["npm run build"],
    "backend": ["composer install --no-dev", "php artisan migrate"],
    "database": ["php artisan migrate"],
    "docker": ["docker-compose down", "docker-compose up -d --build"],
    "system": ["sudo systemctl restart nginx"]
  },
  "whitelist": ["npm", "yarn", "composer", "php artisan", "docker-compose", "sudo systemctl"]
}`;

    const response = await this.aiAssistant.generateText(prompt, {
      model: AiModel.GPT_4,
      maxTokens: 2000,
      temperature: 0.3
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback configuration if AI response is invalid
      return this.getDefaultConfig(projectInfo);
    }
  }

  private async getProjectFiles(projectPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(projectPath);
      return files.filter(file => {
        const stat = fs.statSync(path.join(projectPath, file));
        return stat.isFile();
      });
    } catch {
      return [];
    }
  }

  private async getProjectDirectories(projectPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(projectPath);
      return files.filter(file => {
        const stat = fs.statSync(path.join(projectPath, file));
        return stat.isDirectory() && !file.startsWith('.');
      });
    } catch {
      return [];
    }
  }

  private async getRelevantProjectFiles(projectPath: string): Promise<string[]> {
    const relevantFiles: string[] = [];
    
    try {
      const files = await fs.readdir(projectPath);
      
      for (const file of files) {
        const filePath = path.join(projectPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          // Include important config files
          if (file.match(/\.(json|yml|yaml|toml|lock|env|ini|conf)$/)) {
            relevantFiles.push(file);
          }
        } else if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
          // Include important directories
          if (['src', 'app', 'lib', 'config', 'database', 'migrations'].includes(file)) {
            relevantFiles.push(`${file}/`);
          }
        }
      }
    } catch {
      // Ignore errors
    }
    
    return relevantFiles.slice(0, 20); // Limit to 20 files
  }

  private getDefaultConfig(projectInfo: ProjectInfo): ServerCommandsConfig {
    const config: ServerCommandsConfig = {
      enabled: true,
      autoExecute: false,
      commands: {},
      whitelist: []
    };

    if (projectInfo.type === 'php') {
      config.commands.backend = [
        'composer install --no-dev --optimize-autoloader',
        'php artisan config:cache',
        'php artisan route:cache',
        'php artisan view:cache'
      ];
      config.commands.database = ['php artisan migrate'];
      config.whitelist = ['composer', 'php artisan', 'sudo systemctl'];
    } else if (projectInfo.type === 'nodejs') {
      config.commands.frontend = ['npm run build'];
      config.commands.backend = ['npm install --production'];
      config.whitelist = ['npm', 'yarn', 'pnpm', 'sudo systemctl'];
    }

    return config;
  }
}
