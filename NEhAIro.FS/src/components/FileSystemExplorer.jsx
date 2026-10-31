import React, { useState, useEffect } from 'react';
import { 
  Folder, File, HardDrive, Upload, FolderPlus, FilePlus, 
  Trash2, Download, Eye, Edit3, RefreshCw, 
  Search, Grid, List, ChevronRight, FileText, FileCode,
  Image, Video, Music, Archive, Table, Presentation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function FileSystemExplorer({ 
  onOpenFile,
  onRefreshVitals,
  initialPath = 'C:\\'
}) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [drives, setDrives] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  
  // Modals
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileModal, setNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [moveModal, setMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
  const [moveDestination, setMoveDestination] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDrives();
    loadDirectory(currentPath);
  }, []);

  const loadDrives = async () => {
    try {
      const res = await api.getDrives();
      setDrives(res.data || []);
    } catch (e) {}
  };

  const loadDirectory = async (targetPath) => {
    try {
      setLoading(true);
      const res = await api.getFiles(targetPath);
      setCurrentPath(res.data.currentPath);
      setBreadcrumbs(res.data.breadcrumbs || []);
      setEntries(res.data.entries || []);
    } catch (err) {
      alert(`Directory load error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDriveClick = (drivePath) => {
    loadDirectory(drivePath);
  };

  const handleItemClick = (entry) => {
    if (entry.isDirectory) {
      loadDirectory(entry.path);
    } else {
      onOpenFile(entry.path, entry.name);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(currentPath, newFolderName.trim());
      setNewFolderModal(false);
      setNewFolderName('');
      loadDirectory(currentPath);
    } catch (e) {
      alert(`Error creating folder: ${e.message}`);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      await api.createFile(currentPath, newFileName.trim(), '');
      setNewFileModal(false);
      setNewFileName('');
      loadDirectory(currentPath);
    } catch (e) {
      alert(`Error creating file: ${e.message}`);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete ${entry.isDirectory ? 'folder' : 'file'} "${entry.name}"?`)) return;
    try {
      await api.deleteItem(entry.path);
      loadDirectory(currentPath);
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!moveDestination.trim() || !itemToMove) return;
    try {
      await api.moveItem(itemToMove.path, moveDestination.trim());
      setMoveModal(false);
      setItemToMove(null);
      loadDirectory(currentPath);
    } catch (e) {
      alert(`Move error: ${e.message}`);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('path', currentPath);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setUploading(true);
      await api.uploadFiles(formData, currentPath);
      loadDirectory(currentPath);
    } catch (e) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (entry) => {
    if (entry.isDirectory) return <Folder className="w-4 h-4 text-black fill-current" />;
    return <FileText className="w-4 h-4 text-[#64748b]" />;
  };

  const filteredEntries = entries.filter((e) => 
    e.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ffffff] overflow-hidden font-sans">
      {/* Swiss Action Bar */}
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Drive Selector */}
        <div className="flex items-center space-x-1 font-mono text-xs">
          <span className="text-[10px] text-[#64748b] font-bold mr-1.5 uppercase">DRIVE:</span>
          {drives.map((d) => (
            <button
              key={d.name}
              onClick={() => handleDriveClick(d.path)}
              className={`px-2.5 py-1 text-xs transition-colors border ${
                currentPath.startsWith(d.name)
                  ? 'bg-black text-white font-bold border-black'
                  : 'bg-[#f8fafc] text-[#475569] hover:text-black border-[#e2e8f0]'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <label className="cursor-pointer px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center space-x-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'UPLOADING...' : 'UPLOAD'}</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>

          <button
            onClick={() => setNewFolderModal(true)}
            className="px-3 py-1.5 bg-[#ffffff] hover:bg-[#f8fafc] text-black border border-[#e2e8f0] font-bold uppercase flex items-center space-x-1.5 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#64748b]" />
            <span>NEW FOLDER</span>
          </button>

          <button
            onClick={() => setNewFileModal(true)}
            className="px-3 py-1.5 bg-[#ffffff] hover:bg-[#f8fafc] text-black border border-[#e2e8f0] font-bold uppercase flex items-center space-x-1.5 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#64748b]" />
            <span>NEW FILE</span>
          </button>

          <button
            onClick={() => loadDirectory(currentPath)}
            title="Refresh Directory"
            className="p-1.5 bg-[#ffffff] text-[#475569] hover:text-black border border-[#e2e8f0] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-black' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex border border-[#e2e8f0] bg-[#f8fafc]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-black text-white' : 'text-[#64748b] hover:text-black'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-black text-white' : 'text-[#64748b] hover:text-black'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Path Breadcrumbs & Filter */}
      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-2 flex items-center justify-between text-xs font-mono">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1 overflow-x-auto whitespace-nowrap scrollbar-none max-w-[65%]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              <button
                onClick={() => loadDirectory(crumb.path)}
                className={`hover:text-black transition-colors ${
                  idx === breadcrumbs.length - 1 ? 'text-black font-bold' : 'text-[#64748b]'
                }`}
              >
                {crumb.name}
              </button>
              {idx < breadcrumbs.length - 1 && (
                <ChevronRight className="w-3 h-3 text-[#94a3b8] shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Quick Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative w-44">
            <Search className="w-3 h-3 text-[#94a3b8] absolute left-2 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter items..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-white border border-[#e2e8f0] pl-6 pr-2 py-0.5 text-xs text-black focus:outline-none focus:border-black font-mono"
            />
          </div>
          <span className="text-[#64748b] text-[11px]">
            {filteredEntries.length} items
          </span>
        </div>
      </div>

      {/* Main File Viewport */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 text-[#64748b] font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-black" />
            <span>Loading folder contents...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#64748b] font-mono text-xs border border-dashed border-[#e2e8f0] m-4">
            Directory is empty or no matches found.
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white border border-[#e2e8f0]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase border-b border-[#e2e8f0] text-[11px]">
                <tr>
                  <th className="p-3 w-8"></th>
                  <th className="p-3">Name</th>
                  <th className="p-3 w-32">Size</th>
                  <th className="p-3 w-40">Modified</th>
                  <th className="p-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredEntries.map((entry) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    key={entry.path}
                    className="hover:bg-[#f8fafc] transition-colors group cursor-pointer"
                    onDoubleClick={() => handleItemClick(entry)}
                  >
                    <td className="p-3 text-center" onClick={() => handleItemClick(entry)}>
                      {getFileIcon(entry)}
                    </td>
                    <td className="p-3 font-sans" onClick={() => handleItemClick(entry)}>
                      <span className={`font-medium ${entry.isDirectory ? 'text-black font-bold' : 'text-[#334155]'}`}>
                        {entry.name}
                      </span>
                    </td>
                    <td className="p-3 text-[#64748b]" onClick={() => handleItemClick(entry)}>
                      {entry.isDirectory ? '--' : formatBytes(entry.size)}
                    </td>
                    <td className="p-3 text-[#64748b]" onClick={() => handleItemClick(entry)}>
                      {entry.modifiedAt ? new Date(entry.modifiedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {!entry.isDirectory && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenFile(entry.path, entry.name); }}
                              className="p-1 text-[#64748b] hover:text-black transition-colors"
                              title="View / Edit"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={api.getDownloadUrl(entry.path)}
                              download={entry.name}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-[#64748b] hover:text-black transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToMove(entry);
                            setMoveDestination(currentPath + '\\' + entry.name);
                            setMoveModal(true);
                          }}
                          className="p-1 text-[#64748b] hover:text-black transition-colors"
                          title="Move / Rename"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry); }}
                          className="p-1 text-[#64748b] hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredEntries.map((entry) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                key={entry.path}
                onDoubleClick={() => handleItemClick(entry)}
                className="p-3 bg-white border border-[#e2e8f0] hover:border-black transition-colors flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  {getFileIcon(entry)}
                  <span className="text-[10px] font-mono text-[#94a3b8]">
                    {entry.isDirectory ? 'DIR' : formatBytes(entry.size)}
                  </span>
                </div>
                <div className="text-xs font-sans font-medium text-black truncate" title={entry.name}>
                  {entry.name}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {newFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#e2e8f0] p-5 shadow-xl font-sans">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-3">
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3 font-mono text-xs">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder Name"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewFolderModal(false)}
                  className="px-3 py-1.5 bg-white text-[#475569] border border-[#e2e8f0] hover:text-black font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {newFileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#e2e8f0] p-5 shadow-xl font-sans">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-3">
              Create New File
            </h3>
            <form onSubmit={handleCreateFile} className="space-y-3 font-mono text-xs">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="file.txt, script.js, etc."
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewFileModal(false)}
                  className="px-3 py-1.5 bg-white text-[#475569] border border-[#e2e8f0] hover:text-black font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move / Rename Modal */}
      {moveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#e2e8f0] p-5 shadow-xl font-sans">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-widest mb-1">
              Move or Rename Item
            </h3>
            <p className="text-xs text-[#64748b] mb-3 truncate">
              {itemToMove?.path}
            </p>
            <form onSubmit={handleMoveSubmit} className="space-y-3 font-mono text-xs">
              <input
                type="text"
                value={moveDestination}
                onChange={(e) => setMoveDestination(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-2 text-black focus:outline-none focus:border-black"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMoveModal(false)}
                  className="px-3 py-1.5 bg-white text-[#475569] border border-[#e2e8f0] hover:text-black font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
