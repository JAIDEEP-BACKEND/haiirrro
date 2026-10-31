import React, { useState } from 'react';
import { 
  Search, FileText, Eye, Download, Folder, Filter, 
  RefreshCw, CheckCircle2, FileCode
} from 'lucide-react';
import { api } from '../services/api';

export default function AiFileFinder({ onOpenFile }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('all');
  const [contentSearch, setContentSearch] = useState(false);
  const [deepScan, setDeepScan] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [targetDir, setTargetDir] = useState('');

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() && !targetDir.trim() && category === 'all') return;

    try {
      setIsSearching(true);
      const res = await api.huntFiles(query.trim());
      setResults(res.data.results || []);
      setTotalFound(res.data.totalFound || 0);
    } catch (err) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = async (e) => {
    e?.preventDefault();
    try {
      setIsSearching(true);
      const res = await api.findFiles({
        query: query.trim(),
        targetDir: targetDir.trim() || null,
        category: category !== 'all' ? category : null,
        contentSearch,
        deepScan,
        dateRange: dateRange !== 'all' ? dateRange : null,
      });
      setResults(res.data.results || []);
      setTotalFound(res.data.totalFound || 0);
    } catch (err) {
      alert(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-hidden font-sans">
      {/* Top Search Bar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] p-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-2.5 mb-3">
            <h1 className="text-xs font-bold font-mono text-black uppercase tracking-widest">
              File Search & Discovery
            </h1>
            <span className="text-[10px] px-2 py-0.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] font-mono font-bold">
              SEMANTIC ENGINE
            </span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <div className="flex items-center bg-[#ffffff] border border-[#e2e8f0] focus-within:border-black p-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search by filename, description, or type: e.g. "quarterly report pdf", "auth controller", "database schema"'
                className="w-full bg-transparent px-3 py-2 text-xs text-black placeholder-[#94a3b8] focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2 bg-black text-white font-mono font-bold text-xs uppercase flex items-center space-x-1.5 hover:bg-neutral-800 transition-colors shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearching ? 'SEARCHING...' : 'SEARCH'}</span>
              </button>
            </div>
          </form>

          {/* Filters Bar */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#64748b]">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentSearch}
                  onChange={(e) => setContentSearch(e.target.checked)}
                  className="accent-black"
                />
                <span className={contentSearch ? 'text-black font-bold' : ''}>Search inside file contents</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deepScan}
                  onChange={(e) => setDeepScan(e.target.checked)}
                  className="accent-black"
                />
                <span className={deepScan ? 'text-black font-bold' : ''}>Deep scan subdirectories</span>
              </label>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-black font-bold hover:underline flex items-center space-x-1"
            >
              <Filter className="w-3 h-3" />
              <span>{showFilters ? 'Hide Filters' : 'Precision Filters'}</span>
            </button>
          </div>

          {/* Precision Filters Drawer */}
          {showFilters && (
            <div className="mt-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[#475569] font-bold uppercase mb-1">Format Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] p-1.5 text-black focus:outline-none focus:border-black"
                >
                  <option value="all">All Formats</option>
                  <option value="pdf">PDF Documents</option>
                  <option value="presentation">Presentations (.pptx)</option>
                  <option value="spreadsheet">Spreadsheets (.xlsx, .csv)</option>
                  <option value="code">Code & Scripts</option>
                  <option value="document">Text & Markdown</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="archive">Archives</option>
                </select>
              </div>

              <div>
                <label className="block text-[#475569] font-bold uppercase mb-1">Target Directory</label>
                <input
                  type="text"
                  value={targetDir}
                  onChange={(e) => setTargetDir(e.target.value)}
                  placeholder="e.g. C:\Projects"
                  className="w-full bg-white border border-[#e2e8f0] p-1.5 text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleManualSearch}
                  className="w-full py-1.5 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Viewport */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto">
          {isSearching ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-[#64748b] font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-black" />
              <span>Analyzing query semantics and scanning drives...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center text-[#64748b] font-mono text-xs border border-dashed border-[#e2e8f0] p-8">
              Enter a search query above to locate files anywhere across storage drives.
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0]">
              <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-black uppercase">
                  Search Matches ({results.length})
                </span>
              </div>

              <div className="divide-y divide-[#f1f5f9]">
                {results.map((file, idx) => (
                  <div key={idx} className="p-4 hover:bg-[#f8fafc] transition-colors flex items-start justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex items-center space-x-2">
                        <FileCode className="w-4 h-4 text-[#64748b] shrink-0" />
                        <span className="text-black font-sans font-bold text-sm">
                          {file.name}
                        </span>
                        {file.matchScore && (
                          <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] text-[10px] uppercase font-bold">
                            Score: {file.matchScore}%
                          </span>
                        )}
                        <span className="text-[11px] text-[#64748b]">
                          {formatBytes(file.size)}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#64748b] truncate" title={file.path}>
                        {file.path}
                      </div>

                      {file.matchedSnippet && (
                        <div className="mt-2 p-2 bg-[#f8fafc] border border-[#e2e8f0] text-[11px] text-[#334155] font-mono whitespace-pre-wrap">
                          {file.matchedSnippet}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 pt-1">
                      <button
                        onClick={() => onOpenFile(file.path, file.name)}
                        className="p-1.5 bg-white border border-[#e2e8f0] hover:border-black text-[#475569] hover:text-black transition-colors"
                        title="Open File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={api.getDownloadUrl(file.path)}
                        download={file.name}
                        className="p-1.5 bg-white border border-[#e2e8f0] hover:border-black text-[#475569] hover:text-black transition-colors"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
