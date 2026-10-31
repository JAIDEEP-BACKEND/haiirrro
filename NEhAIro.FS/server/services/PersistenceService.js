import fs from 'fs';
import path from 'path';
import os from 'os';

class PersistenceService {
  constructor() {
    this.storageDir = path.join(os.homedir(), '.nehairo');
    this.reposFile = path.join(this.storageDir, 'repositories.json');
    this.settingsFile = path.join(this.storageDir, 'settings.json');
    this.init();
  }

  init() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  loadRepositories() {
    try {
      if (fs.existsSync(this.reposFile)) {
        const raw = fs.readFileSync(this.reposFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {}
    return [];
  }

  saveRepositories(repos) {
    try {
      fs.writeFileSync(this.reposFile, JSON.stringify(repos, null, 2), 'utf-8');
    } catch (err) {}
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {}
    return {
      githubToken: process.env.GITHUB_TOKEN || '',
      vercelToken: process.env.VERCEL_TOKEN || '',
      ollamaModel: 'qwen2.5-coder:7b',
      theme: 'cyber-dark'
    };
  }

  saveSettings(settings) {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...settings };
      fs.writeFileSync(this.settingsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {}
  }
}

export const persistence = new PersistenceService();
