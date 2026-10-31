import si from 'systeminformation';
import screenshot from 'screenshot-desktop';
import { exec, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class TelemetryService {
  constructor() {
    this._cachedOsInfo = null;
    this._cachedDisks = null;
    this._lastDiskCheck = 0;
  }

  async getSystemVitals() {
    try {
      // 1. Static OS info cached permanently to avoid repeated 2.8s WMI queries
      if (!this._cachedOsInfo) {
        try {
          this._cachedOsInfo = await si.osInfo();
        } catch (e) {
          this._cachedOsInfo = {
            platform: os.platform(),
            distro: os.type(),
            release: os.release(),
            hostname: os.hostname(),
          };
        }
      }

      // 2. Disk metrics cached for 30 seconds
      const now = Date.now();
      if (!this._cachedDisks || now - this._lastDiskCheck > 30000) {
        try {
          this._cachedDisks = await si.fsSize();
          this._lastDiskCheck = now;
        } catch (e) {}
      }

      // 3. Fast native OS memory computation
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memPercent = Math.round((usedMem / totalMem) * 100);

      // 4. Run currentLoad & networkStats concurrently
      const [cpu, network] = await Promise.all([
        si.currentLoad().catch(() => ({ currentLoad: 0, cpus: [] })),
        si.networkStats().catch(() => [])
      ]);

      return {
        cpu: {
          load: Math.round((cpu.currentLoad || 0) * 10) / 10,
          cores: cpu.cpus?.map(c => Math.round(c.load)) || []
        },
        memory: {
          used: usedMem,
          total: totalMem,
          free: freeMem,
          percent: memPercent
        },
        os: {
          platform: this._cachedOsInfo?.platform || os.platform(),
          distro: this._cachedOsInfo?.distro || os.type(),
          release: this._cachedOsInfo?.release || os.release(),
          hostname: this._cachedOsInfo?.hostname || os.hostname(),
          uptime: os.uptime()
        },
        disks: (this._cachedDisks || []).map(d => ({
          fs: d.fs,
          type: d.type,
          size: d.size,
          used: d.used,
          available: d.available,
          usePercent: d.use,
          mount: d.mount
        })),
        network: network && network[0] ? {
          rx_sec: network[0].rx_sec,
          tx_sec: network[0].tx_sec
        } : null
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  async getProcesses(limit = 60) {
    try {
      const proc = await si.processes();
      // Sort by CPU usage descending
      const sorted = proc.list
        .sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)
        .slice(0, limit)
        .map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: Math.round(p.cpu * 10) / 10,
          mem: Math.round(p.mem * 10) / 10,
          user: p.user,
          state: p.state
        }));
      return sorted;
    } catch (err) {
      return [];
    }
  }

  async killProcess(pid) {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
      exec(cmd, (err) => {
        if (err) return reject(new Error(`Failed to terminate PID ${pid}: ${err.message}`));
        resolve({ success: true, pid });
      });
    });
  }

  async getDisplayResolution() {
    try {
      const graphics = await si.graphics();
      const primary = graphics.displays?.find(d => d.main) || graphics.displays?.[0];
      return {
        width: primary?.resolutionX || 1920,
        height: primary?.resolutionY || 1080
      };
    } catch (e) {
      return { width: 1920, height: 1080 };
    }
  }

  async captureScreenshot() {
    // 1. Try native high-performance ScreenCapturer.exe with CAPTUREBLT on Windows
    if (process.platform === 'win32') {
      const exePath = path.join(__dirname, 'ScreenCapturer.exe');
      if (fs.existsSync(exePath)) {
        try {
          const b64 = await new Promise((resolve, reject) => {
            execFile(exePath, [], { maxBuffer: 1024 * 1024 * 30, timeout: 3500 }, (err, stdout) => {
              if (err) return reject(err);
              resolve(stdout.trim());
            });
          });
          if (b64 && b64.length > 500) {
            return Buffer.from(b64, 'base64');
          }
        } catch (e) {
          // fallback to screenshot-desktop
        }
      }
    }

    // 2. Fallback to screenshot-desktop
    try {
      const imgBuffer = await screenshot({ format: 'jpg' });
      return imgBuffer;
    } catch (err) {
      throw new Error(`Screenshot capture failed: ${err.message}`);
    }
  }


  executePower(action) {
    return new Promise((resolve, reject) => {
      let cmd = '';
      if (process.platform === 'win32') {
        switch (action) {
          case 'lock':
            cmd = 'rundll32.exe user32.dll,LockWorkStation';
            break;
          case 'sleep':
            cmd = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0';
            break;
          case 'restart':
          case 'reboot':
            cmd = 'shutdown /r /t 5';
            break;
          case 'shutdown':
            cmd = 'shutdown /s /t 5';
            break;
          case 'cancel_shutdown':
          case 'abort_shutdown':
            cmd = 'shutdown /a';
            break;
          default:
            return reject(new Error('Invalid power protocol'));
        }
      } else {
        switch (action) {
          case 'lock':
            cmd = 'xdg-screensaver lock || gnome-screensaver-command -l';
            break;
          case 'restart':
          case 'reboot':
            cmd = 'reboot';
            break;
          case 'shutdown':
            cmd = 'shutdown -h now';
            break;
          default:
            return reject(new Error('Invalid power protocol'));
        }
      }

      exec(cmd, (err, stdout, stderr) => {
        if (err && action !== 'cancel_shutdown') return reject(err);
        resolve({ success: true, action, output: stdout || stderr || 'Command executed' });
      });
    });
  }

  executeSystemProtocol(command) {
    const AI_COMMANDS = {
      'clean temp files': [
        'del /q /s %temp%\\*',
        'del /q /s C:\\Windows\\Temp\\*',
        'echo Temp files cleared.'
      ],
      'system info': [
        'systeminfo'
      ],
      'flush dns': [
        'ipconfig /flushdns'
      ],
      'list connections': [
        'netstat -an'
      ],
      'check disk': [
        'chkdsk C:'
      ],
      'ip configuration': [
        'ipconfig /all'
      ],
      'uptime': [
        'net statistics workstation'
      ]
    };

    return new Promise((resolve, reject) => {
      const normalized = (command || '').toLowerCase().trim();
      const matchedKey = Object.keys(AI_COMMANDS).find(key => 
        normalized.includes(key) || key.includes(normalized)
      );

      if (!matchedKey) {
        return reject(new Error(`Unknown protocol. Available: ${Object.keys(AI_COMMANDS).join(', ')}`));
      }

      const steps = AI_COMMANDS[matchedKey];
      const fullCmd = steps.join(' && ');

      exec(fullCmd, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
        const output = stdout || stderr || (err ? err.message : 'No output');
        resolve({
          protocol: matchedKey,
          steps,
          output,
          success: !err
        });
      });
    });
  }
}

export const telemetryService = new TelemetryService();

