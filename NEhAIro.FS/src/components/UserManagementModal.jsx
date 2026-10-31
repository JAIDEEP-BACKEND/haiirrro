import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, Shield, Check, X, AlertCircle, Key, CheckCircle2, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function UserManagementModal({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [canUpload, setCanUpload] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [canDownload, setCanDownload] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load operators list.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await api.createUser({
        username: username.trim(),
        password,
        role,
        canUpload,
        canDelete,
        canDownload
      });

      setSuccess(`Operator "${username.trim()}" created successfully.`);
      setUsername('');
      setPassword('');
      setRole('operator');
      setCanUpload(true);
      setCanDelete(false);
      setCanDownload(true);
      loadUsers();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (name === currentUser?.username) {
      alert('Cannot terminate your own active operator account.');
      return;
    }

    if (!window.confirm(`Revoke clearance and remove operator "${name}"?`)) return;

    try {
      await api.deleteUser(id);
      loadUsers();
      setSuccess(`Operator "${name}" removed.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white border border-[#e2e8f0] w-full max-w-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-black" />
              <h3 className="font-bold text-black uppercase tracking-wider">
                Operator Clearance & User Accounts
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#64748b] hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-rose-50 border border-rose-300 p-2.5 text-xs font-mono text-rose-800 flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-emerald-50 border border-emerald-300 p-2.5 text-xs font-mono text-emerald-800 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
            {/* Create New User Form */}
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-[#e2e8f0] text-black font-bold uppercase text-[11px]">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Operator</span>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-[#475569] font-bold uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. operator_remote"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-xs text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] font-bold uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-xs text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] font-bold uppercase mb-1">
                    Role Clearance
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-xs text-black focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="operator">Operator (Standard User)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                {/* Permissions Toggles */}
                <div className="pt-2 border-t border-[#f1f5f9] space-y-2">
                  <span className="block text-[10px] text-[#64748b] uppercase font-bold tracking-wider">
                    Permissions & Access Rights
                  </span>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canUpload}
                      onChange={(e) => setCanUpload(e.target.checked)}
                      className="accent-black w-3.5 h-3.5"
                    />
                    <span className="text-[#334155] text-xs">Allow File Upload</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canDownload}
                      onChange={(e) => setCanDownload(e.target.checked)}
                      className="accent-black w-3.5 h-3.5"
                    />
                    <span className="text-[#334155] text-xs">Allow File Download</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="accent-black w-3.5 h-3.5"
                    />
                    <span className="text-[#334155] text-xs">Allow File Deletion</span>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'CREATING...' : 'PROVISION OPERATOR'}
                </motion.button>
              </form>
            </div>

            {/* Existing Users List */}
            <div className="space-y-3 font-mono text-xs border-t md:border-t-0 md:border-l border-[#e2e8f0] md:pl-6 pt-4 md:pt-0">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                <span className="text-black font-bold uppercase text-[11px]">
                  Registered Operators ({users.length})
                </span>
                <button
                  onClick={loadUsers}
                  className="text-[10px] text-[#64748b] hover:text-black uppercase"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-[#94a3b8]">Loading operator directory...</div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {users.map((u) => {
                    const isSelf = u.username === currentUser?.username;
                    return (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-[#f8fafc] border border-[#e2e8f0] flex flex-col justify-between space-y-2 hover:border-[#cbd5e1] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-black">{u.username}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 bg-black text-white text-[9px] uppercase font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                            u.role === 'admin' 
                              ? 'bg-neutral-900 text-white' 
                              : 'bg-[#e2e8f0] text-[#334155]'
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#64748b] pt-1 border-t border-[#e2e8f0]/60">
                          <div className="flex items-center space-x-3">
                            <span className={u.canUpload ? 'text-emerald-700' : 'text-slate-400'}>
                              {u.canUpload ? '✓ Up' : '✗ Up'}
                            </span>
                            <span className={u.canDownload ? 'text-emerald-700' : 'text-slate-400'}>
                              {u.canDownload ? '✓ Down' : '✗ Down'}
                            </span>
                            <span className={u.canDelete ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                              {u.canDelete ? '✓ Del' : '✗ Del'}
                            </span>
                          </div>

                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Delete user"
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

