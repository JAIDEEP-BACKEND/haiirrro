import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, HardDrive, Monitor, RefreshCw, 
  Trash2, Search, Lock, Moon, RotateCcw, Power, Camera, 
  X, Download, Terminal, ShieldAlert, CheckCircle2, Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function NodeTelemetry({ vitals, onRefreshVitals }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview | processes | protocols | logs
  const [processes, setProcesses] = useState([]);
  const [procFilter, setProcFilter] = useState('');
  const [procLoading, setProcLoading] = useState(false);
  
  // Power states
  const [powerLoading, setPowerLoading] = useState(null);
  const [powerMessage, setPowerMessage] = useState(null);

  // Screenshot capture modal
  const [screenshotModalUrl, setScreenshotModalUrl] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Protocols runner
  const [runningProtocol, setRunningProtocol] = useState(null);
  const [protocolOutput, setProtocolOutput] = useState(null);

  // Logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadProcesses();
    loadActivityLogs();
  }, []);

  const loadProcesses = async () => {
    try {
      setProcLoading(true);
      const res = await api.getProcesses();
      setProcesses(res.data || []);
    } catch (e) {
    } finally {
      setProcLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.getActivityLogs();
      setActivityLogs(res.data || []);
    } catch (e) {
    } finally {
      setLogsLoading(false);
    }
  };

  const handleKillProcess = async (pid, name) => {
    if (!window.confirm(`Terminate process "${name}" (PID: ${pid})?`)) return;
    try {
      await api.killProcess(pid);
      loadProcesses();
      loadActivityLogs();
    } catch (err) {
      alert(`Failed to kill process: ${err.message}`);
    }
  };

  const handlePowerAction = async (action) => {
    const labels = {
      lock: 'Lock Workstation',
      sleep: 'Sleep Mode',
      restart: 'System Reboot',
      shutdown: 'System Shutdown',
      cancel_shutdown: 'Cancel Shutdown'
    };

    if (['restart', 'shutdown'].includes(action)) {
      if (!window.confirm(`CRITICAL: Confirm ${labels[action]} protocol? This will disconnect active operations.`)) {
        return;
      }
    }

    setPowerLoading(action);
    setPowerMessage(null);
    try {
      const res = await api.executePower(action);
      setPowerMessage({ type: 'success', text: `Protocol [${labels[action] || action}] executed.` });
      loadActivityLogs();
    } catch (err) {
      setPowerMessage({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setPowerLoading(null);
    }
  };

  const handleCaptureScreen = async () => {
    setIsCapturing(true);
    try {
      const res = await fetch(api.getScreenshotUrl());
      if (!res.ok) throw new Error('Capture failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setScreenshotModalUrl(url);
      loadActivityLogs();
    } catch (err) {
      alert(`Failed to capture remote screen: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRunProtocol = async (cmd) => {
    setRunningProtocol(cmd);
    setProtocolOutput(null);
    try {
      const res = await api.executeSystemProtocol(cmd);
      setProtocolOutput(res.data);
      loadActivityLogs();
    } catch (err) {
      setProtocolOutput({
        protocol: cmd,
        output: err.response?.data?.error || err.message,
        success: false
      });
    } finally {
      setRunningProtocol(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const filteredProc = processes.filter(p => 
    p.name.toLowerCase().includes(procFilter.toLowerCase()) || 
    p.pid.toString().includes(procFilter)
  );

  const powerButtons = [
    { id: 'lock', label: 'LOCK WORKSTATION', icon: Lock, hint: 'Locks screen instantly' },
    { id: 'sleep', label: 'SLEEP MODE', icon: Moon, hint: 'Enters suspend state' },
    { id: 'restart', label: 'SYSTEM REBOOT', icon: RotateCcw, hint: 'Reboots OS in 5s' },
    { id: 'shutdown', label: 'SHUTDOWN', icon: Power, hint: 'Powers off in 5s' },
    { id: 'cancel_shutdown', label: 'ABORT SHUTDOWN', icon: ShieldAlert, hint: 'Cancels scheduled shutdown' }
  ];

  const quickProtocols = [
    { name: 'clean temp files', label: 'Clean Temp Files', desc: 'Deletes %temp% & system scratch caches' },
    { name: 'flush dns', label: 'Flush DNS Resolver', desc: 'Clears system DNS cache resolver' },
    { name: 'system info', label: 'Host System Report', desc: 'Extracts full OS hardware & patch specifications' },
    { name: 'list connections', label: 'Network Connections', desc: 'Displays active listening ports and sockets' },
    { name: 'check disk', label: 'Inspect Storage (C:)', desc: 'Runs NTFS volume integrity assessment' },
    { name: 'ip configuration', label: 'IP & Adapters', desc: 'Fetches network interfaces, gateways, and DHCP' },
    { name: 'uptime', label: 'Workstation Uptime', desc: 'Calculates active workstation running session' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-y-auto p-5 font-sans space-y-4">
      {/* Swiss Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* CPU */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] mb-1 uppercase">
            <span>CPU Load</span>
            <span>Host</span>
          </div>
          <div className="text-2xl font-bold font-mono text-black tracking-tight">
            {vitals?.cpu?.load || 0}%
          </div>
          <div className="w-full bg-[#e2e8f0] h-1 mt-3 overflow-hidden">
            <div 
              style={{ width: `${Math.min(vitals?.cpu?.load || 0, 100)}%` }}
              className="bg-black h-full"
            />
          </div>
        </div>

        {/* Memory */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] mb-1 uppercase">
            <span>RAM</span>
            <span>{formatBytes(vitals?.memory?.used)} / {formatBytes(vitals?.memory?.total)}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-black tracking-tight">
            {vitals?.memory?.percent || 0}%
          </div>
          <div className="w-full bg-[#e2e8f0] h-1 mt-3 overflow-hidden">
            <div 
              style={{ width: `${Math.min(vitals?.memory?.percent || 0, 100)}%` }}
              className="bg-black h-full"
            />
          </div>
        </div>

        {/* Disk */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] mb-1 uppercase">
            <span>Storage ({vitals?.disks?.[0]?.mount || 'C:'})</span>
            <span>Used</span>
          </div>
          <div className="text-2xl font-bold font-mono text-black tracking-tight">
            {vitals?.disks?.[0]?.usePercent ? Math.round(vitals.disks[0].usePercent) : 0}%
          </div>
          <div className="w-full bg-[#e2e8f0] h-1 mt-3 overflow-hidden">
            <div 
              style={{ width: `${vitals?.disks?.[0]?.usePercent || 0}%` }}
              className="bg-black h-full"
            />
          </div>
        </div>

        {/* System Specs */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] p-4 font-mono">
          <div className="text-[11px] text-[#64748b] mb-1 uppercase">
            Node System
          </div>
          <div className="text-xs font-bold text-black truncate">
            {vitals?.os?.hostname || 'WINDOWS-NODE'}
          </div>
          <p className="text-[11px] text-[#64748b] truncate mt-1">
            {vitals?.os?.distro || 'Microsoft Windows'}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 pt-1 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 border font-bold uppercase transition-colors ${
              activeSubTab === 'overview'
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#475569] border-[#e2e8f0] hover:text-black hover:border-black'
            }`}
          >
            Power & Display
          </button>
          <button
            onClick={() => setActiveSubTab('processes')}
            className={`px-3 py-1.5 border font-bold uppercase transition-colors ${
              activeSubTab === 'processes'
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#475569] border-[#e2e8f0] hover:text-black hover:border-black'
            }`}
          >
            Processes ({processes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('protocols')}
            className={`px-3 py-1.5 border font-bold uppercase transition-colors ${
              activeSubTab === 'protocols'
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#475569] border-[#e2e8f0] hover:text-black hover:border-black'
            }`}
          >
            System Protocols
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 border font-bold uppercase transition-colors ${
              activeSubTab === 'logs'
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#475569] border-[#e2e8f0] hover:text-black hover:border-black'
            }`}
          >
            Audit Logs
          </button>
        </div>

        <button
          onClick={handleCaptureScreen}
          disabled={isCapturing}
          className="px-3 py-1.5 bg-black text-white font-bold uppercase flex items-center space-x-1.5 hover:bg-neutral-800 transition-colors"
        >
          <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
          <span>{isCapturing ? 'Capturing...' : 'Capture Screen'}</span>
        </button>
      </div>

      {/* Notice Banner */}
      {powerMessage && (
        <div className={`p-3 text-xs font-mono border ${
          powerMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          {powerMessage.text}
        </div>
      )}

      {/* Sub-Tab 1: Overview & Power Controls */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e2e8f0] p-5">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-4">
              Hardware Power Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {powerButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handlePowerAction(btn.id)}
                  disabled={powerLoading !== null}
                  className="bg-[#f8fafc] border border-[#e2e8f0] hover:border-black p-4 flex flex-col items-start justify-between text-left transition-colors group relative"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <btn.icon className="w-4 h-4 text-[#475569] group-hover:text-black transition-colors" />
                    {powerLoading === btn.id && (
                      <RefreshCw className="w-3 h-3 animate-spin text-black" />
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-black tracking-wider">
                    {btn.label}
                  </span>
                  <span className="text-[10px] text-[#64748b] mt-1">
                    {btn.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Display Snapshot Card */}
          <div className="bg-white border border-[#e2e8f0] p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-1">
                Visual Telemetry & Display
              </h3>
              <p className="text-xs text-[#64748b]">
                Capture instant full-resolution JPG frames of the primary monitor or launch the dedicated Remote Desktop stream.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCaptureScreen}
                disabled={isCapturing}
                className="px-4 py-2 bg-black text-white font-mono text-xs font-bold uppercase hover:bg-neutral-800 transition-colors"
              >
                Inspect Screen Frame
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Process Manager */}
      {activeSubTab === 'processes' && (
        <div className="bg-white border border-[#e2e8f0] p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3 border-b border-[#e2e8f0] pb-2 font-mono text-xs">
            <span className="font-bold text-black uppercase">
              Host Processes ({filteredProc.length})
            </span>
            <div className="flex items-center space-x-2">
              <div className="relative w-48">
                <Search className="w-3 h-3 text-[#94a3b8] absolute left-2 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter process or PID..."
                  value={procFilter}
                  onChange={(e) => setProcFilter(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] pl-6 pr-2 py-1 text-[11px] text-black focus:outline-none focus:border-black font-mono"
                />
              </div>
              <button
                onClick={loadProcesses}
                className="p-1 text-[#64748b] hover:text-black"
                title="Refresh Processes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${procLoading ? 'animate-spin text-black' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase border-b border-[#e2e8f0] text-[11px]">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3 w-20">PID</th>
                  <th className="p-3 w-20">CPU %</th>
                  <th className="p-3 w-20">Mem %</th>
                  <th className="p-3 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredProc.map((p) => (
                  <tr key={p.pid} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 truncate max-w-[200px] text-black font-sans font-medium">
                      {p.name}
                    </td>
                    <td className="p-3 text-[#64748b]">{p.pid}</td>
                    <td className="p-3 text-black">{p.cpu}%</td>
                    <td className="p-3 text-black">{p.mem}%</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleKillProcess(p.pid, p.name)}
                        className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] uppercase font-bold transition-colors"
                      >
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: System Maintenance Protocols */}
      {activeSubTab === 'protocols' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#e2e8f0] p-4 flex flex-col space-y-3">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest border-b border-[#e2e8f0] pb-2">
              Automated Maintenance Protocols
            </h3>
            <div className="space-y-2">
              {quickProtocols.map((proto) => (
                <div
                  key={proto.name}
                  className="p-3 bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-3 hover:border-black transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-mono font-bold text-black">{proto.label}</h4>
                    <p className="text-[11px] text-[#64748b]">{proto.desc}</p>
                  </div>
                  <button
                    onClick={() => handleRunProtocol(proto.name)}
                    disabled={runningProtocol !== null}
                    className="px-3.5 py-1.5 bg-black text-white font-mono text-[10px] font-bold uppercase hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center space-x-1"
                  >
                    {runningProtocol === proto.name ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Running</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Execute</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] p-4 flex flex-col h-[480px]">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest border-b border-[#e2e8f0] pb-2 mb-3">
              Protocol Output Stream
            </h3>
            <div className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-[#0f172a]">
              {protocolOutput ? (
                <div>
                  <div className="text-black font-bold mb-2 pb-1 border-b border-[#e2e8f0]">
                    // Protocol: {protocolOutput.protocol?.toUpperCase()}
                  </div>
                  <pre className="text-[11px] leading-relaxed text-[#334155]">{protocolOutput.output}</pre>
                </div>
              ) : (
                <span className="text-[#94a3b8]">Execute a protocol to view live execution logs and telemetry...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Audit & Activity Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-[#e2e8f0] p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3 border-b border-[#e2e8f0] pb-2 font-mono text-xs">
            <span className="font-bold text-black uppercase">
              System Audit Logs ({activityLogs.length})
            </span>
            <button
              onClick={loadActivityLogs}
              className="p-1 text-[#64748b] hover:text-black"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin text-black' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase border-b border-[#e2e8f0] text-[11px]">
                <tr>
                  <th className="p-3 w-40">Timestamp</th>
                  <th className="p-3 w-32">Action</th>
                  <th className="p-3">Details</th>
                  <th className="p-3 w-28">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 text-[#64748b]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-black uppercase">
                      {log.action}
                    </td>
                    <td className="p-3 text-[#334155] font-sans">
                      {log.details}
                    </td>
                    <td className="p-3 text-black font-bold">
                      {log.username || log.userId || 'admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Preview & Download Modal */}
      {screenshotModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-5xl bg-white border border-[#e2e8f0] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-[#e2e8f0] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-black" />
                <span className="font-bold text-black uppercase">Host Screen Capture</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={screenshotModalUrl}
                  download="nexus_capture.jpg"
                  className="px-3.5 py-1.5 bg-black text-white font-bold uppercase flex items-center space-x-1 hover:bg-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JPG</span>
                </a>
                <button
                  onClick={() => setScreenshotModalUrl(null)}
                  className="p-1 text-[#64748b] hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Preview Canvas */}
            <div className="p-4 bg-[#f8fafc] flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={screenshotModalUrl}
                alt="Captured Remote Display"
                className="max-w-full max-h-[70vh] object-contain border border-[#e2e8f0]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
