#!/usr/bin/env node

const { Command, Help } = require('commander');
const { SmartCommitCli } = require('../lib/cli/SmartCommitCli');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('smart-commit')
  .description('Smart Commit Tool - AI-powered conventional commit messages')
  .version(packageJson.version)
  .configureHelp({
    sortSubcommands: true,
    sortOptions: true,
    showGlobalOptions: true
  })
  .configureOutput({
    outputError: (str, write) => write(`✗ Error: ${str}`)
  })
  .addHelpText('beforeAll', `
╔══════════════════════════════════════════════════════════════╗
║                    🤖 Smart Commit Tool                     ║
║              AI-powered conventional commits               ║
╚══════════════════════════════════════════════════════════════╝
`)
  .addHelpText('after', `

Examples:
  $ smart-commit                    # Generate commit message
  $ smart-commit --dry-run         # Preview changes
  $ smart-commit -m "feat: add auth" # Custom message
  $ smart-commit config --list     # Show configuration
  $ smart-commit generate-config   # Setup deployment
  $ smart-commit deploy            # Smart deployment (git diff analysis)
  $ smart-commit deploy --full     # Full deployment (all command categories)

For more info: https://github.com/prod-broke-again/smart-commit
`);

program
  .option('--dry-run', 'Show what would be committed without making changes')
  .option('--generate-only', 'Only generate commit message without committing')
  .option('-m, --message <message>', 'Use custom commit message instead of generating')
  .option('-v, --verbose', 'Verbose output')
  .option('--force', 'Force commit even if validation fails')
  .action(async (options) => {
    try {
      const cli = new SmartCommitCli();

      if (options.dryRun) {
        await cli.runDryRun({ verbose: options.verbose });
      } else if (options.generateOnly) {
        await cli.runGenerateOnly({ verbose: options.verbose });
      } else if (options.message) {
        await cli.runWithCustomMessage(options.message, {
          verbose: options.verbose,
          force: options.force
        });
      } else {
        await cli.runStandard({ verbose: options.verbose });
      }
    } catch (error) {
      program.error(error.message);
    }
  });

// Configuration commands
const configCommand = program
  .command('config')
  .description('⚙️ Manage configuration')
  .summary('Configure global and project settings')
  .option('--global', 'Configure globally')
  .option('--set <key=value>', 'Set configuration value')
  .option('--get <key>', 'Get configuration value')
  .option('--list', 'List all configuration')
  .action(async (options) => {
    try {
      const cli = new SmartCommitCli();

      if (options.set) {
        const [key, value] = options.set.split('=');
        await cli.setConfig(key, value, options.global);
      } else if (options.get) {
        const value = await cli.getConfig(options.get, options.global);
        console.log(value);
      } else if (options.list) {
        await cli.listConfig(options.global);
      } else {
        console.log('💡 Use --set, --get, or --list options');
      }
    } catch (error) {
      program.error(error.message);
    }
  });

// AI Models commands
const modelsCommand = program
  .command('models')
  .description('🤖 Manage AI models')
  .summary('Manage AI models and cache')
  .addCommand(
    new Command('list')
      .description('📋 List available models')
      .option('--all', 'Show all models (default: first 15)')
      .action(async (options) => {
        try {
          const cli = new SmartCommitCli();
          await cli.listModels(options.all);
        } catch (error) {
          program.error(error.message);
        }
      })
  )
  .addCommand(
    new Command('refresh')
      .description('🔄 Refresh models from API')
      .action(async () => {
        try {
          const cli = new SmartCommitCli();
          await cli.refreshModels();
        } catch (error) {
          program.error(error.message);
        }
      })
  )
  .addCommand(
    new Command('clear-cache')
      .description('🧹 Clear models cache')
      .action(async () => {
        try {
          const cli = new SmartCommitCli();
          await cli.clearModelsCache();
        } catch (error) {
          program.error(error.message);
        }
      })
  );

// Setup command
program
  .command('setup')
  .description('🚀 Initial setup and configuration')
  .summary('Run initial setup wizard')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.runSetup();
    } catch (error) {
      program.error(error.message);
    }
  });

// Generate config command
program
  .command('generate-config')
  .description('⚙️ Generate project-specific configuration')
  .summary('Auto-generate deployment config')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.generateConfig();
    } catch (error) {
      program.error(error.message);
    }
  });

// Deploy command (smart by default, --full for legacy full run)
program
  .command('deploy')
  .description('🧠 Deploy: smart mode by default (git diff analysis), or --full for all commands')
  .summary('Smart deploy (use --full for all commands)')
  .option('--full', 'Run all command categories (git/frontend/backend/database/system) without smart analysis')
  .action(async (options) => {
    try {
      const cli = new SmartCommitCli();
      await cli.deploy(options.full ? 'full' : 'smart');
    } catch (error) {
      program.error(error.message);
    }
  });

// Smart deploy command (kept as alias, deprecated)
program
  .command('deploy-smart')
  .description('🧠 [Deprecated: use "deploy" instead] Smart deploy based on git diff')
  .summary('Alias for "deploy" (deprecated)')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      console.warn('⚠️  "deploy-smart" is deprecated. Use "smart-commit deploy" instead.');
      await cli.deploy('smart');
    } catch (error) {
      program.error(error.message);
    }
  });

// Git hooks commands
program
  .command('install-hooks')
  .description('🔗 Install Git hooks for automatic commit message validation and improvement')
  .summary('Install Git hooks')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.installHooks();
    } catch (error) {
      program.error(error.message);
    }
  });

program
  .command('uninstall-hooks')
  .description('🔌 Uninstall Git hooks')
  .summary('Remove Git hooks')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.uninstallHooks();
    } catch (error) {
      program.error(error.message);
    }
  });

// Hook command (internal, called by git hooks)
program
  .command('hook')
  .description('⚙️ Internal command for Git hooks')
  .summary('Git hook handler')
  .argument('<hook-type>', 'Hook type (commit-msg)')
  .argument('<file>', 'Hook file path')
  .action(async (hookType, file) => {
    try {
      const cli = new SmartCommitCli();
      if (hookType === 'commit-msg') {
        await cli.handleCommitMsgHook(file);
      } else {
        program.error(`Unknown hook type: ${hookType}`);
      }
    } catch (error) {
      program.error(error.message);
    }
  });

program.parse();
