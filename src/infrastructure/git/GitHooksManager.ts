import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Manages Git hooks installation and configuration
 */
export class GitHooksManager {
  private readonly hooksDir: string;
  private readonly commitMsgHookPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.hooksDir = path.join(repoPath, '.git', 'hooks');
    this.commitMsgHookPath = path.join(this.hooksDir, 'commit-msg');
  }

  /**
   * Checks if we're in a git repository
   */
  public async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: process.cwd() });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Installs commit-msg hook
   */
  public async installCommitMsgHook(): Promise<void> {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a git repository. Please run this command from a git repository.');
    }

    // Ensure hooks directory exists
    await fs.ensureDir(this.hooksDir);

    // Get path to smart-commit binary
    const smartCommitPath = this.getSmartCommitPath();

    // Create commit-msg hook script
    const hookScript = this.generateCommitMsgHook(smartCommitPath);

    // Write hook file
    await fs.writeFile(this.commitMsgHookPath, hookScript, { mode: 0o755 });

    console.log('✓ Git hook installed successfully!');
    console.log(`  Hook location: ${this.commitMsgHookPath}`);
  }

  /**
   * Uninstalls commit-msg hook
   */
  public async uninstallCommitMsgHook(): Promise<void> {
    if (await fs.pathExists(this.commitMsgHookPath)) {
      await fs.remove(this.commitMsgHookPath);
      console.log('✓ Git hook uninstalled successfully!');
    } else {
      console.log('ℹ No hook found to uninstall.');
    }
  }

  /**
   * Checks if commit-msg hook is installed
   */
  public async isHookInstalled(): Promise<boolean> {
    return await fs.pathExists(this.commitMsgHookPath);
  }

  /**
   * Gets path to smart-commit binary
   */
  private getSmartCommitPath(): string {
    // Try to find smart-commit in PATH
    // In production, it will be in node_modules/.bin or globally installed
    // For development, we can use npx
    if (process.env['npm_execpath']) {
      // Running via npm/npx
      return 'npx smart-commit-ai';
    }

    // Try to find in node_modules
    const localPath = path.join(process.cwd(), 'node_modules', '.bin', 'smart-commit');
    if (fs.existsSync(localPath)) {
      return localPath;
    }

    // Default to global installation
    return 'smart-commit';
  }

  /**
   * Generates commit-msg hook script
   */
  private generateCommitMsgHook(smartCommitPath: string): string {
    // Use cross-platform approach
    return `#!/usr/bin/env node
/**
 * Smart Commit AI - commit-msg hook
 * Validates and improves commit messages automatically
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  console.error('Error: commit message file not provided');
  process.exit(1);
}

// Read commit message
const commitMessage = fs.readFileSync(commitMsgFile, 'utf-8').trim();

// Skip if message is empty or starts with merge/revert
if (!commitMessage || commitMessage.startsWith('Merge ') || commitMessage.startsWith('Revert ')) {
  process.exit(0);
}

// Call smart-commit to validate and improve
const smartCommit = spawn('${smartCommitPath}', ['hook', 'commit-msg', commitMsgFile], {
  stdio: 'inherit',
  shell: true
});

smartCommit.on('close', (code) => {
  if (code !== 0) {
    console.error('\\n❌ Commit message validation failed. Use --no-verify to skip.');
    process.exit(1);
  }
  process.exit(0);
});

smartCommit.on('error', (error) => {
  console.error('Error running smart-commit hook:', error.message);
  // Don't fail if smart-commit is not available
  process.exit(0);
});
`;
  }
}

