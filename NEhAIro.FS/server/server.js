import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

import { config } from './config.js';
import db from './database.js';
import { authenticate, authorizeAdmin } from './auth.js';
import { fileSystemService } from './services/FileSystemService.js';
import { formatManager, FORMAT_CATEGORIES } from './services/FormatManager.js';
import { aiFileFinder } from './services/AiFileFinder.js';
import { ollamaService } from './services/OllamaService.js';
import { repositoryManager } from './services/RepositoryManager.js';
import { antigravityService } from './services/AntigravityService.js';
import { gitService } from './services/GitService.js';
import { gitHubService } from './services/GitHubService.js';
import { vercelService } from './services/VercelService.js';
import { terminalService } from './services/TerminalService.js';
import { persistence } from './services/PersistenceService.js';
import { TaskOrchestrator } from './services/TaskOrchestrator.js';
import { telemetryService } from './services/TelemetryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Multi-client WebSocket Broadcaster
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

const taskOrchestrator = new TaskOrchestrator(broadcast);

// Activity Logging Helper
const logActivity = (userId, action, details) => {
  const timestamp = new Date().toISOString();
  db.run("INSERT INTO activity_logs (userId, action, details, timestamp) VALUES (?, ?, ?, ?)", [userId || 'system', action, details, timestamp]);
  broadcast({ type: 'ACTIVITY_LOGGED', action, details, timestamp });
};

// File Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const rawPath = req.query.path || req.body?.path || config.homeDir;
      const safePath = fileSystemService.resolveSafePath(rawPath);
      fs.ensureDirSync(safePath);
      cb(null, safePath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 500 * 1024 * 1024 } 
});

// ==========================================
// 1. AUTH & USER MANAGEMENT ROUTES
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      canUpload: user.canUpload == 1 || user.canUpload === true,
      canDelete: user.canDelete == 1 || user.canDelete === true,
      canDownload: user.canDownload == 1 || user.canDownload === true
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
    logActivity(user.id, 'login', `Operator ${user.username} logged in`);
    res.json({ token, user: payload });
  });
});

app.get('/api/users', authenticate, authorizeAdmin, (req, res) => {
  db.all("SELECT id, username, role, canUpload, canDelete, canDownload, createdAt FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', authenticate, authorizeAdmin, async (req, res) => {
  const { username, password, role, canUpload, canDelete, canDownload } = req.body;
  try {
    const hash = await bcrypt.hash(password || 'operator123', 10);
    db.run(
      "INSERT INTO users (id, username, password, role, canUpload, canDelete, canDownload) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [uuidv4(), username, hash, role || 'operator', canUpload ? 1 : 0, canDelete ? 1 : 0, canDownload ? 1 : 0],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already taken' });
          return res.status(500).json({ error: err.message });
        }
        logActivity(req.user.id, 'create_user', `Created user ${username}`);
        res.json({ message: 'User created successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticate, authorizeAdmin, (req, res) => {
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    logActivity(req.user.id, 'delete_user', `Removed user ${req.params.id}`);
    res.json({ message: 'User deleted' });
  });
});

// ==========================================
// 2. FILE SYSTEM ROUTES
// ==========================================
app.get('/api/files/drives', async (req, res) => {
  try {
    const drives = await fileSystemService.getDrives();
    res.json(drives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path || config.rootDir;
    const listing = await fileSystemService.listDirectory(dirPath);
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/content', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Missing path parameter' });
    const content = await fileSystemService.readFileContent(filePath);
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/content', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Missing path parameter' });
    const saved = await fileSystemService.writeFileContent(filePath, content);
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: filePath });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/upload', (req, res) => {
  upload.array('files')(req, res, (err) => {
    if (err) {
      console.error('File upload error:', err.message);
      return res.status(500).json({ error: `Upload error: ${err.message}` });
    }
    const targetPath = req.query.path || req.body?.path || config.homeDir;
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: targetPath });
    logActivity(req.user?.id, 'upload', `Uploaded ${req.files?.length || 0} file(s) to ${targetPath}`);
    res.json({ message: 'Files uploaded successfully', count: req.files?.length || 0 });
  });
});

