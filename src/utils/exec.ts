/**
 * Utility module for executing shell commands
 * 
 * Provides a promisified version of Node.js child_process.exec
 * for easier async/await usage.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * Promisified version of child_process.exec
 * 
 * @example
 * ```typescript
 * const { stdout } = await execAsync('git status');
 * ```
 */
export const execAsync = promisify(exec);

