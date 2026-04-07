import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ServerCommandsConfig } from './ProjectAnalyzer';
import chalk from 'chalk';
import { execAsync } from '../../utils/exec';

export interface SshExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

const DEFAULT_REMOTE_COMMAND_TIMEOUT_SECONDS = 300;

export class ServerCommandExecutor {
  /**
   * Bash-safe single-quoted string for `cd` on the remote shell (POSIX sh).
   */
  public static shellQuoteBashSingle(remotePath: string): string {
    return `'${remotePath.replace(/'/g, `'\\''`)}'`;
  }

  /**
   * Full remote line as sent over SSH (for debugging / dry-run style output).
   */
  public static buildRemoteShellLine(remoteProjectPath: string, command: string): string {
    const safeCd = ServerCommandExecutor.shellQuoteBashSingle(remoteProjectPath);
    return `cd ${safeCd} && ${command}`;
  }

  /**
   * Resolve ~/.ssh/id_rsa style paths using homedir + path.resolve.
   */
  private static resolveSshKeyPath(keyPath: string): string {
    if (keyPath === '~' || keyPath === '~/' || keyPath === '~\\') {
      return os.homedir();
    }
    if (keyPath.startsWith('~/') || keyPath.startsWith('~\\')) {
      const rest = keyPath.slice(2);
      return path.resolve(path.join(os.homedir(), rest));
    }
    return path.resolve(keyPath);
  }

  private getRemoteCommandTimeoutSeconds(server: ServerCommandsConfig['server']): number {
    const raw = server?.commandTimeoutSeconds;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    return DEFAULT_REMOTE_COMMAND_TIMEOUT_SECONDS;
  }

  /**
   * If localCommands use rsync, ensure rsync exists in PATH before starting deploy.
   * On Windows, commands may use `wsl rsync ...`; in that case only WSL's rsync is checked.
   */
  public async validateLocalDeployPrerequisites(localCommands?: string[]): Promise<string[]> {
    const cmds = localCommands ?? [];
    const needsRsync = cmds.some(c => /\brsync\b/i.test(c));
    if (!needsRsync) {
      return [];
    }

    const usesWslRsync = cmds.some(
      c => /^\s*wsl\s+/i.test(c) && /\brsync\b/i.test(c)
    );

    if (usesWslRsync) {
      try {
        await execAsync('wsl rsync --version', { timeout: 8000 });
        return [];
      } catch {
        return [
          'localCommands use `wsl rsync`, but rsync was not found in WSL. In WSL run: sudo apt install rsync (Debian/Ubuntu) or equivalent, then retry.'
        ];
      }
    }

    try {
      await execAsync('rsync --version', { timeout: 8000 });
      return [];
    } catch {
      if (process.platform === 'win32') {
        try {
          await execAsync('wsl rsync --version', { timeout: 8000 });
          return [
            'localCommands reference rsync, but `rsync` is not in PATH on Windows. Options: (1) Change the line to `wsl rsync ...` if you use WSL (fix paths if needed, e.g. /mnt/c/...). (2) Install rsync: `choco install rsync` or `scoop install rsync`, then reopen the terminal so PATH updates.'
          ];
        } catch {
          /* fall through */
        }
        return [
          'localCommands reference rsync, but rsync was not found in PATH. Install rsync (e.g. `choco install rsync` or `scoop install rsync`), use Git Bash with rsync, or use `wsl rsync ...` after installing rsync inside WSL.'
        ];
      }
      return [
        'localCommands reference rsync, but rsync was not found in PATH. Install rsync or adjust localCommands.'
      ];
    }
  }

  /**
   * Execute smart commands: optional local preparation, then SSH.
   */
  public async executeSmartCommands(
    config: ServerCommandsConfig,
    commands: string[],
    remoteProjectPath?: string,
    localProjectRoot: string = process.cwd()
  ): Promise<SshExecutionResult[]> {
    if (!config.enabled || !config.server) {
      throw new Error('Server commands are disabled or server configuration is missing');
    }

    const finalRemotePath = remoteProjectPath || config.projectPath || '/var/www/html';
    const results: SshExecutionResult[] = [];
    const localCommands = config.localCommands ?? [];

    if (localCommands.length > 0) {
      console.log(chalk.cyan('\n📦 Local preparation'));
      console.log(chalk.gray(`Working directory: ${localProjectRoot}\n`));
      await this.executeLocalCommands(localProjectRoot, localCommands, results);
    }

    const timeoutSec = this.getRemoteCommandTimeoutSeconds(config.server);

    console.log(chalk.blue(`\n🚀 Remote: ${commands.length} smart command(s)`));
    console.log(chalk.gray(`Server: ${config.server.user}@${config.server.host}:${config.server.port || 22}`));
    console.log(chalk.gray(`Project path (remote): ${finalRemotePath}`));
    console.log(chalk.gray(`Timeout per command: ${timeoutSec}s\n`));

    await this.executeViaSsh(
      config.server,
      finalRemotePath,
      commands.map(cmd => ({ category: 'smart', command: cmd })),
      results,
      timeoutSec
    );

    return results;
  }

  /**
   * Execute server commands: optional local preparation, then SSH.
   */
  public async executeCommands(
    config: ServerCommandsConfig,
    remoteProjectPath?: string,
    localProjectRoot: string = process.cwd()
  ): Promise<SshExecutionResult[]> {
    if (!config.enabled || !config.server) {
      throw new Error('Server commands are disabled or server configuration is missing');
    }

    const finalRemotePath = remoteProjectPath || config.projectPath || '/var/www/html';
    const results: SshExecutionResult[] = [];

    const allCommands: { category: string; command: string }[] = [];

    if (config.commands.git) {
      config.commands.git.forEach(cmd => allCommands.push({ category: 'git', command: cmd }));
    }
    if (config.commands.frontend) {
      config.commands.frontend.forEach(cmd => allCommands.push({ category: 'frontend', command: cmd }));
    }
    if (config.commands.backend) {
      config.commands.backend.forEach(cmd => allCommands.push({ category: 'backend', command: cmd }));
    }
    if (config.commands.database) {
      config.commands.database.forEach(cmd => allCommands.push({ category: 'database', command: cmd }));
    }
    if (config.commands.docker) {
      config.commands.docker.forEach(cmd => allCommands.push({ category: 'docker', command: cmd }));
    }
    if (config.commands.system) {
      config.commands.system.forEach(cmd => allCommands.push({ category: 'system', command: cmd }));
    }

    const localCommands = config.localCommands ?? [];
    if (localCommands.length > 0) {
      console.log(chalk.cyan('\n📦 Local preparation'));
      console.log(chalk.gray(`Working directory: ${localProjectRoot}\n`));
      await this.executeLocalCommands(localProjectRoot, localCommands, results);
    }

    const timeoutSec = this.getRemoteCommandTimeoutSeconds(config.server);

    console.log(chalk.blue(`\n🚀 Remote: ${allCommands.length} command(s)`));
    console.log(chalk.gray(`Server: ${config.server.user}@${config.server.host}:${config.server.port || 22}`));
    console.log(chalk.gray(`Project path (remote): ${finalRemotePath}`));
    console.log(chalk.gray(`Timeout per command: ${timeoutSec}s\n`));

    await this.executeViaSsh(config.server, finalRemotePath, allCommands, results, timeoutSec);

    return results;
  }

  private async executeLocalCommands(
    localRoot: string,
    commands: string[],
    results: SshExecutionResult[]
  ): Promise<void> {
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(chalk.yellow(`[local ${i + 1}/${commands.length}] ${command}`));
      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: localRoot,
          maxBuffer: 10 * 1024 * 1024
        });
        const out = stdout.trim();
        const err = stderr.trim();
        if (out) {
          console.log(chalk.gray(out));
        }
        if (err) {
          console.log(chalk.gray(err));
        }
        results.push({ success: true, output: out, error: err || undefined });
        console.log(chalk.green(`✓ Local success: ${command}`));
      } catch (e: unknown) {
        const execErr = e as { message?: string; stdout?: string; stderr?: string; code?: number };
        const msg = execErr.stderr?.trim() || execErr.stdout?.trim() || execErr.message || String(e);
        results.push({
          success: false,
          output: execErr.stdout?.trim() || '',
          error: msg
        });
        console.log(chalk.red(`✗ Local failed: ${command}`));
        console.log(chalk.red(msg));
        throw new Error(`Local command failed: ${command} (${msg})`);
      }
    }
  }

  /**
   * Execute commands via SSH connection
   */
  private async executeViaSsh(
    server: ServerCommandsConfig['server'],
    projectPath: string,
    commands: { category: string; command: string }[],
    results: SshExecutionResult[],
    commandTimeoutSeconds: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        console.log(chalk.green('✓ Connected to server'));

        this.executeCommandsSequentially(conn, projectPath, commands, results, commandTimeoutSeconds)
          .then(() => {
            conn.end();
            resolve();
          })
          .catch(error => {
            conn.end();
            reject(error);
          });
      });

      conn.on('error', (err) => {
        console.error(chalk.red('SSH connection error:'), err.message);
        reject(err);
      });

      const keyPath = server!.keyPath;
      const connectionConfig = {
        host: server!.host,
        port: server!.port || 22,
        username: server!.user,
        privateKey: keyPath ? fs.readFileSync(ServerCommandExecutor.resolveSshKeyPath(keyPath)) : undefined,
        password: process.env['SSH_PASSWORD'],
      };

      conn.connect(connectionConfig);
    });
  }

  /**
   * Execute commands sequentially (fail-fast on any error)
   */
  private async executeCommandsSequentially(
    conn: Client,
    projectPath: string,
    commands: { category: string; command: string }[],
    results: SshExecutionResult[],
    commandTimeoutSeconds: number
  ): Promise<void> {
    for (let i = 0; i < commands.length; i++) {
      const { category, command } = commands[i];

      console.log(chalk.yellow(`[remote ${i + 1}/${commands.length}] ${category}: ${command}`));

      try {
        const result = await this.executeSingleCommand(conn, projectPath, command, commandTimeoutSeconds);
        results.push(result);

        if (!result.success) {
          const detail = result.error || 'non-zero exit code';
          console.log(chalk.red(`✗ Failed: ${command}`));
          console.log(chalk.red(`Error: ${detail}`));
          throw new Error(`Command failed: ${command} (${detail})`);
        }
        console.log(chalk.green(`✓ Success: ${command}`));
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (!err.message.startsWith('Command failed:')) {
          console.log(chalk.red(`✗ Error: ${command}`));
          console.log(chalk.red(`Error: ${err.message}`));
        }
        throw err;
      }
    }
  }

  /**
   * Execute a single command via SSH (with per-command timeout)
   */
  private async executeSingleCommand(
    conn: Client,
    projectPath: string,
    command: string,
    commandTimeoutSeconds: number
  ): Promise<SshExecutionResult> {
    const fullCommand = ServerCommandExecutor.buildRemoteShellLine(projectPath, command);
    const timeoutMs = Math.max(1, commandTimeoutSeconds) * 1000;

    return new Promise((resolve) => {
      conn.exec(fullCommand, (err, stream) => {
        if (err) {
          resolve({
            success: false,
            output: '',
            error: err.message
          });
          return;
        }

        let output = '';
        let errorOutput = '';
        let settled = false;

        const timer = setTimeout(() => {
          if (settled) {
            return;
          }
          settled = true;
          try {
            stream.destroy();
          } catch {
            /* ignore */
          }
          resolve({
            success: false,
            output: output.trim(),
            error: `Command timed out after ${commandTimeoutSeconds}s`
          });
        }, timeoutMs);

        stream.on('error', (streamErr: Error) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          resolve({
            success: false,
            output: output.trim(),
            error: streamErr.message
          });
        });

        stream.on('close', (code: number | null) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          const ok = code === 0;
          resolve({
            success: ok,
            output: output.trim(),
            error: errorOutput.trim() || (ok ? undefined : `exit code ${code ?? 'unknown'}`)
          });
        });

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      });
    });
  }

  /**
   * Validate server configuration
   */
  public validateConfig(config: ServerCommandsConfig): string[] {
    const errors: string[] = [];

    if (!config.server) {
      errors.push('Server configuration is missing');
      return errors;
    }

    if (!config.server.host) {
      errors.push('Server host is required');
    }

    if (!config.server.user) {
      errors.push('Server user is required');
    }

    if (!config.server.keyPath && !process.env['SSH_PASSWORD']) {
      errors.push('Either SSH key path or SSH_PASSWORD environment variable is required');
    }

    const t = config.server.commandTimeoutSeconds;
    if (t !== undefined && (typeof t !== 'number' || !Number.isFinite(t) || t <= 0)) {
      errors.push('server.commandTimeoutSeconds must be a positive number');
    }

    return errors;
  }
}
