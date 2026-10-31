import { persistence } from './PersistenceService.js';

class GitHubService {
  getToken() {
    const settings = persistence.loadSettings();
    return settings.githubToken || process.env.GITHUB_TOKEN || null;
  }

  async testAuth(token = null) {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return { success: false, error: 'No GitHub token configured' };
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NEhAIro-Workstation/2.0',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.message || `GitHub API error: ${response.status}`,
        };
      }

      const user = await response.json();
      return {
        success: true,
        user: {
          login: user.login,
          name: user.name,
          avatarUrl: user.avatar_url,
          htmlUrl: user.html_url,
          publicRepos: user.public_repos,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async createRepository(repoName, description = '', isPrivate = false, token = null) {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return { success: false, error: 'No GitHub token configured' };
    }

    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'NEhAIro-Workstation/2.0',
        },
        body: JSON.stringify({
          name: repoName,
          description: description || 'Created with NEhAIro Developer Console',
          private: isPrivate,
          auto_init: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Failed to create repo: ${response.status}`,
          errors: data.errors,
        };
      }

      return {
        success: true,
        repo: {
          id: data.id,
          name: data.name,
          fullName: data.full_name,
          htmlUrl: data.html_url,
          cloneUrl: data.clone_url,
          sshUrl: data.ssh_url,
          isPrivate: data.private,
          defaultBranch: data.default_branch || 'main',
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async listRepositories(token = null) {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return { success: false, error: 'No GitHub token configured in Settings' };
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NEhAIro-Workstation',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.message || `GitHub API error: ${response.status}`,
        };
      }

      const repos = await response.json();
      return {
        success: true,
        repos: repos.map(r => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          owner: r.owner?.login,
          htmlUrl: r.html_url,
          cloneUrl: r.clone_url,
          sshUrl: r.ssh_url,
          isPrivate: r.private,
          description: r.description,
          defaultBranch: r.default_branch || 'main',
          stars: r.stargazers_count,
          updatedAt: r.updated_at
        }))
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getAuthenticatedCloneUrl(cloneUrl, token = null) {
    const activeToken = token || this.getToken();
    if (!activeToken) return cloneUrl;
    return cloneUrl.replace('https://', `https://${activeToken}@`);
  }
}

export const gitHubService = new GitHubService();