app.get('/api/files/download', (req, res) => {
  try {
    const filePath = fileSystemService.resolveSafePath(req.query.path);
    res.download(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'File not found or access denied' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/preview', (req, res) => {
  try {
    const filePath = fileSystemService.resolveSafePath(req.query.path);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'File not found or preview unsupported' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/folder', async (req, res) => {
  try {
    const { path: dirPath, name } = req.body;
    const result = await fileSystemService.createFolder(dirPath, name);
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: dirPath });
    logActivity(req.user?.id, 'create_folder', `Created folder: ${name} in ${dirPath}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/create', async (req, res) => {
  try {
    const { path: dirPath, name, content } = req.body;
    const result = await fileSystemService.createFile(dirPath, name, content || '');
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: dirPath });
    logActivity(req.user?.id, 'create_file', `Created file: ${name} in ${dirPath}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/files/move', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    const result = await fileSystemService.moveOrRename(oldPath, newPath);
    broadcast({ type: 'FILE_SYSTEM_UPDATED', from: oldPath, to: newPath });
    logActivity(req.user?.id, 'move_rename', `Moved/Renamed ${oldPath} -> ${newPath}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/files', async (req, res) => {
  try {
    const itemPath = req.query.path;
    const result = await fileSystemService.deleteItem(itemPath);
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: itemPath });
    logActivity(req.user?.id, 'delete_file', `Deleted item: ${itemPath}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. FORMAT MANAGEMENT HUB ROUTES
// ==========================================
app.get('/api/formats/categories', (req, res) => {
  res.json(FORMAT_CATEGORIES);
});

app.get('/api/formats/scan', async (req, res) => {
  try {
    const dirPath = req.query.path || config.rootDir;
    const category = req.query.category || 'all';
    const files = await formatManager.scanByFormat(dirPath, category);
    res.json({ path: dirPath, category, total: files.length, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/formats/auto-organize', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    const result = await formatManager.autoOrganize(dirPath);
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: dirPath });
    logActivity(req.user?.id, 'format_auto_organize', `Auto-organized ${result.totalMoved} files in ${dirPath}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/formats/segregate', async (req, res) => {
  try {
    const { sourceDir, category, targetDir } = req.body;
    const result = await formatManager.batchMoveCategory(sourceDir, category, targetDir);
    broadcast({ type: 'FILE_SYSTEM_UPDATED', path: sourceDir });
    logActivity(req.user?.id, 'format_segregate', `Segregated ${result.totalMoved} ${category} files to ${targetDir}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. AI FILE FINDER & INTELLIGENCE
// ==========================================
app.post('/api/ai/find-files', async (req, res) => {
  try {
    const searchParams = req.body;
    const results = await aiFileFinder.findFiles(searchParams);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/hunt', async (req, res) => {
  try {
    const { prompt } = req.body;
    const results = await aiFileFinder.naturalLanguageHunt(prompt);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. OLLAMA MODEL & AI CHAT ROUTES
// ==========================================
app.get('/api/ollama/status', async (req, res) => {
  const status = await ollamaService.checkStatus();
  res.json(status);
});

app.get('/api/ollama/models', async (req, res) => {
  const models = await ollamaService.getModels();
  res.json({ models, activeModel: ollamaService.activeModel });
});

app.post('/api/ollama/set-model', (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'Model name required' });
  const active = ollamaService.setModel(model);
  res.json({ success: true, activeModel: active });
});

app.post('/api/ollama/pull', async (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'Model name required' });

  try {
    broadcast({ type: 'OLLAMA_PULL_START', model });
    await ollamaService.pullModel(model, (progress) => {
      broadcast({ type: 'OLLAMA_PULL_PROGRESS', model, progress });
    });
    broadcast({ type: 'OLLAMA_PULL_COMPLETE', model });
    res.json({ success: true, message: `Model ${model} downloaded successfully` });
  } catch (err) {
    broadcast({ type: 'OLLAMA_PULL_ERROR', model, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ollama/chat', async (req, res) => {
  try {
    const { messages, options } = req.body;
    const response = await ollamaService.generateChat(messages, options);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. REPOSITORY & DEVELOPER WORKSPACES
// ==========================================
app.get('/api/repos', (req, res) => {
  res.json(repositoryManager.list());
});

app.post('/api/repos', (req, res) => {
  try {
    const { name, customPath, description } = req.body;
    const repo = repositoryManager.create(name, customPath, description);
    broadcast({ type: 'REPOS_UPDATED', repos: repositoryManager.list() });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/repos/add-existing', (req, res) => {
  try {
    const { path: localPath, name } = req.body;
    const repo = repositoryManager.addExisting(localPath, name);
    broadcast({ type: 'REPOS_UPDATED', repos: repositoryManager.list() });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/repos/select', (req, res) => {
  const { id } = req.body;
  const repo = repositoryManager.setActive(id);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  broadcast({ type: 'ACTIVE_REPO_CHANGED', repoId: id });
  res.json(repo);
});

app.delete('/api/repos/:id', (req, res) => {
  const success = repositoryManager.remove(req.params.id);
  broadcast({ type: 'REPOS_UPDATED', repos: repositoryManager.list() });
  res.json({ success });
});

// ==========================================
// 7. GIT & GITHUB ROUTES
// ==========================================
app.get('/api/git/status', async (req, res) => {
  const repo = repositoryManager.getActive();
  if (!repo) return res.json({ isRepo: false });
  const status = await gitService.getStatus(repo.localPath);
  res.json(status);
});

app.post('/api/git/commit', async (req, res) => {
  const { message } = req.body;
  const repo = repositoryManager.getActive();
  if (!repo) return res.status(400).json({ error: 'No active repository' });

  await gitService.stageAll(repo.localPath);
  const result = await gitService.commit(repo.localPath, message || 'Update code');
  res.json(result);
});

app.get('/api/git/diff', async (req, res) => {
  const repo = repositoryManager.getActive();
  if (!repo) return res.json({ diff: '' });
  const diff = await gitService.getDiff(repo.localPath);
  res.json({ diff: diff.stdout });
});

app.get('/api/git/log', async (req, res) => {
  const repo = repositoryManager.getActive();
  if (!repo) return res.json({ log: [] });
  const log = await gitService.getLog(repo.localPath);
  res.json({ log: log.stdout.split('\n').filter(Boolean) });
});

app.get('/api/github/auth', async (req, res) => {
  const result = await gitHubService.testAuth();
  res.json(result);
});

app.get('/api/github/repos', async (req, res) => {
  const result = await gitHubService.listRepositories();
  res.json(result);
});

app.post('/api/github/create-repo', async (req, res) => {
  const { name, description, isPrivate } = req.body;
  const result = await gitHubService.createRepository(name, description, isPrivate);
  res.json(result);
});

app.post('/api/repos/clone-github', async (req, res) => {
  try {
    const { cloneUrl, name, targetPath } = req.body;
    if (!cloneUrl) return res.status(400).json({ error: 'Clone URL is required' });

    const finalDir = targetPath || path.join(config.defaultWorkspaceDir, name || path.basename(cloneUrl, '.git'));
    const authUrl = gitHubService.getAuthenticatedCloneUrl(cloneUrl);

    await fs.ensureDir(path.dirname(finalDir));

    const cloneResult = await gitService.clone(authUrl, finalDir);
    if (!cloneResult.success) {
      return res.status(500).json({ error: `Git clone failed: ${cloneResult.stderr || cloneResult.error}` });
    }

    const newRepo = repositoryManager.addExisting(finalDir, name);
    repositoryManager.setActive(newRepo.id);
    broadcast({ type: 'REPOS_UPDATED', repos: repositoryManager.list() });
    broadcast({ type: 'ACTIVE_REPO_CHANGED', repoId: newRepo.id });
    logActivity(req.user?.id, 'clone_repo', `Cloned GitHub repo ${name} -> ${finalDir}`);

    res.json({ success: true, repo: newRepo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/settings', (req, res) => {
  res.json(persistence.loadSettings());
});

app.post('/api/settings', (req, res) => {
  persistence.saveSettings(req.body);
  res.json({ success: true, settings: persistence.loadSettings() });
});

// ==========================================
// 8. AUTONOMOUS TASK ORCHESTRATOR
// ==========================================
app.post('/api/tasks/execute', async (req, res) => {
  const { prompt, repoId, autoPush, autoDeployVercel } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  // Execute in background and broadcast status
  taskOrchestrator.executeTask({
    prompt,
    repoId,
    autoPush,
    autoDeployVercel
  });

  res.json({ message: 'Task execution started', prompt });
});

app.post('/api/tasks/stop', (req, res) => {
  const { taskId } = req.body;
  const stopped = taskOrchestrator.stopTask(taskId);
  res.json({ success: stopped });
});

import { spawn, exec } from 'child_process';

// ==========================================
// 9. SYSTEM TELEMETRY & REMOTE NODE CONTROL
// ==========================================
app.get('/api/system', async (req, res) => {
  const vitals = await telemetryService.getSystemVitals();
  res.json({
    cpu: vitals?.cpu?.load || 0,
    memory: { used: vitals?.memory?.used || 0, total: vitals?.memory?.total || 1 },
    os: vitals?.os?.distro || 'Windows',
    disk: vitals?.disks?.[0] ? { used: vitals.disks[0].used, size: vitals.disks[0].size } : null
  });
});

app.get('/api/system/vitals', async (req, res) => {
  const vitals = await telemetryService.getSystemVitals();
  res.json(vitals);
});

app.get('/api/system/processes', async (req, res) => {
  const list = await telemetryService.getProcesses();
  res.json(list);
});

app.post('/api/system/processes/kill', async (req, res) => {
  try {
    const { pid } = req.body;
    const result = await telemetryService.killProcess(pid);
    logActivity(req.user?.id, 'kill_process', `Terminated PID ${pid}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/system/screenshot', async (req, res) => {
  try {
    const imgBuffer = await telemetryService.captureScreenshot();
    res.set('Content-Type', 'image/jpeg');
    res.send(imgBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/power', (req, res) => {
  const { action } = req.body;
  logActivity(req.user?.id, 'power_command', `Executed power protocol: ${action}`);
  telemetryService.executePower(action)
    .then(r => res.json(r))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/ai/execute', async (req, res) => {
  try {
    const { command } = req.body;
    const result = await telemetryService.executeSystemProtocol(command);
    logActivity(req.user?.id, 'ai_command', `Executed system protocol: ${result.protocol}`);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/logs', (req, res) => {
  db.all("SELECT activity_logs.*, users.username FROM activity_logs LEFT JOIN users ON activity_logs.userId = users.id ORDER BY timestamp DESC LIMIT 100", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ==========================================
// 10. WEBSOCKET & DUAL TERMINALS & REMOTE DESKTOP
// ==========================================
wss.on('connection', (ws) => {
  let screenStreamInterval = null;
  let psProcess = null;

  const initPowerShellInput = () => {
    if (process.platform !== 'win32' || psProcess) return;
    try {
      psProcess = spawn('powershell.exe', ['-NoExit', '-Command', '-'], { shell: false });
      psProcess.stdin.write(`
        $ErrorActionPreference = 'SilentlyContinue';
        Add-Type -AssemblyName System.Windows.Forms, System.Drawing;
        $sig = '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);';
        if (-not ([System.Management.Automation.PSTypeName]'Win32Functions.Win32Mouse').Type) {
          Add-Type -MemberDefinition $sig -Name Win32Mouse -Namespace Win32Functions
        }
      \n`);
      psProcess.on('error', () => {});
    } catch (e) {}
  };

  const startScreenStream = async () => {
    if (screenStreamInterval) clearInterval(screenStreamInterval);
    const res = await telemetryService.getDisplayResolution();
    ws.send(JSON.stringify({ type: 'SCREEN_INIT', width: res.width, height: res.height }));
    initPowerShellInput();

    const captureFrame = async () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      try {
        const imgBuffer = await telemetryService.captureScreenshot();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'SCREEN_FRAME',
            frame: `data:image/jpeg;base64,${imgBuffer.toString('base64')}`,
            timestamp: Date.now()
          }));
        }
      } catch (err) {}
    };

    captureFrame();
    screenStreamInterval = setInterval(captureFrame, 80);
  };

  const stopScreenStream = () => {
    if (screenStreamInterval) {
      clearInterval(screenStreamInterval);
      screenStreamInterval = null;
    }
  };

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    serverTime: new Date().toISOString(),
    activeRepoId: repositoryManager.activeRepoId,
    ollamaModel: ollamaService.activeModel
  }));

  ws.on('message', async (rawMsg) => {
    try {
      const data = JSON.parse(rawMsg.toString('utf-8'));

      // 1. Antigravity Direct Terminal Input
      if (data.type === 'AGY_INPUT') {
        const { repoId, command } = data;
        const targetRepo = repoId ? repositoryManager.get(repoId) : repositoryManager.getActive();
        const targetCwd = targetRepo?.localPath || process.cwd();

        antigravityService.runAgyCliDirect(repoId || 'global', targetCwd, command, {
          onOutput: (chunk) => {
            broadcast({ type: 'TERMINAL_OUTPUT', repoId, streamType: 'agy', text: chunk });
          },
          onExit: (code) => {
            broadcast({ type: 'AGY_STATUS', repoId, status: code === 0 ? 'COMPLETED' : 'FAILED', exitCode: code });
          }
        });
      }

      // 2. Interactive System Shell Input
      else if (data.type === 'SHELL_INPUT') {
        const { repoId, command, cwd } = data;
        const targetRepo = repoId ? repositoryManager.get(repoId) : repositoryManager.getActive();
        const targetCwd = cwd || targetRepo?.localPath || process.cwd();

        broadcast({ type: 'TERMINAL_OUTPUT', repoId, streamType: 'shell', text: `PS ${targetCwd}> ${command}\n` });

        terminalService.execute(command, targetCwd, {
          onStdout: (out) => broadcast({ type: 'TERMINAL_OUTPUT', repoId, streamType: 'shell', text: out }),
          onStderr: (err) => broadcast({ type: 'TERMINAL_OUTPUT', repoId, streamType: 'shell', text: err }),
          onExit: (code) => broadcast({ type: 'SHELL_COMMAND_DONE', repoId, exitCode: code })
        });
      }

      // 3. Desktop Stream Controls (NEXUS.FS Live Remote Desktop)
      else if (data.type === 'START_SCREEN_STREAM' || data.type === 'start_screen_stream') {
        startScreenStream();
      }

      else if (data.type === 'STOP_SCREEN_STREAM' || data.type === 'stop_screen_stream') {
        stopScreenStream();
      }

      else if (data.type === 'REMOTE_INPUT' || data.type === 'remote_input') {
        const inputData = data.payload || data;
        const { type, x, y, button, key } = inputData;
        if (!psProcess) initPowerShellInput();

        if (psProcess && psProcess.stdin && psProcess.stdin.writable) {
          if (type === 'mousemove' && !isNaN(x) && !isNaN(y)) {
            psProcess.stdin.write(`[Windows.Forms.Cursor]::Position = New-Object Drawing.Point(${x}, ${y})\n`);
          } else if (type === 'mousedown') {
            const flag = button === 2 ? '0x0008' : '0x0002';
            psProcess.stdin.write(`[Win32Functions.Win32Mouse]::mouse_event(${flag}, 0, 0, 0, 0)\n`);
          } else if (type === 'mouseup') {
            const flag = button === 2 ? '0x0010' : '0x0004';
            psProcess.stdin.write(`[Win32Functions.Win32Mouse]::mouse_event(${flag}, 0, 0, 0, 0)\n`);
          } else if (type === 'doubleclick') {
            const flagDown = button === 2 ? '0x0008' : '0x0002';
            const flagUp = button === 2 ? '0x0010' : '0x0004';
            psProcess.stdin.write(`[Win32Functions.Win32Mouse]::mouse_event(${flagDown}, 0, 0, 0, 0); [Win32Functions.Win32Mouse]::mouse_event(${flagUp}, 0, 0, 0, 0); [Win32Functions.Win32Mouse]::mouse_event(${flagDown}, 0, 0, 0, 0); [Win32Functions.Win32Mouse]::mouse_event(${flagUp}, 0, 0, 0, 0);\n`);
          } else if (type === 'keydown' && key) {
            if (key.length === 1) {
              const escaped = key.replace(/'/g, "''").replace(/[{}]/g, '{$&}');
              psProcess.stdin.write(`[System.Windows.Forms.SendKeys]::SendWait('${escaped}')\n`);
            } else {
              const specialKeys = {
                'Enter': '{ENTER}',
                'Backspace': '{BACKSPACE}',
                'Tab': '{TAB}',
                'Escape': '{ESC}',
                'ArrowUp': '{UP}',
                'ArrowDown': '{DOWN}',
                'ArrowLeft': '{LEFT}',
                'ArrowRight': '{RIGHT}',
                'Delete': '{DEL}',
                'Home': '{HOME}',
                'End': '{END}',
                'PageUp': '{PGUP}',
                'PageDown': '{PGDN}'
              };
              const mapped = specialKeys[key];
              if (mapped) {
                psProcess.stdin.write(`[System.Windows.Forms.SendKeys]::SendWait('${mapped}')\n`);
              }
            }
          }
        }
      }

      // 4. One-shot Screenshot Pull
      else if (data.type === 'SCREENSHOT_PULL') {
        try {
          const imgBuffer = await telemetryService.captureScreenshot();
          ws.send(JSON.stringify({
            type: 'SCREENSHOT_FRAME',
            data: imgBuffer.toString('base64'),
            timestamp: Date.now()
          }));
        } catch (e) {}
      }
    } catch (err) {}
  });

  ws.on('close', () => {
    stopScreenStream();
    if (psProcess) {
      try { psProcess.kill(); } catch (e) {}
    }
  });
});


// Serve static frontend assets in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start Server
server.listen(config.port, config.host, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ NEhAIro.FS // CYBER AUTONOMOUS WORKSTATION`);
  console.log(`📡 Server listening on http://localhost:${config.port}`);
  console.log(`🧠 Ollama Intelligence: ${config.ollama.host}`);
  console.log(`📂 Root Drive Access: ${config.rootDir}`);
  console.log(`======================================================\n`);
  
  // Initial Ollama check
  ollamaService.checkStatus().then(st => {
    if (st.online) {
      console.log(`🟢 [Ollama Online] Available models: ${st.models.map(m => m.name).join(', ')}`);
    } else {
      console.log(`🟡 [Ollama Standby] Service reachable at ${config.ollama.host}`);
    }
  });
});
