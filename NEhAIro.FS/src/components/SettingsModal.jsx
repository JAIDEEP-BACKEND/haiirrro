import React, { useState, useEffect } from 'react';
import { 
  Settings, Key, FolderGit2, Globe, X, CheckCircle2, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    githubToken: '',
    vercelToken: '',
    ollamaModel: 'qwen2.5-coder:7b',
    theme: 'swiss-light'
  });
  const [githubUser, setGithubUser] = useState(null);
  const [testingGh, setTestingGh] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.data);
      if (res.data.githubToken) {
        testGhAuth();
      }
    } catch (e) {}
  };

  const testGhAuth = async () => {
    try {
      setTestingGh(true);
      const res = await api.testGitHubAuth();
      if (res.data.success) {
        setGithubUser(res.data.user);
      } else {
        setGithubUser(null);
      }
    } catch (e) {
      setGithubUser(null);
    } finally {
      setTestingGh(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.saveSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      testGhAuth();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-[#e2e8f0] w-full max-w-lg p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4 font-mono text-xs">
            <h3 className="font-bold text-black uppercase tracking-wider">
              Configuration & Integrations
            </h3>
            <button onClick={onClose} className="p-1 text-[#64748b] hover:text-black transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-emerald-50 border border-emerald-300 p-2.5 text-xs font-mono text-emerald-800 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings saved successfully.</span>
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
            {/* GitHub Token */}
            <div>
              <label className="block text-[#475569] font-bold uppercase mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>GitHub Access Token</span>
                </span>
                {githubUser && (
                  <span className="text-emerald-600 text-[10px] font-bold">
                    @{githubUser.login} (Connected)
                  </span>
                )}
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                value={settings.githubToken || ''}
                onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-xs text-black focus:outline-none focus:border-black transition-colors"
              />
              <p className="text-[10px] text-[#64748b] mt-1 font-sans">
                Required for automated GitHub repository creation and pushing.
              </p>
            </div>

            {/* Vercel Token */}
            <div>
              <label className="block text-[#475569] font-bold uppercase mb-1 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-[#64748b]" />
                <span>Vercel Access Token (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="Vercel token"
                value={settings.vercelToken || ''}
                onChange={(e) => setSettings({ ...settings, vercelToken: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-xs text-black focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="pt-4 border-t border-[#e2e8f0] flex justify-end space-x-2 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-white text-[#475569] border border-[#e2e8f0] hover:text-black font-bold uppercase text-xs transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-5 py-1.5 bg-black text-white font-bold text-xs uppercase hover:bg-neutral-800 transition-colors"
              >
                Save Configuration
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
