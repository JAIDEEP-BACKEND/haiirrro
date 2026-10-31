import React, { useState, useEffect } from 'react';
import { 
  FileText, Presentation, Table, Terminal, FileCode,
  Image, Video, Music, Archive, ArrowRight,
  FolderSync, Download, Eye, CheckCircle2, RefreshCw,
  Filter, Folder, Layers, FolderPlus
} from 'lucide-react';
import { api } from '../services/api';

export default function FormatHub({ onOpenFile, currentPath = 'C:\\' }) {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [targetDir, setTargetDir] = useState(currentPath);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [organizeResult, setOrganizeResult] = useState(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  
  // Segregation Modal
  const [segregateModal, setSegregateModal] = useState(false);
  const [segregateCategory, setSegregateCategory] = useState('pdf');
  const [segregateDestination, setSegregateDestination] = useState('');
  const [isSegregating, setIsSegregating] = useState(false);

  useEffect(() => {
    loadCategories();
    scanFiles(targetDir, selectedCategory);
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.getFormatCategories();
      setCategories(res.data || {});
    } catch (e) {}
  };

  const scanFiles = async (dir, cat = 'all') => {
    try {
      setLoading(true);
      const res = await api.scanByFormat(dir, cat);
      setFiles(res.data.files || []);
    } catch (err) {
      alert(`Format scan error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (catKey) => {
    setSelectedCategory(catKey);
    scanFiles(targetDir, catKey);
  };

  const handleAutoOrganize = async () => {
    if (!window.confirm(`Auto-organize files in "${targetDir}" into categorized subfolders (PDFs, Presentations, Code, Images, Spreadsheets, etc.)?`)) return;
    try {
      setIsOrganizing(true);
      const res = await api.autoOrganize(targetDir);
      setOrganizeResult(res.data);
      scanFiles(targetDir, selectedCategory);
    } catch (e) {
      alert(`Auto-organize error: ${e.message}`);
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleSegregateSubmit = async (e) => {
    e.preventDefault();
    if (!segregateDestination.trim()) return;
    try {
      setIsSegregating(true);
      const res = await api.segregateFormat(targetDir, segregateCategory, segregateDestination.trim());
      alert(`Segregation complete: ${res.data.totalMoved} files moved to "${segregateDestination}".`);
      setSegregateModal(false);
      scanFiles(targetDir, selectedCategory);
    } catch (e) {
      alert(`Segregation error: ${e.message}`);
    } finally {
      setIsSegregating(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const categoryCards = [
    { key: 'all', label: 'All Formats', icon: Layers },
    { key: 'pdf', label: 'PDFs', icon: FileText },
    { key: 'presentation', label: 'Presentations', icon: Presentation },
    { key: 'spreadsheet', label: 'Spreadsheets', icon: Table },
    { key: 'code', label: 'Code & Scripts', icon: Terminal },
    { key: 'document', label: 'Documents', icon: FileCode },
    { key: 'image', label: 'Images', icon: Image },
    { key: 'video', label: 'Videos', icon: Video },
    { key: 'audio', label: 'Audio', icon: Music },
    { key: 'archive', label: 'Archives', icon: Archive },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-hidden font-sans">
      {/* Top Swiss Action Bar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xs font-bold font-mono text-black uppercase tracking-widest">
              Format Management Hub
            </h1>
            <span className="text-[10px] px-2 py-0.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] font-mono font-bold">
              RECURSIVE
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Deep recursive scanning, format segregation, and batch directory organization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 text-xs font-mono">
            <span className="text-[#64748b] font-bold">PATH:</span>
            <input
              type="text"
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scanFiles(targetDir, selectedCategory)}
              className="bg-transparent text-black focus:outline-none w-52 text-xs font-mono"
            />
            <button
              onClick={() => scanFiles(targetDir, selectedCategory)}
              className="text-[#475569] hover:text-black transition-colors"
              title="Rescan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleAutoOrganize}
            disabled={isOrganizing}
            className="px-4 py-1.5 bg-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 hover:bg-neutral-800 transition-colors"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isOrganizing ? 'animate-spin' : ''}`} />
            <span>{isOrganizing ? 'Organizing...' : 'Auto-Organize'}</span>
          </button>

          <button
            onClick={() => {
              setSegregateDestination(targetDir + '\\Separated_Files');
              setSegregateModal(true);
            }}
            className="px-3.5 py-1.5 bg-white text-black border border-[#e2e8f0] hover:border-black text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            Segregate
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-2.5 flex items-center space-x-2 overflow-x-auto">
        <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64748b] mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-bold uppercase">FILTER:</span>
        </div>
        {categoryCards.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategorySelect(cat.key)}
              className={`px-3 py-1 text-xs font-mono whitespace-nowrap flex items-center space-x-1.5 border transition-all ${
                isActive
                  ? 'bg-black text-white border-black font-bold'
                  : 'bg-white text-[#475569] border-[#e2e8f0] hover:text-black hover:border-[#cbd5e1]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Organize Results Banner */}
      {organizeResult && (
        <div className="bg-[#f0fdf4] border-b border-[#bbf7d0] px-5 py-2.5 flex items-center justify-between text-xs text-[#166534] font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            <span>
              Auto-Organized <strong>{organizeResult.totalMoved}</strong> files across categorized folders in <strong>{organizeResult.targetDirectory}</strong>.
            </span>
          </div>
          <button
            onClick={() => setOrganizeResult(null)}
            className="text-[#166534] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Files Table */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white border border-[#e2e8f0]">
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-black uppercase">
              Classified Items ({files.length})
            </span>
            <span className="text-[#64748b]">
              Location: {targetDir}
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-[#64748b] font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-black" />
              <span>Scanning directory hierarchy recursively...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="py-20 text-center text-[#64748b] font-mono text-xs">
              No files detected matching category "{selectedCategory.toUpperCase()}".
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase border-b border-[#e2e8f0] text-[11px]">
                <tr>
                  <th className="p-3">File Name</th>
                  <th className="p-3 w-36">Category</th>
                  <th className="p-3 w-28">Size</th>
                  <th className="p-3 w-44">Subdirectory</th>
                  <th className="p-3 w-40">Modified</th>
                  <th className="p-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {files.map((file, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <FileCode className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                        <span className="text-black font-sans font-medium truncate max-w-xs" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] text-[10px] uppercase font-bold">
                        {file.category}
                      </span>
                    </td>
                    <td className="p-3 text-[#64748b]">{formatBytes(file.size)}</td>
                    <td className="p-3 text-[#64748b] truncate max-w-[180px]" title={file.directory}>
                      {file.directory ? file.directory.replace(targetDir, '') || '\\' : '\\'}
                    </td>
                    <td className="p-3 text-[#64748b]">
                      {file.modifiedAt ? new Date(file.modifiedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onOpenFile(file.path, file.name)}
                          className="p-1 text-[#475569] hover:text-black transition-colors"
                          title="View / Edit File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={api.getDownloadUrl(file.path)}
                          download={file.name}
                          className="p-1 text-[#475569] hover:text-black transition-colors"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Segregation Modal */}
      {segregateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#e2e8f0] shadow-xl p-6 font-sans">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-2">
              Segregate Format Category
            </h3>
            <p className="text-xs text-[#64748b] mb-4">
              Batch move all files of a specific format into a designated target directory.
            </p>

            <form onSubmit={handleSegregateSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#475569] font-bold uppercase mb-1">Select Format</label>
                <select
                  value={segregateCategory}
                  onChange={(e) => setSegregateCategory(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                >
                  <option value="pdf">PDF Documents (.pdf)</option>
                  <option value="presentation">Presentations (.pptx, .ppt, .key)</option>
                  <option value="spreadsheet">Spreadsheets (.xlsx, .csv, .xls)</option>
                  <option value="code">Code & Scripts (.js, .py, .java, etc.)</option>
                  <option value="document">Documents (.docx, .txt, .md)</option>
                  <option value="image">Images (.png, .jpg, .svg)</option>
                  <option value="video">Videos (.mp4, .mov, .mkv)</option>
                  <option value="archive">Archives (.zip, .rar, .tar)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#475569] font-bold uppercase mb-1">Destination Directory</label>
                <input
                  type="text"
                  value={segregateDestination}
                  onChange={(e) => setSegregateDestination(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                  placeholder="e.g. C:\Users\jaide\Desktop\Segregated"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setSegregateModal(false)}
                  className="px-4 py-1.5 bg-white text-[#475569] border border-[#e2e8f0] hover:text-black font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSegregating}
                  className="px-4 py-1.5 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800"
                >
                  {isSegregating ? 'Segregating...' : 'Start Move'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
