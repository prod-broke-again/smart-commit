import { exec } from 'child_process';
import { promisify } from 'util';
import { GitChange, GitChangeType } from '../../domain/entities/GitChange';
import { IGitAnalyzer, GitStatus } from '../../domain/services/IGitAnalyzer';

const execAsync = promisify(exec);

/**
 * Git operations implementation
 */
export class GitOperations implements IGitAnalyzer {
  public async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: process.cwd() });
      return true;
    } catch {
      return false;
    }
  }

  public async getStagedChanges(): Promise<readonly GitChange[]> {
    try {
      const { stdout } = await execAsync('git diff --cached --name-status', { cwd: process.cwd() });
      return this.parseGitStatusOutput(stdout);
    } catch {
      return [];
    }
  }

  public async getUnstagedChanges(): Promise<readonly GitChange[]> {
    try {
      const { stdout } = await execAsync('git diff --name-status', { cwd: process.cwd() });
      return this.parseGitStatusOutput(stdout);
    } catch {
      return [];
    }
  }

  public async getStagedDiff(): Promise<string> {
    try {
      const { stdout } = await execAsync('git diff --cached', { cwd: process.cwd() });
      return stdout;
    } catch {
      return '';
    }
  }

  public async getStatus(): Promise<GitStatus> {
    const [
      isRepository,
      stagedChanges,
      unstagedChanges,
      currentBranch,
      hasRemote
    ] = await Promise.all([
      this.isGitRepository(),
      this.getStagedChanges(),
      this.getUnstagedChanges(),
      this.getCurrentBranch(),
      this.hasRemote()
    ]);

    return {
      isRepository,
      hasStagedChanges: stagedChanges.length > 0,
      hasUnstagedChanges: unstagedChanges.length > 0,
      currentBranch,
      hasRemote,
      stagedChanges,
      unstagedChanges,
    };
  }

  public async stageAllChanges(): Promise<void> {
    await execAsync('git add .', { cwd: process.cwd() });
  }

  public async commitAndPush(message: string): Promise<void> {
    // Escape single quotes in message for shell
    const escapedMessage = message.replace(/'/g, "'\\''");

    await execAsync(`git commit -m '${escapedMessage}'`, { cwd: process.cwd() });

    const hasRemote = await this.hasRemote();
    if (hasRemote) {
      await execAsync('git push', { cwd: process.cwd() });
    }
  }

  public async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: process.cwd() });
      return stdout?.trim() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  public async hasRemote(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git remote', { cwd: process.cwd() });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  private parseGitStatusOutput(output: string): GitChange[] {
    const lines = output.split('\n').filter(line => line.trim());
    const changes: GitChange[] = [];

    for (const line of lines) {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        const status = parts[0];
        const filePath = parts[1];

        if (!status || !filePath) {
          continue;
        }

        let changeType: GitChangeType;
        switch (status[0]) {
          case 'A':
            changeType = GitChangeType.ADDED;
            break;
          case 'M':
            changeType = GitChangeType.MODIFIED;
            break;
          case 'D':
            changeType = GitChangeType.DELETED;
            break;
          case 'R':
            changeType = GitChangeType.RENAMED;
            break;
          default:
            changeType = GitChangeType.MODIFIED;
        }

        changes.push(GitChange.create(filePath, changeType));
      }
    }

    return changes;
  }
}
