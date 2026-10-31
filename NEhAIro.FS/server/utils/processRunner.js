import { spawn } from 'child_process';

export function runProcess(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const {
      cwd = process.cwd(),
      env = process.env,
      onStdout = null,
      onStderr = null,
      abortSignal = null,
      shell = false,
    } = options;

    let stdout = '';
    let stderr = '';

    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell,
      windowsHide: true,
    });

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        try {
          child.kill('SIGTERM');
        } catch (_) {}
      });
    }

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        const str = chunk.toString('utf-8');
        stdout += str;
        if (onStdout) onStdout(str);
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        const str = chunk.toString('utf-8');
        stderr += str;
        if (onStderr) onStderr(str);
      });
    }

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode ?? 0,
        stdout,
        stderr,
      });
    });
  });
}
