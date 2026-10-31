import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await api.login(username, password);
      localStorage.setItem('nehairo_token', res.data.token);
      localStorage.setItem('nehairo_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Operator Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f8fafc] flex items-center justify-center z-50 p-4 font-sans select-none">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white border border-[#e2e8f0] w-full max-w-sm p-8 shadow-xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <motion.img 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            src="/logo.png" 
            alt="nehairo.fs" 
            className="w-16 h-16 object-contain mb-3" 
          />
          <span className="font-extrabold text-base text-black lowercase font-mono tracking-tight">
            nehairo.fs
          </span>
          <p className="text-[11px] text-[#64748b] font-mono mt-0.5">
            Host Workstation Authentication
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-rose-50 border border-rose-300 p-2.5 text-xs text-rose-800 flex items-center space-x-2 font-mono"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[#475569] mb-1 uppercase text-[10px] font-bold">Operator ID</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-3 py-2 text-black focus:outline-none focus:border-black font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#475569] mb-1 uppercase text-[10px] font-bold">Access Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] px-3 py-2 text-black focus:outline-none focus:border-black font-mono transition-colors"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-neutral-800 transition-colors mt-6 font-mono"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </form>

        <div className="mt-6 pt-3 border-t border-[#e2e8f0] text-[10px] text-[#64748b] flex justify-between font-mono">
          <span>DEFAULT:</span>
          <span className="text-black font-bold">admin / admin123</span>
        </div>
      </motion.div>
    </div>
  );
}
