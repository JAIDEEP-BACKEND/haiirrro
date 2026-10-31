import { spawn } from 'child_process';

class TerminalService {
  constructor() {
    this.activeProcesses = new Map();
  }

  execute(command, cwd, callbacks = {}) {
    const { onStdout, onStderr, onExit } = callbacks;
    const isWin = process.platform === 'win32';
    const shell = isWin ? 'powershell.exe' : '/bin/bash';
    const args = isWin ? ['-NoProfile', '-Command', command] : ['-c', command];

    const child = spawn(shell, args, {
      cwd,
      env: { ...process.env, CI: 'true', FORCE_COLOR: '1' },
    });

    const pid = child.pid;
    this.activeProcesses.set(pid, child);

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        if (onStdout) onStdout(data.toString('utf-8'));
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        if (onStderr) onStderr(data.toString('utf-8'));
      });
    }

    child.on('close', (code) => {
      this.activeProcesses.delete(pid);
      if (onExit) onExit(code);
    });

    child.on('error', (err) => {
      this.activeProcesses.delete(pid);
      if (onStderr) onStderr(`Process error: ${err.message}\n`);
      if (onExit) onExit(1);
    });

    return {
      pid,
      kill: () => {
        try {
          if (isWin) {
            spawn('taskkill', ['/pid', pid.toString(), '/f', '/t']);
          } else {
            child.kill('SIGTERM');
          }
        } catch (e) {}
      },
    };
  }

  kill(pid) {
    const proc = this.activeProcesses.get(pid);
    if (proc) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', pid.toString(), '/f', '/t']);
        } else {
          proc.kill('SIGTERM');
        }
      } catch (e) {}
      this.activeProcesses.delete(pid);
      return true;
    }
    return false;
  }
}

export const terminalService = new TerminalService();
