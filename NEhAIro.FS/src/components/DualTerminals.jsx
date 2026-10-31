import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Play, Trash2, Maximize2, Minimize2, 
  Layers, ChevronRight, CornerDownLeft, Shield, AlertTriangle
} from 'lucide-react';

export default function DualTerminals({ 
  agyLogs, 
  shellLogs, 
  onSendAgyInput, 
  onSendShellInput,
  onClearAgyLogs,
  onClearShellLogs,
  activeRepo
}) {
  const [agyInput, setAgyInput] = useState('');
  const [shellInput, setShellInput] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'agy' | 'shell'
  const agyEndRef = useRef(null);
  const shellEndRef = useRef(null);

  useEffect(() => {
    agyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agyLogs]);

  useEffect(() => {
    shellEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [shellLogs]);

  const handleAgySubmit = (e) => {
    e.preventDefault();
    if (!agyInput.trim()) return;
    onSendAgyInput(agyInput.trim());
    setAgyInput('');
  };

  const handleShellSubmit = (e) => {
    e.preventDefault();
    if (!shellInput.trim()) return;
    onSendShellInput(shellInput.trim());
    setShellInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#06080d] overflow-hidden font-mono">
      {/* Top Terminal Mode Switcher */}
      <div className="bg-[#0b1018] border-b border-[#1a2332] px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#ff8800]" />
          <span className="font-bold text-gray-200">DUAL EXECUTION TERMINAL MATRIX</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#070a0f] border border-[#1e2a3c] p-0.5">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 ${viewMode === 'split' ? 'bg-[#ff8800]/20 text-[#ff8800] font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            SPLIT (DUAL)
          </button>
          <button
            onClick={() => setViewMode('agy')}
            className={`px-2.5 py-1 ${viewMode === 'agy' ? 'bg-[#ff8800]/20 text-[#ff8800] font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            AGY CLI ONLY
          </button>
          <button
            onClick={() => setViewMode('shell')}
            className={`px-2.5 py-1 ${viewMode === 'shell' ? 'bg-[#ff8800]/20 text-[#ff8800] font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            POWERSHELL ONLY
          </button>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[#1a2332] overflow-hidden">
        {/* Terminal 1: Antigravity Stream Terminal */}
        {(viewMode === 'split' || viewMode === 'agy') && (
          <div className="flex flex-col h-full bg-[#070a0f] overflow-hidden">
            <div className="bg-[#0c121c] border-b border-[#1a2332] px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                <span className="font-bold text-[#00f0ff]">TERMINAL 1 // ANTIGRAVITY ENGINE</span>
              </div>
              <button
                onClick={onClearAgyLogs}
                title="Clear AGY Terminal"
                className="text-gray-500 hover:text-gray-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Output log */}
            <div className="flex-1 overflow-y-auto p-3 text-xs text-gray-300 font-mono space-y-1 bg-[#05070a] select-text">
              <div className="text-gray-600 text-[10px]">
                [ANTIGRAVITY CLI DIRECT STREAM - LISTENING ON HOST NODE]
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#00f0ff] leading-relaxed">
                {agyLogs || 'Awaiting task instruction...'}
              </pre>
              <div ref={agyEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleAgySubmit} className="p-2 bg-[#090d14] border-t border-[#1a2332]">
              <div className="flex items-center bg-[#05070a] border border-[#1e2a3c] focus-within:border-[#00f0ff] px-2 py-1">
                <span className="text-[#00f0ff] text-xs font-bold mr-2">agy &gt;</span>
                <input
                  type="text"
                  value={agyInput}
                  onChange={(e) => setAgyInput(e.target.value)}
                  placeholder="Run direct agy prompt or --help..."
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <button type="submit" className="text-[#00f0ff] hover:text-white ml-1">
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Terminal 2: Interactive PowerShell / Host Shell */}
        {(viewMode === 'split' || viewMode === 'shell') && (
          <div className="flex flex-col h-full bg-[#070a0f] overflow-hidden">
            <div className="bg-[#0c121c] border-b border-[#1a2332] px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
                <span className="font-bold text-[#00ff88]">TERMINAL 2 // HOST SHELL (POWERSHELL)</span>
              </div>
              <button
                onClick={onClearShellLogs}
                title="Clear Shell Terminal"
                className="text-gray-500 hover:text-gray-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Output log */}
            <div className="flex-1 overflow-y-auto p-3 text-xs text-gray-300 font-mono space-y-1 bg-[#05070a] select-text">
              <div className="text-gray-600 text-[10px]">
                [INTERACTIVE POWERSHELL CONSOLE - CWD: {activeRepo?.localPath || 'C:\\'}]
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#00ff88] leading-relaxed">
                {shellLogs || 'PowerShell initialized.'}
              </pre>
              <div ref={shellEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleShellSubmit} className="p-2 bg-[#090d14] border-t border-[#1a2332]">
              <div className="flex items-center bg-[#05070a] border border-[#1e2a3c] focus-within:border-[#00ff88] px-2 py-1">
                <span className="text-[#00ff88] text-xs font-bold mr-2">PS &gt;</span>
                <input
                  type="text"
                  value={shellInput}
                  onChange={(e) => setShellInput(e.target.value)}
                  placeholder="Enter system command (e.g. dir, git status, npm run dev)..."
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <button type="submit" className="text-[#00ff88] hover:text-white ml-1">
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
