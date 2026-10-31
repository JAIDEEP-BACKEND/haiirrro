import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Trash2, CornerDownLeft, Play, RefreshCw, 
  Copy, Check, Shield, Folder
} from 'lucide-react';

export default function TerminalPanel({
  shellLogs,
  onSendShellInput,
  onClearShellLogs,
  currentCwd = 'C:\\'
}) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [copied, setCopied] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [shellLogs]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    setHistory(prev => [input.trim(), ...prev]);
    setHistoryIdx(-1);
    onSendShellInput(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const handleQuickCmd = (cmd) => {
    onSendShellInput(cmd);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(shellLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-hidden font-sans">
      {/* Terminal Header Bar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] px-5 py-2.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center space-x-2.5">
          <div>
            <h1 className="font-bold text-black flex items-center space-x-2 uppercase">
              <span>Windows PowerShell Console</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] font-bold">
                LIVE STDIN/STDOUT
              </span>
            </h1>
            <span className="text-[11px] text-[#64748b]">Working Directory: {currentCwd}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyAll}
            className="px-3 py-1 bg-white border border-[#e2e8f0] hover:border-black text-black text-xs font-bold uppercase flex items-center space-x-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onClearShellLogs}
            title="Clear Console Buffer"
            className="px-3 py-1 bg-white border border-[#e2e8f0] hover:border-rose-600 text-[#64748b] hover:text-rose-600 text-xs font-bold uppercase flex items-center space-x-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Output Stream Buffer */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc] border-b border-[#e2e8f0] select-text font-mono text-xs leading-relaxed space-y-1">
        <div className="text-[#94a3b8] text-[11px] mb-2">
          Windows PowerShell Interactive Terminal<br/>
          (C) Microsoft Corporation. Host Terminal Stream Active.
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11.5px] text-[#0f172a] leading-relaxed">
          {shellLogs || 'PowerShell Ready.'}
        </pre>
        <div ref={endRef} />
      </div>

      {/* Quick Command Toolbar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] px-5 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none font-mono text-xs text-[#64748b]">
        <span className="font-bold uppercase text-[#475569] shrink-0">QUICK:</span>
        {['dir', 'ipconfig', 'git status', 'netstat -an', 'whoami', 'systeminfo'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleQuickCmd(cmd)}
            className="px-2.5 py-0.5 bg-[#f8fafc] border border-[#e2e8f0] hover:border-black text-black shrink-0 transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input Prompt Box */}
      <form onSubmit={handleSubmit} className="bg-[#ffffff] p-3 flex items-center space-x-2 font-mono text-xs">
        <div className="flex items-center space-x-1 text-black font-bold shrink-0 px-1">
          <span>PS</span>
          <span className="text-[#64748b]">&gt;</span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type PowerShell or system command..."
          className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] focus:border-black p-2 text-black focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white font-bold uppercase hover:bg-neutral-800 transition-colors flex items-center space-x-1"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>SEND</span>
        </button>
      </form>
    </div>
  );
}
