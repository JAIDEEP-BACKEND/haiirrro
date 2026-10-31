import React from 'react';
import { 
  Square, HardDrive, FileType, Search, 
  FolderGit2, Terminal, Activity, Monitor, Settings, LogOut, Check, Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({
  activeTab,
  setActiveTab,
  vitals,
  user,
  onLogout,
  onOpenSettings,
  onOpenUsers
}) {
  const navItems = [
    { id: 'filesystem', label: 'Filesystem', code: '01', icon: HardDrive },
    { id: 'formats', label: 'Format Hub', code: '02', icon: FileType },
    { id: 'finder', label: 'AI Search', code: '03', icon: Search },
    { id: 'repos', label: 'hAIro Repos', code: '04', icon: FolderGit2 },
    { id: 'terminal', label: 'Terminal', code: '05', icon: Terminal },
    { id: 'desktop', label: 'Remote Desktop', code: '06', icon: Monitor },
    { id: 'telemetry', label: 'Telemetry & C2', code: '07', icon: Activity },
  ];

  return (
    <aside className="w-56 bg-[#fafafa] border-r border-[#e5e7eb] flex flex-col justify-between select-none font-sans shrink-0 z-20">
      {/* Swiss Brand Header */}
      <div>
        <div className="p-4 border-b border-[#e5e7eb] bg-[#ffffff]">
          <div className="flex items-center space-x-2.5">
            <img 
              src="/logo.png" 
              alt="nehairo.fs" 
              className="w-6 h-6 object-contain shrink-0" 
            />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-black lowercase font-mono leading-none">
                nehairo.fs
              </span>
              <span className="text-[10px] text-[#64748b] font-mono tracking-wider uppercase mt-0.5">
                Workstation
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-2 space-y-0.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#ffffff] text-black border-l-2 border-black shadow-xs font-semibold'
                    : 'text-[#4b5563] hover:text-black hover:bg-[#f3f4f6] border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-[#6b7280]'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-mono text-[#9ca3af]">
                  {item.code}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Swiss Telemetry Metric Footer */}
      <div className="p-3 border-t border-[#e5e7eb] space-y-3 bg-[#ffffff]">
        {vitals && vitals.cpu && (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-2.5 space-y-2 text-[11px] font-mono">
            <div>
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span>CPU</span>
                <span className="text-black font-bold">{vitals.cpu.load}%</span>
              </div>
              <div className="w-full bg-[#e2e8f0] h-1 overflow-hidden">
                <div
                  style={{ width: `${Math.min(vitals.cpu.load, 100)}%` }}
                  className="bg-black h-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span>RAM</span>
                <span className="text-black font-bold">{vitals.memory?.percent || 0}%</span>
              </div>
              <div className="w-full bg-[#e2e8f0] h-1 overflow-hidden">
                <div
                  style={{ width: `${Math.min(vitals.memory?.percent || 0, 100)}%` }}
                  className="bg-black h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* User Identity & Utility */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-1.5 h-1.5 bg-emerald-600 shrink-0" />
            <span className="text-black font-mono text-[11px] uppercase truncate font-bold">
              {user?.username || 'ADMIN'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {user?.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenUsers}
                title="Manage Operators & Users"
                className="p-1 text-[#64748b] hover:text-black transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSettings}
              title="Settings"
              className="p-1 text-[#64748b] hover:text-black transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              title="Logout"
              className="p-1 text-[#64748b] hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </aside>
  );
}
