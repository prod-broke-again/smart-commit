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

export interface SmartDeployAnalysis {
  needsGitPull: boolean;
  needsComposerInstall: boolean;
  needsComposerUpdate: boolean;
  needsNpmInstall: boolean;
  needsNpmBuild: boolean;
  needsLaravelOptimize: boolean;
  needsLaravelMigrate: boolean;
  needsSystemRestart: boolean;
  reasons: string[];
}

export interface ServerCommandsConfig {
  enabled: boolean;
  autoExecute: boolean;
  projectPath?: string;
  server?: {
    host: string;
    user: string;
    port?: number;
    keyPath?: string;
  };
  commands: {
    git?: string[];
    frontend?: string[];
    backend?: string[];
    database?: string[];
    docker?: string[];
    system?: string[];
  };
  whitelist: string[];
}

export class ProjectAnalyzer {
  constructor(private readonly _aiAssistant: IAiAssistant) {}

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
   * Analyze changes and determine what commands are needed
   */
  public async analyzeChangesForSmartDeploy(projectPath: string, projectType?: string): Promise<SmartDeployAnalysis> {
    const analysis: SmartDeployAnalysis = {
      needsGitPull: true, // Always pull latest changes
      needsComposerInstall: false,
      needsComposerUpdate: false,
      needsNpmInstall: false,
      needsNpmBuild: false,
      needsLaravelOptimize: false,
      needsLaravelMigrate: false,
      needsSystemRestart: false,
      reasons: []
    };

    try {
      // Determine project type - use provided type or analyze project
      let actualProjectType: string;
      let projectFramework: string | undefined;

      if (projectType && projectType !== 'unknown') {
        actualProjectType = projectType;
        // For known types, we might not need framework info, but let's keep it simple
      } else {
        // Fallback: analyze project to determine type
        const projectInfo = await this.analyzeProject(projectPath);
        actualProjectType = projectInfo.type;
        projectFramework = projectInfo.framework;
      }

      // Get git diff to see what changed
      const { execSync } = require('child_process');
      const gitDiff = execSync('git diff --name-only HEAD~1 HEAD', {
        cwd: projectPath,
        encoding: 'utf8'
      }).trim();

      if (!gitDiff) {
        analysis.reasons.push('No changes detected in last commit');
        return analysis;
      }

      const changedFiles = gitDiff.split('\n').filter((file: string) => file.trim());
      analysis.reasons.push(`Detected changes in ${changedFiles.length} files`);

      // Analyze file types and determine needed actions based on project type
      for (const file of changedFiles) {
        const filePath = file.toLowerCase();

        // Always check for composer/npm dependencies regardless of project type
        // Composer dependencies
        if (filePath === 'composer.json' || filePath === 'composer.lock') {
          analysis.needsComposerInstall = true;
          analysis.reasons.push(`Composer dependencies changed (${file})`);
        }

        // NPM dependencies
        if (filePath === 'package.json' || filePath === 'package-lock.json') {
          analysis.needsNpmInstall = true;
          analysis.reasons.push(`NPM dependencies changed (${file})`);
        }

        // Project-specific analysis
        if (actualProjectType === 'php' && projectFramework === 'laravel') {
          // Laravel-specific files
          if (filePath.includes('config/') ||
              filePath.includes('.env') ||
              filePath.includes('routes/') ||
              filePath.includes('app/Providers/')) {
            analysis.needsLaravelOptimize = true;
            analysis.reasons.push(`Laravel configuration changed (${file})`);
          }

          // Database migrations
          if (filePath.includes('database/migrations/')) {
            analysis.needsLaravelMigrate = true;
            analysis.reasons.push(`Database migration detected (${file})`);
          }

          // Laravel frontend files - need build
          if (filePath.includes('resources/js/') ||
              filePath.includes('resources/css/') ||
              filePath.includes('resources/views/') ||
              filePath.includes('webpack.mix.js') ||
              filePath.includes('vite.config.js')) {
            analysis.needsNpmBuild = true;
            analysis.reasons.push(`Frontend files changed (${file})`);
          }
        } else if (actualProjectType === 'nodejs') {
          // Node.js specific files that need build
          if (filePath.includes('src/') ||
              filePath.includes('public/') ||
              filePath.includes('assets/') ||
              filePath.includes('webpack.config.js') ||
              filePath.includes('vite.config.js') ||
              filePath.includes('tsconfig.json') ||
              filePath.includes('babel.config.js')) {
            analysis.needsNpmBuild = true;
            analysis.reasons.push(`Source files changed (${file})`);
          }
        }

        // System files - might need restart (applies to all project types)
        if (filePath.includes('nginx.conf') ||
            filePath.includes('php.ini') ||
            filePath.includes('supervisor/')) {
          analysis.needsSystemRestart = true;
          analysis.reasons.push(`System configuration changed (${file})`);
        }
      }

    } catch (error) {
      // If git diff fails, assume we need everything
      analysis.needsComposerInstall = true;
      analysis.needsNpmInstall = true;
      analysis.needsNpmBuild = true;
      analysis.needsLaravelOptimize = true;
      analysis.reasons.push('Git analysis failed, running full deployment');
    }

    return analysis;
  }

