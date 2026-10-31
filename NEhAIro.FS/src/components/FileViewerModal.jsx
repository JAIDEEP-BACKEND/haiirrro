import React, { useState, useEffect } from 'react';
import { 
  X, Save, Download, FileCode, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function FileViewerModal({ isOpen, filePath, fileName, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isBinary, setIsBinary] = useState(false);
  const [category, setCategory] = useState('other');
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (isOpen && filePath) {
      loadFile();
    }
  }, [isOpen, filePath]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const res = await api.getFileContent(filePath);
      setContent(res.data.content || '');
      setIsBinary(res.data.isBinary || false);
      setCategory(res.data.classification?.category || 'other');
      setIsModified(false);
    } catch (err) {
      setContent(`[Failed to read file: ${err.message}]`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.saveFileContent(filePath, content);
      setIsModified(false);
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const previewUrl = api.getPreviewUrl(filePath);
  const downloadUrl = api.getDownloadUrl(filePath);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-[#e2e8f0] w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-3 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold text-black truncate max-w-md">
              {fileName}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-white text-[#475569] border border-[#e2e8f0] uppercase font-bold">
              {category}
            </span>
            {isModified && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                MODIFIED
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isBinary && (
              <button
                onClick={handleSave}
                disabled={saving || !isModified}
                className="px-4 py-1.5 bg-black text-white font-bold text-xs uppercase flex items-center space-x-1.5 hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'SAVING...' : 'SAVE'}</span>
              </button>
            )}

            <a
              href={downloadUrl}
              download={fileName}
              className="px-3.5 py-1.5 bg-white hover:bg-[#f8fafc] text-black text-xs font-bold uppercase border border-[#e2e8f0] flex items-center space-x-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD</span>
            </a>

            <button
              onClick={onClose}
              className="p-1 text-[#64748b] hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col p-3 font-mono text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-[#64748b]">
              <RefreshCw className="w-5 h-5 animate-spin text-black mb-2" />
              <span>Loading file contents...</span>
            </div>
          ) : category === 'pdf' ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border border-[#e2e8f0]"
              title={fileName}
            />
          ) : category === 'image' ? (
            <div className="flex items-center justify-center h-full overflow-auto p-4 bg-[#f8fafc]">
              <img
                src={previewUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain border border-[#e2e8f0]"
              />
            </div>
          ) : category === 'video' ? (
            <div className="flex items-center justify-center h-full p-4 bg-[#f8fafc]">
              <video controls className="max-h-full max-w-full">
                <source src={previewUrl} />
                Video preview unsupported.
              </video>
            </div>
          ) : category === 'audio' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 bg-[#f8fafc]">
              <p className="text-xs text-black font-bold">{fileName}</p>
              <audio controls className="w-96">
                <source src={previewUrl} />
              </audio>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsModified(true);
              }}
              spellCheck={false}
              className="w-full h-full bg-[#f8fafc] border border-[#e2e8f0] p-4 text-[#0f172a] focus:outline-none focus:border-black font-mono text-xs leading-relaxed resize-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
