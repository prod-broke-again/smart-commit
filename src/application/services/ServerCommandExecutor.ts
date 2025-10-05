import { Client } from 'ssh2';
import { ServerCommandsConfig } from './ProjectAnalyzer';
import chalk from 'chalk';

export interface SshExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export class ServerCommandExecutor {
  /**
   * Execute server commands via SSH
   */
  public async executeCommands(
    config: ServerCommandsConfig,
    projectPath: string = '/var/www/html'
  ): Promise<SshExecutionResult[]> {
    if (!config.enabled || !config.server) {
      throw new Error('Server commands are disabled or server configuration is missing');
    }

    const results: SshExecutionResult[] = [];
    
    // Collect all commands in order
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

    console.log(chalk.blue(`\n🚀 Executing ${allCommands.length} commands on server...`));
    console.log(chalk.gray(`Server: ${config.server.user}@${config.server.host}:${config.server.port || 22}`));
    console.log(chalk.gray(`Project path: ${projectPath}\n`));

    // Execute commands via SSH
    await this.executeViaSsh(config.server, projectPath, allCommands, results);

    return results;
  }

  /**
   * Execute commands via SSH connection
   */
  private async executeViaSsh(
    server: ServerCommandsConfig['server'],
    projectPath: string,
    commands: { category: string; command: string }[],
    results: SshExecutionResult[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        console.log(chalk.green('✓ Connected to server'));
        
        // Execute commands sequentially
        this.executeCommandsSequentially(conn, projectPath, commands, results)
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

      // Connect to server
      const connectionConfig = {
        host: server!.host,
        port: server!.port || 22,
        username: server!.user,
        privateKey: server!.keyPath ? require('fs').readFileSync(server!.keyPath.replace('~', require('os').homedir())) : undefined,
        // For password authentication (if no key provided)
        password: process.env['SSH_PASSWORD'],
      };

      conn.connect(connectionConfig);
    });
  }

  /**
   * Execute commands sequentially
   */
  private async executeCommandsSequentially(
    conn: Client,
    projectPath: string,
    commands: { category: string; command: string }[],
    results: SshExecutionResult[]
  ): Promise<void> {
    for (let i = 0; i < commands.length; i++) {
      const { category, command } = commands[i];
      
      console.log(chalk.yellow(`[${i + 1}/${commands.length}] ${category}: ${command}`));
      
      try {
        const result = await this.executeSingleCommand(conn, projectPath, command);
        results.push(result);
        
        if (result.success) {
          console.log(chalk.green(`✓ Success: ${command}`));
        } else {
          console.log(chalk.red(`✗ Failed: ${command}`));
          console.log(chalk.red(`Error: ${result.error}`));
          
          // Ask user if they want to continue
          if (!await this.askContinueOnError()) {
            throw new Error(`Command failed: ${command}`);
          }
        }
      } catch (error) {
        const errorResult: SshExecutionResult = {
          success: false,
          output: '',
          error: error instanceof Error ? error.message : String(error)
        };
        results.push(errorResult);
        
        console.log(chalk.red(`✗ Error: ${command}`));
        console.log(chalk.red(`Error: ${errorResult.error}`));
        
        if (!await this.askContinueOnError()) {
          throw error;
        }
      }
    }
  }

  /**
   * Execute a single command via SSH
   */
  private async executeSingleCommand(
    conn: Client,
    projectPath: string,
    command: string
  ): Promise<SshExecutionResult> {
    return new Promise((resolve) => {
      const fullCommand = `cd ${projectPath} && ${command}`;
      
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

        stream.on('close', (code: number) => {
          resolve({
            success: code === 0,
            output: output.trim(),
            error: errorOutput.trim() || undefined
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
   * Ask user if they want to continue on error
   */
  private async askContinueOnError(): Promise<boolean> {
    // For now, always continue (can be made interactive later)
    return true;
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

    return errors;
  }
}