  /**
   * Generate smart deployment commands based on analysis
   */
  public generateSmartDeployCommands(analysis: SmartDeployAnalysis): string[] {
    const commands: string[] = [];

    // Always pull latest changes
    if (analysis.needsGitPull) {
      commands.push('git pull origin main');
    }

    // Composer commands
    if (analysis.needsComposerInstall) {
      commands.push('composer install --no-dev --optimize-autoloader');
    }

    // NPM commands
    if (analysis.needsNpmInstall) {
      commands.push('npm install --production');
    }
    if (analysis.needsNpmBuild) {
      commands.push('npm run build');
    }

    // Laravel-specific commands - only if Laravel commands are actually needed
    if (analysis.needsLaravelOptimize) {
      commands.push('php artisan optimize:clear');
    }
    if (analysis.needsLaravelMigrate) {
      commands.push('php artisan migrate --force');
    }

    // PM2 restart for Node.js projects
    if (analysis.needsNpmBuild || analysis.needsNpmInstall) {
      commands.push('pm2 restart 0');
    }

    // System commands (only if needed)
    if (analysis.needsSystemRestart) {
      commands.push('sudo systemctl restart php8.3-fpm');
      commands.push('sudo systemctl restart nginx');
    }

    return commands;
  }

  /**
   * Generate server commands configuration using AI
   */
  public async generateServerCommandsConfig(projectInfo: ProjectInfo, projectPath: string): Promise<ServerCommandsConfig> {
    const projectFiles = await this.getRelevantProjectFiles(projectPath);
    const composerInfo = await this.getComposerInfo(projectPath);
    const packageInfo = await this.getPackageInfo(projectPath);
    
    const prompt = `You are a DevOps expert analyzing a Laravel + Vue.js project. Generate precise server deployment commands based on the EXACT project configuration.

PROJECT ANALYSIS:
- Type: ${projectInfo.type}
- Framework: ${projectInfo.framework || 'none'}
- Package Manager: ${projectInfo.packageManager || 'none'}
- Has Docker: ${projectInfo.hasDocker}
- Has Database: ${projectInfo.hasDatabase}

${composerInfo ? `COMPOSER.JSON DETAILS:
${composerInfo}` : ''}

${packageInfo ? `PACKAGE.JSON DETAILS:
${packageInfo}` : ''}

PROJECT FILES:
${projectFiles.map(file => `- ${file}`).join('\n')}

CRITICAL REQUIREMENTS - Generate commands based on ACTUAL project setup:

0. ALWAYS START with "git pull origin main" (or current branch)
1. PHP VERSION: Extract exact PHP version from composer.json (e.g., "^8.2" = php8.2-fpm)
2. FRONTEND: If package.json has "build" script, include "npm run build"
3. LARAVEL: Always include: composer install --no-dev --optimize-autoloader, php artisan config:cache, php artisan route:cache, php artisan view:cache
4. FILAMENT: If Filament detected, include "php artisan filament:upgrade"
5. INERTIA/VUE: If Vue detected, include frontend build commands
6. DATABASE: Include "php artisan migrate --force" if database folder exists or Laravel detected
7. QUEUE: Include "php artisan queue:restart" if queue workers detected

Return ONLY valid JSON (no explanations, no markdown):
{
  "enabled": true,
  "autoExecute": false,
  "projectPath": "/var/www/html",
  "server": {
    "host": "example.com",
    "user": "deploy",
    "port": 22,
    "keyPath": "~/.ssh/id_rsa"
  },
  "commands": {
    "git": ["git pull origin main"],
    "frontend": ["npm install", "npm run build"],
    "backend": ["composer install --no-dev --optimize-autoloader", "php artisan config:cache", "php artisan route:cache", "php artisan view:cache", "php artisan filament:upgrade"],
    "database": ["php artisan migrate --force"],
    "docker": [],
    "system": ["sudo systemctl restart php8.2-fpm", "sudo systemctl restart nginx"]
  },
  "whitelist": ["npm", "yarn", "composer", "php artisan", "docker-compose", "sudo systemctl"]
}`;

    const response = await this._aiAssistant.generateText(prompt, {
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

  private async getComposerInfo(projectPath: string): Promise<string | null> {
    try {
      const composerPath = path.join(projectPath, 'composer.json');
      const composerContent = await fs.readFile(composerPath, 'utf-8');
      const composer = JSON.parse(composerContent);
      
      const phpVersion = composer.require?.php || 'unknown';
      const laravelVersion = composer.require?.['laravel/framework'] || 'unknown';
      const hasFilament = composer.require?.['filament/filament'] ? 'yes' : 'no';
      const hasInertia = composer.require?.['inertiajs/inertia-laravel'] ? 'yes' : 'no';
      const hasQueue = composer.require?.['laravel/horizon'] || composer.require?.['laravel/telescope'] ? 'yes' : 'no';
      
      return `PHP Version: ${phpVersion}
Laravel Version: ${laravelVersion}
Has Filament: ${hasFilament}
Has Inertia: ${hasInertia}
Has Queue: ${hasQueue}`;
    } catch {
      return null;
    }
  }

  private async getPackageInfo(projectPath: string): Promise<string | null> {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const hasBuildScript = packageJson.scripts?.build ? 'yes' : 'no';
      const hasDevScript = packageJson.scripts?.dev ? 'yes' : 'no';
      const hasVue = packageJson.dependencies?.['vue'] || packageJson.devDependencies?.['vue'] ? 'yes' : 'no';
      const hasVite = packageJson.devDependencies?.['vite'] ? 'yes' : 'no';
      const hasTailwind = packageJson.devDependencies?.['tailwindcss'] ? 'yes' : 'no';
      
      return `Has Build Script: ${hasBuildScript}
Has Dev Script: ${hasDevScript}
Has Vue: ${hasVue}
Has Vite: ${hasVite}
Has Tailwind: ${hasTailwind}`;
    } catch {
      return null;
    }
  }

  private getDefaultConfig(projectInfo: ProjectInfo): ServerCommandsConfig {
    const config: ServerCommandsConfig = {
      enabled: true,
      autoExecute: false,
      projectPath: '/var/www/html',
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
      config.commands.database = ['php artisan migrate --force'];
      config.whitelist = ['composer', 'php artisan', 'sudo systemctl'];
    } else if (projectInfo.type === 'nodejs') {
      config.commands.frontend = ['npm run build'];
      config.commands.backend = ['npm install --production'];
      config.whitelist = ['npm', 'yarn', 'pnpm', 'sudo systemctl'];
    }

    return config;
  }
}
