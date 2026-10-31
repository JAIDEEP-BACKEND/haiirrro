import React, { useState, useEffect } from 'react';
import { 
  Bot, Download, CheckCircle2, Cpu, HardDrive, 
  RefreshCw, X, AlertCircle, Sparkles, Layers, Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function ModelManagerModal({ isOpen, onClose, onModelChanged }) {
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pull Model State
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(null);
  const [pullStatusText, setPullStatusText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const res = await api.getOllamaModels();
      setModels(res.data.models || []);
      setActiveModel(res.data.activeModel || '');
    } catch (err) {
      alert(`Error loading Ollama models: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (modelName) => {
    try {
      await api.setOllamaModel(modelName);
      setActiveModel(modelName);
      if (onModelChanged) onModelChanged(modelName);
    } catch (e) {
      alert(`Failed to set model: ${e.message}`);
    }
  };

  const handlePullModel = async (e, customName = null) => {
    e?.preventDefault();
    const target = (customName || pullModelName).trim();
    if (!target) return;

    try {
      setIsPulling(true);
      setPullStatusText(`Initiating pull for ${target}...`);
      await api.pullOllamaModel(target);
      setPullStatusText(`Model ${target} installed successfully!`);
      setPullModelName('');
      loadModels();
    } catch (err) {
      setPullStatusText(`Pull failed: ${err.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const recommendedModels = [
    { name: 'qwen2.5-coder:7b', desc: 'Code Generation & Shell Commands' },
    { name: 'gemma3:4b', desc: 'Fast Lightweight Reasoning' },
    { name: 'llama3:latest', desc: 'General Intelligence (8B)' },
    { name: 'nomic-embed-text:latest', desc: 'Embeddings & Semantic Search' },
    { name: 'deepseek-r1:7b', desc: 'Reasoning & Step-by-Step Logic' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-[#0b1018] border border-[#00f0ff]/50 w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1a2332] mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center space-x-2">
                <span>OLLAMA INTELLIGENCE & MODEL HUB</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40">
                  GPU ACCELERATED
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Manage, select, and pull local LLMs for NEhAIro reasoning & AI File Finder
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Puller Form */}
        <div className="bg-[#070b10] border border-[#1e2a3c] p-3.5 mb-4">
          <h4 className="text-xs font-bold text-[#00ff88] uppercase mb-2 flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Pull & Download New Ollama Model</span>
          </h4>
          <form onSubmit={handlePullModel} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="e.g. qwen2.5-coder:7b, deepseek-r1:7b, llama3.2"
              value={pullModelName}
              onChange={(e) => setPullModelName(e.target.value)}
              className="flex-1 bg-[#0d121c] border border-[#1e2636] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff88]"
            />
            <button
              type="submit"
              disabled={isPulling || !pullModelName.trim()}
              className="px-4 py-1.5 bg-[#00ff88] text-black font-bold text-xs hover:bg-[#00dd77] disabled:opacity-40"
            >
              {isPulling ? 'DOWNLOADING...' : 'PULL MODEL'}
            </button>
          </form>

          {/* Quick Recommendations */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-gray-500">QUICK PULL:</span>
            {recommendedModels.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={(e) => handlePullModel(e, m.name)}
                disabled={isPulling}
                className="text-[10px] px-2 py-0.5 bg-[#101824] hover:bg-[#1a2538] text-gray-300 border border-[#1e2a3c] hover:border-[#00ff88]"
              >
                + {m.name}
              </button>
            ))}
          </div>

          {pullStatusText && (
            <div className="mt-2 text-[11px] text-[#00f0ff] bg-[#00f0ff]/10 p-2 border border-[#00f0ff]/20">
              {pullStatusText}
            </div>
          )}
        </div>

        {/* Installed Models List */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-bold uppercase">
              INSTALLED LOCAL MODELS ({models.length})
            </span>
            <button
              onClick={loadModels}
              className="text-[11px] text-[#00f0ff] hover:underline flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00f0ff] mb-2" />
              <span>Querying local Ollama runtime...</span>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center p-6 text-xs text-gray-500 border border-dashed border-[#1e2a3c]">
              No models installed yet. Pull one using the field above.
            </div>
          ) : (
            <div className="space-y-2">
              {models.map((model) => {
                const isCurrent = activeModel === model.name || activeModel === model.model;
                return (
                  <div
                    key={model.name}
                    className={`cyber-card p-3 flex items-center justify-between ${
                      isCurrent ? 'border-[#00f0ff] bg-[#00f0ff]/10' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-[#00f0ff]" />
                        <h5 className="text-xs font-bold text-gray-100">{model.name}</h5>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] text-gray-500 mt-1">
                        <span>Size: {formatSize(model.size)}</span>
                        <span>Family: {model.details?.family || 'llama'}</span>
                        <span>Params: {model.details?.parameter_size || 'N/A'}</span>
                        <span>Quant: {model.details?.quantization_level || 'Q4'}</span>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <div className="flex items-center space-x-1 text-[#00ff88] text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectModel(model.name)}
                          className="px-3 py-1 bg-[#141e2e] hover:bg-[#00f0ff]/20 text-[#00f0ff] text-xs border border-[#1e2a3c] hover:border-[#00f0ff]"
                        >
                          Select Model
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#1a2332] mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#141b26] hover:bg-[#1a2434] text-gray-200 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
