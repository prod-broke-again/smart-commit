/**
 * Shell execution with signal forwarding: Ctrl+C / SIGTERM propagates to the child
 * so npm/rsync subprocess trees are not left orphaned.
 */

import { exec, ExecOptions } from 'child_process';

export function execAsync(
  command: string,
  options?: ExecOptions
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = exec(command, options ?? {}, (error, stdout, stderr) => {
      cleanup();
      if (error) {
        reject(error);
      } else {
        const out = stdout === undefined || stdout === null ? '' : String(stdout);
        const err = stderr === undefined || stderr === null ? '' : String(stderr);
        resolve({ stdout: out, stderr: err });
      }
    });

    const forward = (signal: NodeJS.Signals) => {
      try {
        if (process.platform === 'win32') {
          child.kill();
        } else {
          child.kill(signal);
        }
      } catch {
        /* ignore */
      }
    };

    const onSigInt = () => forward('SIGINT');
    const onSigTerm = () => forward('SIGTERM');

    process.on('SIGINT', onSigInt);
    process.on('SIGTERM', onSigTerm);

    function cleanup() {
      process.off('SIGINT', onSigInt);
      process.off('SIGTERM', onSigTerm);
    }

    child.on('error', err => {
      cleanup();
      reject(err);
    });
  });
}
