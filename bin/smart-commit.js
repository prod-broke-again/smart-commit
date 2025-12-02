#!/usr/bin/env node

const { Command } = require('commander');
const { SmartCommitCli } = require('../lib/cli/SmartCommitCli');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('smart-commit')
  .description('Smart Commit Tool - AI-powered conventional commit messages')
  .version(packageJson.version);

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
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Configuration commands
program
  .command('config')
  .description('Manage configuration')
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
        console.log('Use --set, --get, or --list options');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Models commands
program
  .command('models')
  .description('Manage AI models')
  .addCommand(
    new (require('commander').Command)('list')
      .description('List available models')
      .option('--all', 'Show all models (default: first 15)')
      .action(async (options) => {
        try {
          const cli = new SmartCommitCli();
          await cli.listModels(options.all);
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new (require('commander').Command)('refresh')
      .description('Refresh models from API')
      .action(async () => {
        try {
          const cli = new SmartCommitCli();
          await cli.refreshModels();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new (require('commander').Command)('clear-cache')
      .description('Clear models cache')
      .action(async () => {
        try {
          const cli = new SmartCommitCli();
          await cli.clearModelsCache();
        } catch (error) {
          console.error('Error:', error.message);
          process.exit(1);
        }
      })
  );

// Setup command
program
  .command('setup')
  .description('Initial setup and configuration')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.runSetup();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Generate config command
program
  .command('generate-config')
  .description('Generate project-specific configuration')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.generateConfig();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Execute server commands via SSH')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.deployServer();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Smart deploy command
program
  .command('deploy-smart')
  .description('Execute only necessary server commands based on changes')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.deploySmart();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Install hooks command
program
  .command('install-hooks')
  .description('Install Git hooks for automatic commit message validation and improvement')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.installHooks();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Uninstall hooks command
program
  .command('uninstall-hooks')
  .description('Uninstall Git hooks')
  .action(async () => {
    try {
      const cli = new SmartCommitCli();
      await cli.uninstallHooks();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Hook command (internal, called by git hooks)
program
  .command('hook')
  .description('Internal command for Git hooks')
  .argument('<hook-type>', 'Hook type (commit-msg)')
  .argument('<file>', 'Hook file path')
  .action(async (hookType, file) => {
    try {
      const cli = new SmartCommitCli();
      if (hookType === 'commit-msg') {
        await cli.handleCommitMsgHook(file);
      } else {
        console.error(`Unknown hook type: ${hookType}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
