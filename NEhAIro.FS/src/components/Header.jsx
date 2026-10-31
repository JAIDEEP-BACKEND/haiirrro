import React, { useState, useEffect } from 'react';
import { 
  Shield, Cpu, HardDrive, Terminal, Bot, Settings, Power, 
  FolderGit2, LogOut, CheckCircle2, AlertTriangle, RefreshCw,
  Search, FileType, Activity, Layers, Download
} from 'lucide-react';
import { api } from '../services/api';

export default function Header({
  activeTab,
  setActiveTab,
  vitals,
  ollamaStatus,
  activeRepo,
  repos,
  onSelectRepo,
  user,
  onLogout,
  onOpenSettings,
  onOpenModelManager,
}) {
  const [powerDropdown, setPowerDropdown] = useState(false);
  const [repoDropdown, setRepoDropdown] = useState(false);
  const [powerActionLoading, setPowerActionLoading] = useState(false);

  const handlePowerAction = async (action) => {
    if (!window.confirm(`Initiate ${action.toUpperCase()} protocol on host machine?`)) return;
    try {
      setPowerActionLoading(true);
      await api.executePower(action);
      setPowerDropdown(false);
    } catch (e) {
      alert(`Power action error: ${e.message}`);
    } finally {
      setPowerActionLoading(false);
    }
  };

  return (
    <header className="h-14 bg-[#090d14] border-b border-[#1a2332] px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Workspace */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00f0ff] to-[#00ff88] p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#06080d] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#00f0ff]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-[#00f0ff] via-[#00ff88] to-[#ffffff] bg-clip-text text-transparent">
                NEhAIro<span className="text-[#00f0ff]">.FS</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#00f0ff]/10 text-[#00f0ff] font-mono border border-[#00f0ff]/30 font-semibold">
                v2.0
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono tracking-tight">CYBER OS & REPO CONSOLE</span>
          </div>
        </div>

        {/* Active Repo Switcher */}
        <div className="relative">
          <button
            onClick={() => setRepoDropdown(!repoDropdown)}
            className="flex items-center space-x-2 bg-[#0e1420] border border-[#1e2a3c] hover:border-[#00f0ff]/50 px-2.5 py-1 text-xs text-gray-200 transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="font-mono truncate max-w-[120px]">
              {activeRepo ? activeRepo.name : 'No Repo'}
            </span>
            <span className="text-[10px] text-gray-500">▼</span>
          </button>

          {repoDropdown && (
            <div className="absolute left-0 mt-1 w-64 bg-[#0c121c] border border-[#1e2a3c] shadow-2xl z-50 py-1 font-mono text-xs">
              <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase border-b border-[#1a2332]">
                Workspaces ({repos.length})
              </div>
              <div className="max-h-56 overflow-y-auto">
                {repos.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelectRepo(r.id);
                      setRepoDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-[#141e2e] flex items-center justify-between ${
                      activeRepo?.id === r.id ? 'bg-[#00f0ff]/10 text-[#00f0ff]' : 'text-gray-300'
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                    {activeRepo?.id === r.id && <span className="text-[10px] text-[#00ff88]">ACTIVE</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Nav Tabs */}
      <div className="flex items-center space-x-1 bg-[#090d14] p-1 border border-[#1a2332]">
        <button
          onClick={() => setActiveTab('filesystem')}
          className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 transition-all ${
            activeTab === 'filesystem'
              ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#111824]'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>EXPLORER</span>
        </button>

        <button
          onClick={() => setActiveTab('formats')}
          className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 transition-all ${
            activeTab === 'formats'
              ? 'bg-[#ff00aa]/15 text-[#ff00aa] border border-[#ff00aa]/40 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#111824]'
          }`}
        >
          <FileType className="w-3.5 h-3.5" />
          <span>FORMAT HUB</span>
        </button>

        <button
          onClick={() => setActiveTab('finder')}
          className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 transition-all ${
            activeTab === 'finder'
              ? 'bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/40 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#111824]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>AI FINDER</span>
        </button>

        <button
          onClick={() => setActiveTab('repos')}
          className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 transition-all ${
            activeTab === 'repos'
              ? 'bg-[#7000ff]/20 text-[#a855f7] border border-[#7000ff]/40 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#111824]'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>DEV REPOS</span>
        </button>

        <button
          onClick={() => setActiveTab('terminals')}
          className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 transition-all ${
            activeTab === 'terminals'
              ? 'bg-[#ff8800]/15 text-[#ff8800] border border-[#ff8800]/40 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#111824]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>DUAL SHELL</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5 transition-all ${
            activeTab === 'telemetry'
              ? 'bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/40 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#111824]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>TELEMETRY</span>
        </button>
      </div>

      {/* Right HUD: Ollama Status, Vitals, Power, Settings */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        {/* Ollama Status Pill */}
        <button
          onClick={onOpenModelManager}
          title="Ollama Intelligence Hub"
          className="flex items-center space-x-2 bg-[#0c121c] border border-[#1e2a3c] hover:border-[#00f0ff]/50 px-2.5 py-1 text-gray-300 transition-colors"
        >
          <Bot className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="truncate max-w-[110px]">
            {ollamaStatus?.activeModel || 'Ollama'}
          </span>
          <span className={`w-2 h-2 rounded-full ${ollamaStatus?.online ? 'bg-[#00ff88] animate-pulse' : 'bg-[#ff0055]'}`} />
        </button>

        {/* CPU & RAM quick vitals */}
        {vitals && vitals.cpu && (
          <div className="hidden lg:flex items-center space-x-2 bg-[#0c121c] border border-[#1a2434] px-2.5 py-1 text-[11px] text-gray-400">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">CPU</span>
              <span className={vitals.cpu.load > 80 ? 'text-[#ff0055]' : 'text-[#00ff88]'}>
                {vitals.cpu.load}%
              </span>
            </div>
            <span className="text-gray-700">|</span>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">RAM</span>
              <span className={vitals.memory?.percent > 80 ? 'text-[#ff0055]' : 'text-[#00f0ff]'}>
                {vitals.memory?.percent}%
              </span>
            </div>
          </div>
        )}

        {/* Power Controls Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPowerDropdown(!powerDropdown)}
            title="System Power Commands"
            className="p-1.5 bg-[#0e1420] border border-[#1e2a3c] hover:border-[#ff0055]/50 text-gray-300 hover:text-[#ff0055] transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>

          {powerDropdown && (
            <div className="absolute right-0 mt-1 w-44 bg-[#0c121c] border border-[#1e2a3c] shadow-2xl z-50 py-1 font-mono text-xs">
              <div className="px-3 py-1 text-[10px] text-gray-500 uppercase border-b border-[#1a2332]">
                Power Protocols
              </div>
              <button
                onClick={() => handlePowerAction('lock')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#141e2e] text-gray-200"
              >
                🔒 Lock Workstation
              </button>
              <button
                onClick={() => handlePowerAction('sleep')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#141e2e] text-yellow-400"
              >
                🌙 Sleep Mode
              </button>
              <button
                onClick={() => handlePowerAction('restart')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#141e2e] text-orange-400"
              >
                🔄 Restart Host
              </button>
              <button
                onClick={() => handlePowerAction('shutdown')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#141e2e] text-[#ff0055]"
              >
                ⚠️ Power Off
              </button>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Configuration & Integrations"
          className="p-1.5 bg-[#0e1420] border border-[#1e2a3c] hover:border-[#00f0ff]/50 text-gray-300 hover:text-[#00f0ff] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Operator Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 text-[11px]">
          <span>{user?.username || 'ADMIN'}</span>
        </div>
      </div>
    </header>
  );
}
