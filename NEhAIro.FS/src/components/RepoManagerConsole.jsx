import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, Plus, Play, GitBranch, GitCommit, 
  UploadCloud, Globe, CheckCircle2, AlertCircle, RefreshCw, 
  Terminal, Code2, Eye, FileCode, Clock, Shield, ChevronDown,
  DownloadCloud, Lock, Unlock, Star, Search, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function RepoManagerConsole({
  activeRepo,
  repos,
  onSelectRepo,
  onRefreshRepos,
  onOpenFile
}) {
  const [activeSubTab, setActiveSubTab] = useState('local'); // 'local' | 'github'
  const [taskPrompt, setTaskPrompt] = useState('');
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [gitStatus, setGitStatus] = useState(null);
  const [gitLog, setGitLog] = useState([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  
  // GitHub Repos State
  const [githubRepos, setGithubRepos] = useState([]);
  const [ghUser, setGhUser] = useState(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghFilter, setGhFilter] = useState('');
  const [cloningRepoName, setCloningRepoName] = useState(null);
  const [ghError, setGhError] = useState(null);

  // Add Repo Dialog
  const [addModal, setAddModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [importPath, setImportPath] = useState('');
  const [isImport, setIsImport] = useState(false);

  useEffect(() => {
    if (activeRepo) {
      loadGitInfo();
    }
  }, [activeRepo]);

  useEffect(() => {
    loadGitHubInfo();
  }, []);

  const loadGitInfo = async () => {
    try {
      const [stRes, logRes] = await Promise.all([
        api.getGitStatus(),
        api.getGitLog()
      ]);
      setGitStatus(stRes.data);
      setGitLog(logRes.data.log || []);
    } catch (e) {}
  };

  const loadGitHubInfo = async () => {
    try {
      setGhLoading(true);
      setGhError(null);
      const [authRes, reposRes] = await Promise.all([
        api.testGitHubAuth(),
        api.getGitHubRepos()
      ]);

      if (authRes.data.success) {
        setGhUser(authRes.data.user);
      } else {
        setGhUser(null);
      }

      if (reposRes.data.success) {
        setGithubRepos(reposRes.data.repos || []);
      } else {
        setGhError(reposRes.data.error || 'Configure GitHub Token in Settings');
        setGithubRepos([]);
      }
    } catch (err) {
      setGhError(err.message);
    } finally {
      setGhLoading(false);
    }
  };

  const handleCloneGitHubRepo = async (repo) => {
    try {
      setCloningRepoName(repo.name);
      const res = await api.cloneGitHubRepo({
        cloneUrl: repo.cloneUrl,
        name: repo.name
      });
      alert(`Successfully cloned "${repo.fullName}" into local workspaces.`);
      onRefreshRepos();
      if (res.data.repo) {
        onSelectRepo(res.data.repo.id);
      }
      setActiveSubTab('local');
    } catch (err) {
      alert(`Clone failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setCloningRepoName(null);
    }
  };

  const handleRunTask = async (e) => {
    e?.preventDefault();
    if (!taskPrompt.trim()) return;

    try {
      setIsExecutingTask(true);
      await api.executeTask({
        prompt: taskPrompt.trim(),
        repoId: activeRepo?.id,
        autoPush: true
      });
      setTaskPrompt('');
      loadGitInfo();
    } catch (err) {
      alert(`Task execution failed: ${err.message}`);
    } finally {
      setIsExecutingTask(false);
    }
  };

  const handleCommit = async (e) => {
    e?.preventDefault();
    if (!commitMessage.trim()) return;
    try {
      setIsCommitting(true);
      await api.gitCommit(commitMessage.trim());
      setCommitMessage('');
      loadGitInfo();
    } catch (err) {
      alert(`Commit failed: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    try {
      if (isImport) {
        if (!importPath.trim()) return;
        await api.addExistingRepo({ path: importPath.trim(), name: newRepoName.trim() || null });
      } else {
        if (!newRepoName.trim()) return;
        await api.createRepo({ name: newRepoName.trim() });
      }
      setAddModal(false);
      setNewRepoName('');
      setImportPath('');
      onRefreshRepos();
    } catch (err) {
      alert(`Repository creation error: ${err.message}`);
    }
  };

  const filteredGhRepos = githubRepos.filter(r => 
    r.name.toLowerCase().includes(ghFilter.toLowerCase()) || 
    r.fullName.toLowerCase().includes(ghFilter.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(ghFilter.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-hidden font-sans">
      {/* Top Workspace Bar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] px-5 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#64748b] font-bold uppercase">ACTIVE REPO:</span>
              <select
                value={activeRepo?.id || ''}
                onChange={(e) => onSelectRepo(e.target.value)}
                className="bg-white border border-[#e2e8f0] text-black font-bold px-2.5 py-1 focus:outline-none focus:border-black"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] px-2 py-0.5 bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] font-bold">
                {gitStatus?.branch || 'main'}
              </span>
            </div>
            <p className="text-[11px] text-[#64748b] truncate max-w-md mt-0.5">
              {activeRepo ? activeRepo.localPath : 'No repository selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub-tab switcher */}
          <div className="flex border border-[#e2e8f0] bg-[#f8fafc]">
            <button
              onClick={() => setActiveSubTab('local')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                activeSubTab === 'local' ? 'bg-black text-white' : 'text-[#475569] hover:text-black'
              }`}
            >
              Workspace ({repos.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('github'); loadGitHubInfo(); }}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors flex items-center space-x-1 ${
                activeSubTab === 'github' ? 'bg-black text-white' : 'text-[#475569] hover:text-black'
              }`}
            >
              <span>GitHub Remote</span>
              {githubRepos.length > 0 && <span>({githubRepos.length})</span>}
            </button>
          </div>

          <button
            onClick={() => setAddModal(true)}
            className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW / IMPORT</span>
          </button>
        </div>
      </div>

      {/* Viewport: Local Workspace View */}
      {activeSubTab === 'local' && (
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: AI Coding Task Runner */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[#e2e8f0] p-5">
              <h2 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-1">
                Automated Code Task Pipeline
              </h2>
              <p className="text-xs text-[#64748b] mb-4">
                Direct the local code orchestrator to refactor, debug, or build features directly within the active repository.
              </p>

              <form onSubmit={handleRunTask} className="space-y-3 font-mono text-xs">
                <textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder='e.g. "Add JWT token refresh middleware and write integration test suite", "Fix memory leak in websocket broadcast queue"'
                  rows={4}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-3 text-black placeholder-[#94a3b8] focus:outline-none focus:border-black resize-none font-mono"
                />

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-[#64748b]">
                    Target: <strong className="text-black">{activeRepo?.name || 'None'}</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={isExecutingTask || !taskPrompt.trim()}
                    className="px-5 py-2 bg-black text-white font-bold uppercase hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center space-x-1.5"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${isExecutingTask ? 'animate-spin' : ''}`} />
                    <span>{isExecutingTask ? 'ORCHESTRATING...' : 'EXECUTE PIPELINE'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Commit Box */}
            <div className="bg-white border border-[#e2e8f0] p-5">
              <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-2">
                Git Commit & Stage
              </h3>
              <form onSubmit={handleCommit} className="flex items-center space-x-2 font-mono text-xs">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message..."
                  className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={isCommitting || !commitMessage.trim()}
                  className="px-4 py-2 bg-black text-white font-bold uppercase hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center space-x-1"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>{isCommitting ? 'COMMITTING...' : 'COMMIT ALL'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Git Status & Recent Commits */}
          <div className="space-y-4">
            {/* Status Box */}
            <div className="bg-white border border-[#e2e8f0] p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 mb-3">
                <span className="font-bold text-black uppercase">Git Status</span>
                <span className="text-[#64748b]">{gitStatus?.branch || 'main'}</span>
              </div>

              {gitStatus?.isRepo ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748b]">Modified Files:</span>
                    <span className="text-black font-bold">{gitStatus.modified?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748b]">Untracked Files:</span>
                    <span className="text-black font-bold">{gitStatus.not_added?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748b]">Ahead / Behind:</span>
                    <span className="text-black font-bold">{gitStatus.ahead || 0} / {gitStatus.behind || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[#64748b] text-[11px]">
                  Not a valid Git repository root.
                </div>
              )}
            </div>

            {/* Commit Log */}
            <div className="bg-white border border-[#e2e8f0] p-4 font-mono text-xs flex flex-col h-[320px]">
              <div className="border-b border-[#e2e8f0] pb-2 mb-3 font-bold text-black uppercase">
                Recent Commits
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {gitLog.length === 0 ? (
                  <div className="text-[#64748b] text-[11px]">No commit history found.</div>
                ) : (
                  gitLog.slice(0, 15).map((logLine, idx) => (
                    <div key={idx} className="p-2 bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#334155] truncate font-mono">
                      {logLine}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewport: Connected GitHub Repositories View */}
      {activeSubTab === 'github' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden p-5 space-y-4">
          {/* Header & Filter */}
          <div className="bg-white border border-[#e2e8f0] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-bold text-black uppercase tracking-widest flex items-center space-x-2">
                  <span>Connected GitHub Repositories</span>
                  {ghUser && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                      @{ghUser.login}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#64748b]">
                  Clone and integrate any of your remote repositories directly into NEhAIro workspaces.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter GitHub repositories..."
                  value={ghFilter}
                  onChange={(e) => setGhFilter(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] pl-8 pr-2.5 py-1 text-xs text-black focus:outline-none focus:border-black font-mono"
                />
              </div>

              <button
                onClick={loadGitHubInfo}
                className="p-1.5 bg-white border border-[#e2e8f0] text-[#64748b] hover:text-black transition-colors"
                title="Refresh GitHub Repos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ghLoading ? 'animate-spin text-black' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {ghError && (
            <div className="bg-rose-50 border border-rose-300 p-3 text-xs text-rose-800 font-mono flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>GitHub API: {ghError}</span>
              </div>
              <span className="text-[10px] font-bold uppercase">Configure Token in Settings</span>
            </div>
          )}

          {/* GitHub Repos Grid / Table */}
          <div className="flex-1 overflow-y-auto bg-white border border-[#e2e8f0]">
            {ghLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-2 text-[#64748b] font-mono text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-black" />
                <span>Fetching repositories from GitHub API...</span>
              </div>
            ) : filteredGhRepos.length === 0 ? (
              <div className="py-20 text-center text-[#64748b] font-mono text-xs p-6">
                No GitHub repositories found. Ensure your GitHub Personal Access Token is saved in Settings.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#f8fafc] text-[#475569] uppercase border-b border-[#e2e8f0] text-[11px]">
                  <tr>
                    <th className="p-3">Repository</th>
                    <th className="p-3 w-28">Visibility</th>
                    <th className="p-3 w-32">Branch</th>
                    <th className="p-3 w-24">Stars</th>
                    <th className="p-3 w-40">Updated</th>
                    <th className="p-3 w-36 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredGhRepos.map((repo) => (
                    <tr key={repo.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-black font-sans font-bold text-sm">
                              {repo.fullName}
                            </span>
                            <a
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#94a3b8] hover:text-black transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-[#64748b] font-sans truncate max-w-xl">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                          repo.isPrivate 
                            ? 'bg-amber-50 text-amber-800 border-amber-300' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {repo.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                        </span>
                      </td>
                      <td className="p-3 text-[#64748b]">{repo.defaultBranch}</td>
                      <td className="p-3 text-[#64748b] flex items-center space-x-1 pt-4">
                        <Star className="w-3 h-3 fill-current text-amber-500" />
                        <span>{repo.stars || 0}</span>
                      </td>
                      <td className="p-3 text-[#64748b]">
                        {repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleCloneGitHubRepo(repo)}
                          disabled={cloningRepoName === repo.name}
                          className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase text-xs flex items-center space-x-1 ml-auto disabled:opacity-50 transition-colors"
                        >
                          <DownloadCloud className={`w-3.5 h-3.5 ${cloningRepoName === repo.name ? 'animate-bounce' : ''}`} />
                          <span>{cloningRepoName === repo.name ? 'Cloning...' : 'Clone'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add / Import Repository Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#e2e8f0] p-6 shadow-xl font-sans">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-3">
              Add or Import Workspace Repository
            </h3>

            <div className="flex border border-[#e2e8f0] mb-4 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsImport(false)}
                className={`flex-1 py-1.5 font-bold uppercase transition-colors ${!isImport ? 'bg-black text-white' : 'bg-[#f8fafc] text-[#475569]'}`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setIsImport(true)}
                className={`flex-1 py-1.5 font-bold uppercase transition-colors ${isImport ? 'bg-black text-white' : 'bg-[#f8fafc] text-[#475569]'}`}
              >
                Import Existing
              </button>
            </div>

            <form onSubmit={handleCreateRepo} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#475569] font-bold uppercase mb-1">Repository Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-workspace-app"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                  required={!isImport}
                />
              </div>

              {isImport && (
                <div>
                  <label className="block text-[#475569] font-bold uppercase mb-1">Local Directory Path</label>
                  <input
                    type="text"
                    value={importPath}
                    onChange={(e) => setImportPath(e.target.value)}
                    placeholder="C:\Users\jaide\Projects\my-app"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-1.5 bg-white text-[#475569] border border-[#e2e8f0] hover:text-black font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800"
                >
                  {isImport ? 'Import' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
