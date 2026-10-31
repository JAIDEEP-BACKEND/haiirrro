import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'nehairo_secure_jwt_secret_cyber_2026_superkey',
  rootDir: process.platform === 'win32' ? 'C:\\' : '/',
  homeDir: os.homedir(),
  defaultWorkspaceDir: path.join(os.homedir(), 'nehairo-projects'),
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
    defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:1.5b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text:latest',
  },
  antigravity: {
    cliPath: process.env.AGY_CLI_PATH || 'agy',
    defaultArgs: ['--output-format', 'stream-json', '--dangerously-skip-permissions'],
    timeoutMs: parseInt(process.env.AGY_TIMEOUT_MS || '600000', 10),
  },
  git: {
    defaultAuthorName: process.env.GIT_AUTHOR_NAME || 'NEhAIro Operator',
    defaultAuthorEmail: process.env.GIT_AUTHOR_EMAIL || 'operator@nehairo.local',
  }
};
