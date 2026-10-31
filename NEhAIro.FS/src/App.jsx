import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FileSystemExplorer from './components/FileSystemExplorer';
import FormatHub from './components/FormatHub';
import AiFileFinder from './components/AiFileFinder';
import RepoManagerConsole from './components/RepoManagerConsole';
import TerminalPanel from './components/TerminalPanel';
import RemoteDesktop from './components/RemoteDesktop';
import NodeTelemetry from './components/NodeTelemetry';
import FileViewerModal from './components/FileViewerModal';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import UserManagementModal from './components/UserManagementModal';
import { api, WS_BASE } from './services/api';


export default function App() {
  const [activeTab, setActiveTab] = useState('filesystem');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nehairo_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Global State
  const [vitals, setVitals] = useState(null);
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);

  // Terminal Logs
  const [shellLogs, setShellLogs] = useState('');

  // Modals
  const [viewerFile, setViewerFile] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  // WebSocket Ref
  const wsRef = React.useRef(null);

  useEffect(() => {
    loadInitialData();
    connectWebSocket();

    const interval = setInterval(() => {
      loadVitals();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const loadInitialData = async () => {
    loadVitals();
    loadRepos();
  };

  const loadVitals = async () => {
    try {
      const res = await api.getVitals();
      setVitals(res.data);
    } catch (e) {}
  };

  const loadRepos = async () => {
    try {
      const res = await api.getRepos();
      const list = res.data || [];
      setRepos(list);
      const active = list.find(r => r.isActive) || list[0] || null;
      setActiveRepo(active);
    } catch (e) {}
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TERMINAL_OUTPUT') {
            setShellLogs(prev => prev + data.text);
          } else if (data.type === 'REPOS_UPDATED') {
            setRepos(data.repos || []);
          } else if (data.type === 'ACTIVE_REPO_CHANGED') {
            loadRepos();
          } else if (data.type === 'TASK_COMPLETED' || data.type === 'TASK_UPDATED') {
            loadRepos();
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
      };
    } catch (e) {}
  };

  const handleSelectRepo = async (repoId) => {
    try {
      const res = await api.selectRepo(repoId);
      setActiveRepo(res.data);
      loadRepos();
    } catch (e) {
      alert(`Error selecting repo: ${e.message}`);
    }
  };

  const handleSendShellInput = (command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SHELL_INPUT',
        repoId: activeRepo?.id,
        command,
        cwd: activeRepo?.localPath || 'C:\\'
      }));
    }
  };

  const handleOpenFile = (filePath, fileName) => {
    setViewerFile({ path: filePath, name: fileName });
  };

  const handleLogout = () => {
    localStorage.removeItem('nehairo_token');
    localStorage.removeItem('nehairo_user');
    setUser(null);
  };

  if (!user) {
    return <LoginModal onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#ffffff] text-[#09090b] overflow-hidden select-none font-sans">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vitals={vitals}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenUsers={() => setUsersOpen(true)}
      />

      {/* Main Tab Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#ffffff]">

        {activeTab === 'filesystem' && (
          <FileSystemExplorer
            onOpenFile={handleOpenFile}
            onRefreshVitals={loadVitals}
          />
        )}

        {activeTab === 'formats' && (
          <FormatHub
            onOpenFile={handleOpenFile}
            currentPath={activeRepo?.localPath || 'C:\\'}
          />
        )}

        {activeTab === 'finder' && (
          <AiFileFinder onOpenFile={handleOpenFile} />
        )}

        {activeTab === 'repos' && (
          <RepoManagerConsole
            activeRepo={activeRepo}
            repos={repos}
            onSelectRepo={handleSelectRepo}
            onRefreshRepos={loadRepos}
            onOpenFile={handleOpenFile}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalPanel
            shellLogs={shellLogs}
            onSendShellInput={handleSendShellInput}
            onClearShellLogs={() => setShellLogs('')}
            currentCwd={activeRepo?.localPath || 'C:\\'}
          />
        )}

        {activeTab === 'desktop' && (
          <RemoteDesktop />
        )}

        {activeTab === 'telemetry' && (
          <NodeTelemetry
            vitals={vitals}
            onRefreshVitals={loadVitals}
          />
        )}
      </main>


      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewerModal
          isOpen={!!viewerFile}
          filePath={viewerFile.path}
          fileName={viewerFile.name}
          onClose={() => setViewerFile(null)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={usersOpen}
        onClose={() => setUsersOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
