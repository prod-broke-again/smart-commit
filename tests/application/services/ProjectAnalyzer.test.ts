import { IAiAssistant } from '../../../src/domain/services/IAiAssistant';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectAnalyzer.analyzeChangesForSmartDeploy', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Laravel frontend file detection', () => {
    it('sets needsNpmBuild when resources/js file changed and projectType is "php" (from config)', async () => {
      // Simulate the CLI path: projectType is known from .smart-commit.json as "php",
      // so it is passed directly without prior analyzeProject call.
      jest.mock('child_process', () => ({
        execSync: jest.fn(() => 'resources/js/app.js'),
      }));

      // Re-import after mocking to pick up the new mock
      const { ProjectAnalyzer: PA } = await import('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      // analyzeProject must detect "laravel" framework
      jest.spyOn(analyzer, 'analyzeProject').mockResolvedValue({
        type: 'php',
        framework: 'laravel',
        packageManager: 'composer',
        hasDocker: false,
        hasDatabase: true,
        files: ['artisan', 'composer.json'],
        directories: ['app', 'resources'],
      });

      const analysis = await analyzer.analyzeChangesForSmartDeploy('/fake/project', 'php');

      expect(analysis.needsNpmBuild).toBe(true);
      expect(analyzer.analyzeProject).toHaveBeenCalledWith('/fake/project');
    });

    it('sets needsNpmBuild when resources/css file changed and projectType is "php"', async () => {
      jest.mock('child_process', () => ({
        execSync: jest.fn(() => 'resources/css/app.css'),
      }));

      const { ProjectAnalyzer: PA } = await import('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      jest.spyOn(analyzer, 'analyzeProject').mockResolvedValue({
        type: 'php',
        framework: 'laravel',
        packageManager: 'composer',
        hasDocker: false,
        hasDatabase: false,
        files: ['artisan', 'composer.json'],
        directories: ['app', 'resources'],
      });

      const analysis = await analyzer.analyzeChangesForSmartDeploy('/fake/project', 'php');

      expect(analysis.needsNpmBuild).toBe(true);
    });

    it('sets needsNpmBuild when vite.config.js changed and projectType is "php"', async () => {
      jest.mock('child_process', () => ({
        execSync: jest.fn(() => 'vite.config.js'),
      }));

      const { ProjectAnalyzer: PA } = await import('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      jest.spyOn(analyzer, 'analyzeProject').mockResolvedValue({
        type: 'php',
        framework: 'laravel',
        packageManager: 'composer',
        hasDocker: false,
        hasDatabase: false,
        files: ['artisan', 'composer.json'],
        directories: ['app'],
      });

      const analysis = await analyzer.analyzeChangesForSmartDeploy('/fake/project', 'php');

      expect(analysis.needsNpmBuild).toBe(true);
    });

    it('does NOT set needsNpmBuild for a non-Laravel PHP project (no artisan)', async () => {
      jest.mock('child_process', () => ({
        execSync: jest.fn(() => 'resources/js/app.js'),
      }));

      const { ProjectAnalyzer: PA } = await import('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      // Symfony or plain PHP — no framework detected
      jest.spyOn(analyzer, 'analyzeProject').mockResolvedValue({
        type: 'php',
        framework: undefined,
        packageManager: 'composer',
        hasDocker: false,
        hasDatabase: false,
        files: ['composer.json'],
        directories: ['src'],
      });

      const analysis = await analyzer.analyzeChangesForSmartDeploy('/fake/project', 'php');

      expect(analysis.needsNpmBuild).toBe(false);
    });

    it('still detects Laravel when projectType is unknown (legacy path)', async () => {
      jest.mock('child_process', () => ({
        execSync: jest.fn(() => 'resources/views/welcome.blade.php'),
      }));

      const { ProjectAnalyzer: PA } = await import('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      jest.spyOn(analyzer, 'analyzeProject').mockResolvedValue({
        type: 'php',
        framework: 'laravel',
        packageManager: 'composer',
        hasDocker: false,
        hasDatabase: true,
        files: ['artisan', 'composer.json'],
        directories: ['app', 'resources'],
      });

      // No projectType passed (unknown/undefined path)
      const analysis = await analyzer.analyzeChangesForSmartDeploy('/fake/project');

      expect(analysis.needsNpmBuild).toBe(true);
    });
  });

  describe('generateSmartDeployCommands', () => {
    it('includes npm run build when needsNpmBuild is true', () => {
      const { ProjectAnalyzer: PA } = require('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      const commands = analyzer.generateSmartDeployCommands({
        needsGitPull: true,
        needsComposerInstall: false,
        needsComposerUpdate: false,
        needsNpmInstall: false,
        needsNpmBuild: true,
        needsLaravelOptimize: false,
        needsLaravelMigrate: false,
        needsSystemRestart: false,
        reasons: [],
      });

      expect(commands).toContain('npm run build');
      expect(commands).toContain('git pull origin main');
    });

    it('does NOT include npm run build when needsNpmBuild is false', () => {
      const { ProjectAnalyzer: PA } = require('../../../src/application/services/ProjectAnalyzer');
      const analyzer = new PA({} as IAiAssistant);

      const commands = analyzer.generateSmartDeployCommands({
        needsGitPull: true,
        needsComposerInstall: false,
        needsComposerUpdate: false,
        needsNpmInstall: false,
        needsNpmBuild: false,
        needsLaravelOptimize: false,
        needsLaravelMigrate: false,
        needsSystemRestart: false,
        reasons: [],
      });

      expect(commands).not.toContain('npm run build');
    });
  });
});
