import axios from 'axios';

// Dynamically determine host and protocol so any device on the network can access it
const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const protocol = isBrowser && window.location.protocol === 'https:' ? 'https:' : 'http:';
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
// If accessing via Vite dev server port 5173, point API to 3001; if accessing fullstack build on 3001 or other port, use window.location.port or 3001
const apiPort = isBrowser && window.location.port === '5173' ? '3001' : (isBrowser && window.location.port ? window.location.port : '3001');

export const API_BASE = isBrowser ? `${protocol}//${host}:${apiPort}` : 'http://localhost:3001';
export const WS_BASE = isBrowser ? `${wsProtocol}//${host}:${apiPort}` : 'ws://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nehairo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: (username, password) => apiClient.post('/api/auth/login', { username, password }),
  getUsers: () => apiClient.get('/api/users'),
  createUser: (data) => apiClient.post('/api/users', data),
  deleteUser: (id) => apiClient.delete(`/api/users/${id}`),

  // File System
  getDrives: () => apiClient.get('/api/files/drives'),
  getFiles: (path = '') => apiClient.get(`/api/files?path=${encodeURIComponent(path)}`),
  getFileContent: (path) => apiClient.get(`/api/files/content?path=${encodeURIComponent(path)}`),
  saveFileContent: (path, content) => apiClient.post('/api/files/content', { path, content }),
  uploadFiles: (formData, targetPath = '') => apiClient.post(`/api/files/upload?path=${encodeURIComponent(targetPath)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createFolder: (path, name) => apiClient.post('/api/files/folder', { path, name }),
  createFile: (path, name, content = '') => apiClient.post('/api/files/create', { path, name, content }),
  moveItem: (oldPath, newPath) => apiClient.put('/api/files/move', { oldPath, newPath }),
  deleteItem: (path) => apiClient.delete(`/api/files?path=${encodeURIComponent(path)}`),
  getDownloadUrl: (filePath) => `${API_BASE}/api/files/download?path=${encodeURIComponent(filePath)}&token=${localStorage.getItem('nehairo_token') || ''}`,
  getPreviewUrl: (filePath) => `${API_BASE}/api/files/preview?path=${encodeURIComponent(filePath)}&token=${localStorage.getItem('nehairo_token') || ''}`,

  // Format Hub
  getFormatCategories: () => apiClient.get('/api/formats/categories'),
  scanByFormat: (path, category = 'all') => apiClient.get(`/api/formats/scan?path=${encodeURIComponent(path)}&category=${category}`),
  autoOrganize: (path) => apiClient.post('/api/formats/auto-organize', { path }),
  segregateFormat: (sourceDir, category, targetDir) => apiClient.post('/api/formats/segregate', { sourceDir, category, targetDir }),

  // AI & File Finder
  findFiles: (params) => apiClient.post('/api/ai/find-files', params),
  huntFiles: (prompt) => apiClient.post('/api/ai/hunt', { prompt }),

  // Ollama
  getOllamaStatus: () => apiClient.get('/api/ollama/status'),
  getOllamaModels: () => apiClient.get('/api/ollama/models'),
  setOllamaModel: (model) => apiClient.post('/api/ollama/set-model', { model }),
  pullOllamaModel: (model) => apiClient.post('/api/ollama/pull', { model }),
  chatOllama: (messages, options) => apiClient.post('/api/ollama/chat', { messages, options }),

  // Repositories & Workspaces
  getRepos: () => apiClient.get('/api/repos'),
  createRepo: (data) => apiClient.post('/api/repos', data),
  addExistingRepo: (data) => apiClient.post('/api/repos/add-existing', data),
  selectRepo: (id) => apiClient.post('/api/repos/select', { id }),
  deleteRepo: (id) => apiClient.delete(`/api/repos/${id}`),

  // Git & GitHub
  getGitStatus: () => apiClient.get('/api/git/status'),
  gitCommit: (message) => apiClient.post('/api/git/commit', { message }),
  getGitDiff: () => apiClient.get('/api/git/diff'),
  getGitLog: () => apiClient.get('/api/git/log'),
  testGitHubAuth: () => apiClient.get('/api/github/auth'),
  getGitHubRepos: () => apiClient.get('/api/github/repos'),
  cloneGitHubRepo: (data) => apiClient.post('/api/repos/clone-github', data),
  getSettings: () => apiClient.get('/api/settings'),
  saveSettings: (settings) => apiClient.post('/api/settings', settings),


  // Tasks
  executeTask: (data) => apiClient.post('/api/tasks/execute', data),
  stopTask: (taskId) => apiClient.post('/api/tasks/stop', { taskId }),

  // Telemetry & C2
  getVitals: () => apiClient.get('/api/system/vitals'),
  getProcesses: () => apiClient.get('/api/system/processes'),
  killProcess: (pid) => apiClient.post('/api/system/processes/kill', { pid }),
  executePower: (action) => apiClient.post('/api/system/power', { action }),
  executeSystemProtocol: (command) => apiClient.post('/api/ai/execute', { command }),
  getScreenshotUrl: () => `${API_BASE}/api/system/screenshot?token=${localStorage.getItem('nehairo_token') || ''}&t=${Date.now()}`,
  getActivityLogs: () => apiClient.get('/api/logs'),
};

