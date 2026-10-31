import path from 'path';
import fs from 'fs';
import os from 'os';
import { repositoryManager } from './RepositoryManager.js';
import { antigravityService } from './AntigravityService.js';
import { gitService } from './GitService.js';
import { gitHubService } from './GitHubService.js';
import { vercelService } from './VercelService.js';
import { persistence } from './PersistenceService.js';
import { config } from '../config.js';

export class TaskOrchestrator {
  constructor(wsBroadcaster) {
    this.broadcast = wsBroadcaster || (() => {});
    this.activeTasks = new Map();
  }

  setBroadcaster(broadcaster) {
    this.broadcast = broadcaster;
  }

  parseIntent(prompt, currentActiveRepo) {
    const p = prompt.trim();
    const isCreateRepo = /create\s+(?:a\s+)?(?:new\s+)?(?:repo|repository)\s+(?:named|called)?\s*([a-zA-Z0-9_\-\.]+)/i.test(p);
    let repoNameMatch = p.match(/create\s+(?:a\s+)?(?:new\s+)?(?:repo|repository)\s+(?:named|called)?\s*["']?([a-zA-Z0-9_\-\.]+)["']?/i);
    let targetRepoName = repoNameMatch ? repoNameMatch[1] : null;

    const wantsPush = /\b(?:push|pushing|github|remote|origin)\b/i.test(p);

    const wantsVercel = /\b(?:host|deploy|vercel|publish|launch|live)\b/i.test(p) ||
                        /vercel\.app/i.test(p) ||
                        /\bhost\s+this\s+website\b/i.test(p);

    let vercelDomain = null;
    const domainMatch = p.match(/["']?([a-zA-Z0-9_\-\.]+)\.vercel\.app["']?/i);
    if (domainMatch) {
      vercelDomain = `${domainMatch[1].toLowerCase()}.vercel.app`;
    } else {
      const explicitDomain = p.match(/(?:domain|subdomain|host\s+(?:on|as|at)|like)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i);
      if (explicitDomain && !['a', 'the', 'this', 'github', 'vercel', 'it'].includes(explicitDomain[1].toLowerCase())) {
        vercelDomain = explicitDomain[1].includes('.') ? explicitDomain[1] : `${explicitDomain[1].toLowerCase()}.vercel.app`;
      }
    }

    const isCommitOnly = /^(?:commit|commit this|save)\b/i.test(p) && !/build|create|fix|add|update|host|deploy/i.test(p);
    const isPushOnly = /^(?:push|push to github|push changes)\b/i.test(p) && !/build|create|fix|add|update|host|deploy/i.test(p);

    return {
      isCreateRepo,
      targetRepoName,
      wantsPush,
      wantsVercel,
      vercelDomain,
      isCommitOnly,
      isPushOnly,
      instruction: p,
    };
  }

  async executeTask(options) {
    const {
      prompt,
      repoId = null,
      autoPush = true,
      autoDeployVercel = null,
      onProgress = null,
    } = options;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const intent = this.parseIntent(prompt, repoId ? repositoryManager.get(repoId) : repositoryManager.getActive());

    let activeRepo = repoId ? repositoryManager.get(repoId) : repositoryManager.getActive();
    const shouldVercel = autoDeployVercel !== null ? autoDeployVercel : intent.wantsVercel;

    const stages = [
      { id: 'prep', name: 'REPOSITORY PREPARATION', status: 'PENDING' },
      { id: 'agent', name: 'AI CODE CREATION', status: 'PENDING' },
      { id: 'audit', name: 'CODE AUDIT & DIFF', status: 'PENDING' },
      { id: 'git_commit', name: 'GIT STAGE & COMMIT', status: 'PENDING' },
    ];

    if (intent.wantsPush || autoPush) {
      stages.push({ id: 'github_remote', name: 'GITHUB REMOTE SETUP', status: 'PENDING' });
      stages.push({ id: 'github_push', name: 'GITHUB PUSH', status: 'PENDING' });
    }

    if (shouldVercel) {
      stages.push({ id: 'vercel_deploy', name: 'VERCEL HOSTING & DEPLOYMENT', status: 'PENDING' });
    }

    const taskRecord = {
      id: taskId,
      prompt,
      repoId: activeRepo?.id || null,
      repoName: activeRepo?.name || 'Workspace',
      status: 'RUNNING',
      currentStage: stages[0].name,
      stages,
      startedAt: new Date().toISOString(),
      completedAt: null,
      modifiedFiles: [],
      error: null,
    };

    this.activeTasks.set(taskId, taskRecord);

    const updateStage = (stageId, status, details = '') => {
      const s = taskRecord.stages.find((st) => st.id === stageId);
      if (s) {
        s.status = status;
        if (details) s.details = details;
        taskRecord.currentStage = s.name;
      }
      this.broadcast({
        type: 'TASK_UPDATED',
        task: taskRecord,
        repoId: activeRepo?.id,
      });
      if (onProgress) onProgress(taskRecord);
    };

    const emitLog = (text, streamType = 'primary') => {
      this.broadcast({
        type: 'TERMINAL_OUTPUT',
        repoId: activeRepo?.id,
        streamType,
        text,
      });
    };

    try {
      emitLog(`\n=======================================================\n[NEhAIro] TASK STARTED: ${prompt}\n=======================================================\n`);

      // STAGE 1: REPOSITORY PREPARATION
      updateStage('prep', 'RUNNING');

      if (intent.isCreateRepo && intent.targetRepoName) {
        emitLog(`[STAGE: PREP] Creating repository "${intent.targetRepoName}"...\n`);
        const baseDir = config.defaultWorkspaceDir;
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
        
        const newRepoPath = path.join(baseDir, intent.targetRepoName);
        activeRepo = repositoryManager.create(intent.targetRepoName, newRepoPath);
        taskRecord.repoId = activeRepo.id;
        taskRecord.repoName = activeRepo.name;
        emitLog(`[STAGE: PREP] Initialized repository at: ${newRepoPath}\n`);
      } else if (!activeRepo) {
        const defaultPath = path.join(config.defaultWorkspaceDir, 'default-workspace');
        activeRepo = repositoryManager.create('default-workspace', defaultPath);
        taskRecord.repoId = activeRepo.id;
        taskRecord.repoName = activeRepo.name;
      }

      const isGit = gitService.isGitRepo(activeRepo.localPath);
      if (!isGit) {
        await gitService.init(activeRepo.localPath, activeRepo.currentBranch || 'main');
        emitLog(`[STAGE: PREP] Git repository initialized in ${activeRepo.localPath}\n`);
      }

      updateStage('prep', 'COMPLETED');

      if (intent.isPushOnly) {
        updateStage('agent', 'SKIPPED');
        updateStage('audit', 'COMPLETED');
      } else {
        // STAGE 2: AI CODING
        updateStage('agent', 'RUNNING');
        emitLog(`[STAGE: AI CODE] Processing instruction in ${activeRepo.localPath}...\n`);

        const agyResult = await antigravityService.executeInstruction({
          repoId: activeRepo.id,
          cwd: activeRepo.localPath,
          instruction: prompt,
          conversationId: activeRepo.conversationId,
          onStream: (streamEvt) => {
            this.broadcast({
              type: 'AGY_STREAM_EVENT',
              repoId: activeRepo.id,
              event: streamEvt,
            });

            if (streamEvt.type === 'text') {
              this.broadcast({
                type: 'AGENT_STREAM',
                repoId: activeRepo.id,
                text: streamEvt.content,
              });
            }
          },
          onActivity: (activity) => {
            this.broadcast({
              type: 'CODE_ACTIVITY',
              repoId: activeRepo.id,
              activity,
            });
          },
          onTelemetry: (telemetry) => {
            this.broadcast({
              type: 'AGY_TELEMETRY',
              repoId: activeRepo.id,
              telemetry,
            });
          },
          onCommandOutput: (chunk) => {
            emitLog(chunk, 'agy');
          },
        });

        if (!agyResult.success) {
          throw new Error(`Antigravity execution failed with exit code ${agyResult.exitCode}`);
        }

        if (agyResult.conversationId) {
          activeRepo.conversationId = agyResult.conversationId;
          repositoryManager.saveToPersistence();
        }

        taskRecord.modifiedFiles = agyResult.modifiedFiles;
        taskRecord.usage = agyResult.usage;
        updateStage('agent', 'COMPLETED');
      }

      // STAGE 3: CODE AUDIT & DIFF
      updateStage('audit', 'RUNNING');
      const gitStatus = await gitService.getStatus(activeRepo.localPath);
      activeRepo.gitStatus = gitStatus;
      const totalChanges = (gitStatus.files || []).length;
      emitLog(`[STAGE: AUDIT] Discovered ${totalChanges} changed/uncommitted files.\n`);
      updateStage('audit', 'COMPLETED');

      // STAGE 4: GIT STAGE & COMMIT
      updateStage('git_commit', 'RUNNING');
      if (totalChanges > 0) {
        emitLog(`[STAGE: GIT] Staging all changes (git add .)...\n`);
        await gitService.stageAll(activeRepo.localPath);

        let commitMsg = `feat: ${prompt.slice(0, 72)}`;
        if (/fix|bug|broken|error|correct/i.test(prompt)) {
          commitMsg = `fix: ${prompt.slice(0, 72)}`;
        } else if (/refactor|clean|update/i.test(prompt)) {
          commitMsg = `refactor: ${prompt.slice(0, 72)}`;
        }

        emitLog(`[STAGE: GIT] Committing: "${commitMsg}"...\n`);
        const commitRes = await gitService.commit(activeRepo.localPath, commitMsg);
        if (!commitRes.success && !commitRes.stdout.includes('nothing to commit')) {
          emitLog(`[STAGE: GIT ERROR] ${commitRes.stderr || commitRes.stdout}\n`);
        } else {
          emitLog(`[STAGE: GIT] Commit successful.\n`);
        }
      } else {
        emitLog(`[STAGE: GIT] Working tree clean. Nothing new to commit.\n`);
      }
      updateStage('git_commit', 'COMPLETED');

      // STAGE 5 & 6: GITHUB REMOTE & PUSH
      if (intent.wantsPush || autoPush) {
        updateStage('github_remote', 'RUNNING');

        let currentRemote = activeRepo.gitRemote || gitStatus.remoteUrl;
        const token = gitHubService.getToken();

        if (!currentRemote && token) {
          emitLog(`[STAGE: GITHUB] Creating GitHub repository "${activeRepo.name}"...\n`);
          const ghRes = await gitHubService.createRepository(activeRepo.name, `Created with NEhAIro: ${prompt.slice(0, 80)}`);
          if (ghRes.success) {
            currentRemote = ghRes.repo.cloneUrl;
            await gitService.addRemote(activeRepo.localPath, currentRemote);
            activeRepo.gitRemote = currentRemote;
            activeRepo.githubRepo = ghRes.repo.htmlUrl;
            repositoryManager.saveToPersistence();
            emitLog(`[STAGE: GITHUB] GitHub repository created: ${ghRes.repo.htmlUrl}\n`);
          } else {
            emitLog(`[STAGE: GITHUB WARNING] Could not create remote: ${ghRes.error}\n`);
          }
        }

        updateStage('github_remote', 'COMPLETED');

        // PUSH
        updateStage('github_push', 'RUNNING');
        if (currentRemote) {
          emitLog(`[STAGE: PUSH] Pushing to remote ${currentRemote}...\n`);
          const pushRes = await gitService.push(activeRepo.localPath, activeRepo.currentBranch || 'main');
          if (pushRes.success) {
            emitLog(`[STAGE: PUSH] Push completed successfully.\n`);
            updateStage('github_push', 'COMPLETED');
          } else {
            emitLog(`[STAGE: PUSH FAILED] ${pushRes.stderr || pushRes.error}\n`);
            updateStage('github_push', 'FAILED', pushRes.stderr);
          }
        } else {
          emitLog(`[STAGE: PUSH SKIPPED] No remote URL configured.\n`);
          updateStage('github_push', 'SKIPPED');
        }
      }

      taskRecord.status = 'COMPLETED';
      taskRecord.completedAt = new Date().toISOString();

      emitLog(`\n=======================================================\n[NEhAIro] TASK COMPLETE: ${activeRepo.name} is ready.\n=======================================================\n`);

      this.broadcast({
        type: 'TASK_COMPLETED',
        task: taskRecord,
        repo: activeRepo,
      });

      return {
        success: true,
        task: taskRecord,
        repo: activeRepo,
      };
    } catch (err) {
      console.error('[TaskOrchestrator] Task execution error:', err);
      taskRecord.status = 'FAILED';
      taskRecord.error = err.message;
      taskRecord.completedAt = new Date().toISOString();

      emitLog(`\n[NEhAIro ERROR] Task failed: ${err.message}\n`);

      this.broadcast({
        type: 'TASK_FAILED',
        task: taskRecord,
        error: err.message,
        repoId: activeRepo?.id,
      });

      return {
        success: false,
        task: taskRecord,
        error: err.message,
      };
    }
  }

  stopTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task && task.repoId) {
      antigravityService.stopExecution(task.repoId);
      task.status = 'STOPPED';
      this.broadcast({
        type: 'TASK_STOPPED',
        taskId,
      });
      return true;
    }
    return false;
  }
}
