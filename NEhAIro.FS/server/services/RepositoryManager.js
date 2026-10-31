import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { persistence } from './PersistenceService.js';
import { config } from '../config.js';

class RepositoryManager {
  constructor() {
    this.repositories = new Map();
    this.activeRepoId = null;
    this.loadFromPersistence();
  }

  loadFromPersistence() {
    const saved = persistence.loadRepositories();
    for (const repo of saved) {
      if (fs.existsSync(repo.localPath)) {
        this.repositories.set(repo.id, {
          ...repo,
          lastAccessed: repo.lastAccessed || new Date().toISOString(),
        });
      }
    }
    if (this.repositories.size > 0 && !this.activeRepoId) {
      this.activeRepoId = this.repositories.keys().next().value;
    }
  }

  saveToPersistence() {
    const list = Array.from(this.repositories.values());
    persistence.saveRepositories(list);
  }

  list() {
    return Array.from(this.repositories.values()).map(r => ({
      ...r,
      isActive: r.id === this.activeRepoId,
      exists: fs.existsSync(r.localPath),
    }));
  }

  get(id) {
    return this.repositories.get(id) || null;
  }

  getActive() {
    if (!this.activeRepoId) return null;
    return this.get(this.activeRepoId);
  }

  setActive(id) {
    if (this.repositories.has(id)) {
      this.activeRepoId = id;
      const repo = this.repositories.get(id);
      repo.lastAccessed = new Date().toISOString();
      this.saveToPersistence();
      return repo;
    }
    return null;
  }

  create(name, customPath = null, description = '') {
    const id = uuidv4().slice(0, 8);
    const localPath = customPath || path.join(config.defaultWorkspaceDir, name);

    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }

    const repo = {
      id,
      name,
      localPath,
      description,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      gitRemote: null,
      githubRepo: null,
      vercelDeploy: null,
      status: 'IDLE',
      currentBranch: 'main',
      taskHistory: [],
    };

    this.repositories.set(id, repo);
    this.activeRepoId = id;
    this.saveToPersistence();
    return repo;
  }

  addExisting(localPath, name = null) {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Directory does not exist: ${localPath}`);
    }

    const repoName = name || path.basename(localPath);
    for (const [, existing] of this.repositories) {
      if (path.resolve(existing.localPath) === path.resolve(localPath)) {
        this.activeRepoId = existing.id;
        return existing;
      }
    }

    const id = uuidv4().slice(0, 8);
    const repo = {
      id,
      name: repoName,
      localPath: path.resolve(localPath),
      description: 'Imported workspace',
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      gitRemote: null,
      githubRepo: null,
      vercelDeploy: null,
      status: 'IDLE',
      currentBranch: 'main',
      taskHistory: [],
    };

    this.repositories.set(id, repo);
    this.activeRepoId = id;
    this.saveToPersistence();
    return repo;
  }

  remove(id) {
    const deleted = this.repositories.delete(id);
    if (this.activeRepoId === id) {
      this.activeRepoId = this.repositories.size > 0 
        ? this.repositories.keys().next().value 
        : null;
    }
    this.saveToPersistence();
    return deleted;
  }

  update(id, updates) {
    const repo = this.repositories.get(id);
    if (!repo) return null;
    Object.assign(repo, updates);
    this.saveToPersistence();
    return repo;
  }
}

export const repositoryManager = new RepositoryManager();
