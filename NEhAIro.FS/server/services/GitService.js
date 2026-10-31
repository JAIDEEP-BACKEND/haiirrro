import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

const execPromise = util.promisify(exec);

class GitService {
  async runGit(repoPath, command) {
    try {
      const { stdout, stderr } = await execPromise(`git ${command}`, {
        cwd: repoPath,
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: config.git.defaultAuthorName,
          GIT_AUTHOR_EMAIL: config.git.defaultAuthorEmail,
          GIT_COMMITTER_NAME: config.git.defaultAuthorName,
          GIT_COMMITTER_EMAIL: config.git.defaultAuthorEmail,
        },
      });
      return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err) {
      return {
        success: false,
        stdout: err.stdout ? err.stdout.trim() : '',
        stderr: err.stderr ? err.stderr.trim() : '',
        error: err.message,
      };
    }
  }

  async clone(cloneUrl, targetPath) {
    try {
      const { stdout, stderr } = await execPromise(`git clone "${cloneUrl}" "${targetPath}"`);
      return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err) {
      return {
        success: false,
        stdout: err.stdout ? err.stdout.trim() : '',
        stderr: err.stderr ? err.stderr.trim() : '',
        error: err.message,
      };
    }
  }

  isGitRepo(repoPath) {

    return fs.existsSync(path.join(repoPath, '.git'));
  }

  async init(repoPath, defaultBranch = 'main') {
    if (this.isGitRepo(repoPath)) {
      return { success: true, message: 'Already a git repository' };
    }
    const res = await this.runGit(repoPath, `init -b ${defaultBranch}`);
    if (!res.success) {
      return await this.runGit(repoPath, 'init');
    }
    return res;
  }

  async getStatus(repoPath) {
    if (!this.isGitRepo(repoPath)) {
      return { isRepo: false, files: [], branch: null };
    }

    const branchRes = await this.runGit(repoPath, 'branch --show-current');
    const branch = branchRes.stdout || 'main';

    const statusRes = await this.runGit(repoPath, 'status --porcelain');
    if (!statusRes.success) {
      return { isRepo: true, files: [], branch, error: statusRes.error };
    }

    const lines = statusRes.stdout.split('\n').filter(Boolean);
    const files = lines.map((line) => {
      const indexStatus = line.substring(0, 1);
      const workingTreeStatus = line.substring(1, 2);
      const filePath = line.substring(3).trim();
      return {
        path: filePath,
        indexStatus: indexStatus !== ' ' ? indexStatus : null,
        workingTreeStatus: workingTreeStatus !== ' ' ? workingTreeStatus : null,
        isStaged: indexStatus !== ' ' && indexStatus !== '?',
        isUntracked: indexStatus === '?' && workingTreeStatus === '?',
      };
    });

    const commitRes = await this.runGit(repoPath, 'log -1 --oneline');
    const lastCommit = commitRes.success ? commitRes.stdout : null;

    const remoteRes = await this.runGit(repoPath, 'remote -v');
    const remotes = remoteRes.success ? remoteRes.stdout : '';

    return {
      isRepo: true,
      branch,
      files,
      stagedCount: files.filter((f) => f.isStaged).length,
      unstagedCount: files.filter((f) => !f.isStaged).length,
      lastCommit,
      hasRemote: remotes.includes('origin'),
      remoteUrl: remotes,
    };
  }

  async stageAll(repoPath) {
    return await this.runGit(repoPath, 'add .');
  }

  async stageFile(repoPath, filePath) {
    return await this.runGit(repoPath, `add "${filePath}"`);
  }

  async unstageFile(repoPath, filePath) {
    return await this.runGit(repoPath, `restore --staged "${filePath}"`);
  }

  async commit(repoPath, message) {
    const escaped = message.replace(/"/g, '\\"');
    return await this.runGit(repoPath, `commit -m "${escaped}"`);
  }

  async getDiff(repoPath, filePath = null, staged = false) {
    const flag = staged ? '--staged' : '';
    const fileArg = filePath ? `"${filePath}"` : '';
    return await this.runGit(repoPath, `diff ${flag} ${fileArg}`);
  }

  async getLog(repoPath, maxCount = 20) {
    return await this.runGit(
      repoPath,
      `log -n ${maxCount} --pretty=format:"%h|%an|%ar|%s" --date=relative`
    );
  }

  async addRemote(repoPath, remoteUrl, remoteName = 'origin') {
    const checkRes = await this.runGit(repoPath, `remote get-url ${remoteName}`);
    if (checkRes.success) {
      return await this.runGit(repoPath, `remote set-url ${remoteName} "${remoteUrl}"`);
    }
    return await this.runGit(repoPath, `remote add ${remoteName} "${remoteUrl}"`);
  }

  async push(repoPath, branch = 'main', remote = 'origin', force = false) {
    const forceFlag = force ? '--force' : '';
    return await this.runGit(repoPath, `push -u ${remote} ${branch} ${forceFlag}`);
  }

  async pull(repoPath, branch = 'main', remote = 'origin') {
    return await this.runGit(repoPath, `pull ${remote} ${branch}`);
  }
}

export const gitService = new GitService();
