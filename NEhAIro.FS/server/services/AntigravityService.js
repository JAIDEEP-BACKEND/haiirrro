import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { runProcess } from '../utils/processRunner.js';
import { config } from '../config.js';

export class AntigravityService {
  constructor() {
    this.cliPath = config.antigravity.cliPath;
    this.activeProcesses = new Map();
  }

  async checkAvailability() {
    try {
      const res = await runProcess(this.cliPath, ['--version']);
      if (res.exitCode === 0) {
        return {
          available: true,
          version: res.stdout.trim(),
          path: this.cliPath,
        };
      }
      return {
        available: false,
        error: res.stderr || 'Command returned non-zero exit code',
      };
    } catch (err) {
      return {
        available: false,
        error: err.message || 'Antigravity CLI (agy) not found in PATH',
      };
    }
  }

  async executeInstruction(options) {
    const {
      repoId,
      cwd,
      instruction,
      conversationId = null,
      continueSession = false,
      onStream = null,
      onActivity = null,
      onStatus = null,
      onCommandOutput = null,
      onTelemetry = null,
    } = options;

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd, { recursive: true });
    }

    const args = [
      '-p',
      instruction,
      '--output-format',
      'stream-json',
      '--dangerously-skip-permissions',
    ];

    if (conversationId) {
      args.push('--conversation', conversationId);
    } else if (continueSession) {
      args.push('--continue');
    }

    if (onStatus) onStatus({ status: 'STARTING', message: 'Initializing Antigravity session...' });
    if (onCommandOutput) {
      onCommandOutput(`\n[AGY CLI] Spawning: agy -p "${instruction.slice(0, 80)}${instruction.length > 80 ? '...' : ''}" in ${cwd}\n`);
    }

    return new Promise((resolve, reject) => {
      let child;
      try {
        child = spawn(this.cliPath, args, {
          cwd,
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            FORCE_COLOR: '0',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
      } catch (err) {
        if (onStatus) onStatus({ status: 'FAILED', error: err.message });
        if (onCommandOutput) onCommandOutput(`\n[AGY SPAWN ERROR] ${err.message}\n`);
        return reject(err);
      }

      this.activeProcesses.set(repoId, child);

      let buffer = '';
      let capturedConvId = conversationId;
      let finalResult = null;
      let totalModifiedFiles = new Set();
      let fullAgentResponse = '';
      let currentStepIndex = 0;
      let totalUsage = { input_tokens: 0, output_tokens: 0, thinking_tokens: 0, total_tokens: 0 };

      const processLine = (line) => {
        if (!line || !line.trim()) return;
        try {
          const evt = JSON.parse(line.trim());

          if (evt.event === 'init') {
            capturedConvId = evt.conversation_id || (evt.init && evt.init.conversation_id);
            const toolCount = evt.init?.tools?.length || 0;
            const initMsg = `[AGY SESSION INITIALIZED] Conversation: ${capturedConvId || 'new'} | Tools loaded: ${toolCount}\n`;
            
            if (onStatus) onStatus({ status: 'STREAMING', conversationId: capturedConvId });
            if (onStream) onStream({ type: 'init', data: evt, conversationId: capturedConvId });
            if (onCommandOutput) onCommandOutput(initMsg);
          }
          
          else if (evt.event === 'step_update') {
            const step = evt.step_update || {};
            currentStepIndex = step.step_index !== undefined ? step.step_index : currentStepIndex;

            if (step.usage) {
              totalUsage = { ...totalUsage, ...step.usage };
              if (onTelemetry) onTelemetry({ ...totalUsage, duration: step.duration_seconds });
            }

            if (step.step_type === 'user_input') {
              if (onCommandOutput) onCommandOutput(`[AGY STEP #${step.step_index}] User prompt received.\n`);
            }

            else if (step.step_type === 'tool') {
              const toolName = step.tool_name || step.tool_info?.name || 'tool';
              const toolInfo = step.tool_info || {};
              const params = toolInfo.parameters || step.args || {};
              const state = step.state || 'ACTIVE';

              if (state === 'ACTIVE') {
                if (onStatus) onStatus({ status: 'CODING', tool: toolName, step: currentStepIndex });
                if (onCommandOutput) onCommandOutput(`[AGY TOOL EXEC] > ${toolName} [Step #${currentStepIndex}] (Running...)\n`);
                if (onStream) onStream({ type: 'tool_start', toolName, params, stepIndex: currentStepIndex });
              }

              if (['write_to_file', 'replace_file_content', 'multi_replace_file_content', 'sed_file'].includes(toolName)) {
                const targetFile = params.TargetFile || params.targetFile || params.path || params.file;
                if (targetFile) {
                  const relativePath = path.isAbsolute(targetFile) ? path.relative(cwd, targetFile) : targetFile;
                  const fullTargetFile = path.isAbsolute(targetFile) ? targetFile : path.join(cwd, targetFile);
                  const fileName = path.basename(targetFile);
                  const isCreate = toolName === 'write_to_file';
                  const operation = isCreate ? 'CREATED/OVERWRITTEN' : 'MODIFIED';
                  
                  totalModifiedFiles.add(relativePath);

                  let snippet = params.CodeContent || params.ReplacementContent || '';
                  if (!snippet && params.ReplacementChunks && Array.isArray(params.ReplacementChunks)) {
                    snippet = params.ReplacementChunks.map(c => c.ReplacementContent || '').join('\n---\n');
                  }

                  if (!snippet && fs.existsSync(fullTargetFile)) {
                    try {
                      snippet = fs.readFileSync(fullTargetFile, 'utf-8');
                    } catch (_) {}
                  }

                  const activityData = {
                    id: `${relativePath}_${Date.now()}`,
                    type: isCreate ? 'create' : 'modify',
                    filePath: fullTargetFile,
                    relativePath,
                    fileName,
                    operation,
                    snippet: snippet || `// File updated: ${relativePath}`,
                    timestamp: new Date().toISOString(),
                  };

                  if (onActivity) onActivity(activityData);
                  if (onStatus) onStatus({ status: 'CODING', currentFile: relativePath, step: currentStepIndex });
                  if (onStream) onStream({ type: 'file_edit', toolName, relativePath, operation });
                  if (onCommandOutput && state === 'DONE') {
                    onCommandOutput(`[AGY FILE ${operation}] ${relativePath} (${step.duration_seconds ? step.duration_seconds.toFixed(2) + 's' : 'done'})\n`);
                  }
                }
              }

              else if (toolName === 'run_command') {
                const cmd = params.CommandLine || params.command;
                if (cmd && state === 'ACTIVE') {
                  if (onCommandOutput) onCommandOutput(`[AGY RUN COMMAND] $ ${cmd}\n`);
                  if (onStream) onStream({ type: 'command_start', command: cmd });
                }
              }

              if (state === 'DONE') {
                const duration = step.duration_seconds ? `${step.duration_seconds.toFixed(2)}s` : '';
                if (onCommandOutput) onCommandOutput(`[AGY TOOL DONE] > ${toolName} finished ${duration}\n`);
                if (onStream) onStream({ type: 'tool_done', toolName, duration: step.duration_seconds });
              }
            }

            else if (step.step_type === 'agent_response') {
              if (step.text_delta) {
                fullAgentResponse += step.text_delta;
                if (onStream) onStream({ type: 'text', content: step.text_delta });
                if (onCommandOutput) onCommandOutput(step.text_delta);
              }

              if (step.state === 'DONE') {
                const dur = step.duration_seconds ? `${step.duration_seconds.toFixed(2)}s` : '';
                const tok = step.usage ? `Tokens: ${step.usage.total_tokens || 0}` : '';
                if (onCommandOutput) onCommandOutput(`\n[AGY RESPONSE COMPLETED] ${dur} ${tok}\n`);
                if (onStream) onStream({ type: 'agent_done', duration: step.duration_seconds, usage: step.usage });
              }
            }
          }
          
          else if (evt.event === 'result') {
            finalResult = evt.result;
            if (evt.result?.response) {
              fullAgentResponse = evt.result.response;
            }
            if (evt.result?.usage) {
              totalUsage = { ...totalUsage, ...evt.result.usage };
            }
            if (onStream) onStream({ type: 'result', data: evt.result });
            if (onCommandOutput) {
              const dur = evt.result?.duration_seconds ? `${evt.result.duration_seconds.toFixed(2)}s` : '';
              const status = evt.result?.status || 'COMPLETED';
              onCommandOutput(`\n[AGY EXECUTION ${status}] Turns: ${evt.result?.num_turns || 1} | Duration: ${dur} | Total Tokens: ${totalUsage.total_tokens || 'N/A'}\n`);
            }
          }
        } catch (_) {
          if (onCommandOutput) onCommandOutput(line + '\n');
        }
      };

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString('utf-8');
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          processLine(line);
        }
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString('utf-8');
        if (onCommandOutput) onCommandOutput(`[AGY STDERR] ${text}`);
      });

      child.on('error', (err) => {
        this.activeProcesses.delete(repoId);
        if (onStatus) onStatus({ status: 'FAILED', error: err.message });
        if (onCommandOutput) onCommandOutput(`\n[AGY PROCESS ERROR] ${err.message}\n`);
        reject(err);
      });

      child.on('close', (code) => {
        this.activeProcesses.delete(repoId);
        if (buffer && buffer.trim()) {
          processLine(buffer);
        }

        const success = code === 0 && (!finalResult || finalResult.status !== 'ERROR');
        const statusPayload = {
          status: success ? 'COMPLETED' : 'FAILED',
          exitCode: code,
          conversationId: capturedConvId,
          modifiedFiles: Array.from(totalModifiedFiles),
          response: fullAgentResponse || (finalResult && finalResult.response) || '',
          usage: totalUsage,
        };

        if (onStatus) onStatus(statusPayload);

        resolve({
          success,
          exitCode: code,
          conversationId: capturedConvId,
          modifiedFiles: Array.from(totalModifiedFiles),
          response: fullAgentResponse,
          rawResult: finalResult,
          usage: totalUsage,
        });
      });
    });
  }

  async runAgyCliDirect(repoId, cwd, fullCommand, callbacks = {}) {
    const { onOutput = () => {}, onExit = () => {} } = callbacks;

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd, { recursive: true });
    }

    onOutput(`[AGY TERMINAL] $ ${fullCommand}\n`);

    let cmd = fullCommand.trim();
    let bin = this.cliPath;
    let args = [];

    if (cmd.startsWith('agy ')) {
      cmd = cmd.slice(4).trim();
      args = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      args = args.map(a => a.replace(/^['"]|['"]$/g, ''));
    } else if (cmd === 'agy') {
      args = ['--help'];
    } else {
      return this.executeInstruction({
        repoId,
        cwd,
        instruction: fullCommand,
        onCommandOutput: onOutput,
        onStatus: (st) => onOutput(`[STATUS: ${st.status}]\n`),
      });
    }

    return new Promise((resolve) => {
      let child;
      try {
        child = spawn(bin, args, {
          cwd,
          env: {
            ...process.env,
            FORCE_COLOR: '1',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
      } catch (err) {
        onOutput(`[ERROR] Failed to run agy: ${err.message}\n`);
        onExit(1);
        return resolve({ exitCode: 1, error: err.message });
      }

      this.activeProcesses.set(repoId, child);

      child.stdout.on('data', (chunk) => {
        onOutput(chunk.toString('utf-8'));
      });

      child.stderr.on('data', (chunk) => {
        onOutput(chunk.toString('utf-8'));
      });

      child.on('error', (err) => {
        this.activeProcesses.delete(repoId);
        onOutput(`\n[PROCESS ERROR] ${err.message}\n`);
        onExit(1);
        resolve({ exitCode: 1, error: err.message });
      });

      child.on('close', (code) => {
        this.activeProcesses.delete(repoId);
        onOutput(`\n[Process finished with exit code ${code}]\n`);
        onExit(code);
        resolve({ exitCode: code });
      });
    });
  }

  stopExecution(repoId) {
    const proc = this.activeProcesses.get(repoId);
    if (proc) {
      try {
        proc.kill('SIGTERM');
        this.activeProcesses.delete(repoId);
        return true;
      } catch (err) {
        console.error(`[Antigravity] Error stopping process for repo ${repoId}:`, err);
      }
    }
    return false;
  }
}

export const antigravityService = new AntigravityService();
