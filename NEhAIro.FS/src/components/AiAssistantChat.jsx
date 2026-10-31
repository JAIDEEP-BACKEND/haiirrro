import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, User, Sparkles, Terminal, Play, 
  Trash2, Copy, Check, RefreshCw, Cpu, HardDrive, 
  Layers, Code, Shield
} from 'lucide-react';
import { api } from '../services/api';

export default function AiAssistantChat({ 
  ollamaStatus, 
  onRunTerminalCommand,
  onOpenModelManager 
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**NEhAIro Core Intelligence Online** (Active Model: \`${ollamaStatus?.activeModel || 'qwen2.5-coder:7b'}\`)\n\nI am fully integrated with your host filesystem and developer consoles. I can:\n* Generate and modify code routines\n* Troubleshoot system vitals, disk space, and memory\n* Formulate PowerShell / CMD system commands with 1-click execution\n* Guide file format segregation and project scaffolding\n\nHow can I assist your operations?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: input.trim()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.chatOllama(historyPayload, {
        model: ollamaStatus?.activeModel,
        temperature: 0.3
      });

      const assistantMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.data.content || 'No response received from local Ollama model.',
        model: res.data.model
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Ollama Inference Error:** ${err.message}\n\nPlease verify that Ollama is running and your model is loaded.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
  };

  const extractCodeBlocks = (content) => {
    const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = codeRegex.exec(content)) !== null) {
      blocks.push({
        lang: match[1] || 'bash',
        code: match[2].trim()
      });
    }
    return blocks;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#06080d] overflow-hidden font-mono">
      {/* Top Chat Bar */}
      <div className="bg-[#0b1018] border-b border-[#1a2332] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 flex items-center space-x-2">
              <span>NEhAIro INTELLIGENCE CONSOLE</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30">
                OLLAMA LOCAL
              </span>
            </h3>
            <span className="text-[10px] text-gray-500">
              Active Engine: {ollamaStatus?.activeModel || 'qwen2.5-coder:7b'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenModelManager}
            className="px-2.5 py-1 bg-[#0e1420] border border-[#1e2a3c] hover:border-[#00f0ff] text-xs text-gray-300 flex items-center space-x-1.5"
          >
            <Cpu className="w-3 h-3 text-[#00f0ff]" />
            <span>Switch / Pull Models</span>
          </button>

          <button
            onClick={() => setMessages([messages[0]])}
            title="Clear Chat History"
            className="p-1 text-gray-500 hover:text-gray-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const codeBlocks = !isUser ? extractCodeBlocks(msg.content) : [];

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 bg-[#0c1420] border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-gray-100'
                    : 'bg-[#0b1018] border border-[#1a2332] text-gray-300'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* 1-Click Code/Shell Execution Actions if AI generated code blocks */}
                {codeBlocks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#1a2332] space-y-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Detected Shell Commands / Snippets:
                    </span>
                    {codeBlocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="bg-[#05070a] border border-[#1e2a3c] p-2 flex items-center justify-between"
                      >
                        <code className="text-[#00ff88] text-[11px] truncate max-w-md font-mono">
                          {block.code}
                        </code>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyToClipboard(block.code, `${msg.id}_${bIdx}`)}
                            title="Copy code"
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            {copiedId === `${msg.id}_${bIdx}` ? (
                              <Check className="w-3 h-3 text-[#00ff88]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {onRunTerminalCommand && (
                            <button
                              onClick={() => onRunTerminalCommand(block.code)}
                              title="Run in Interactive Shell"
                              className="px-2 py-0.5 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] text-[10px] flex items-center space-x-1"
                            >
                              <Play className="w-2.5 h-2.5" />
                              <span>Execute</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 bg-[#141e2e] border border-[#1e2a3c] flex items-center justify-center text-gray-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 bg-[#0c1420] border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-[#0b1018] border border-[#1a2332] text-xs text-gray-400 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
              <span>Generating response via Ollama ({ollamaStatus?.activeModel || 'LLM'})...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="bg-[#090d14] border-t border-[#161e2a] px-4 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none text-[11px] text-gray-400">
        <span className="text-gray-600 shrink-0">PROMPTS:</span>
        <button
          onClick={() => handleQuickPrompt('Give me a PowerShell script to scan disk usage by folder.')}
          className="px-2 py-0.5 bg-[#0d121c] border border-[#1e2636] hover:border-[#00f0ff] shrink-0 text-gray-300"
        >
          🔍 Disk Usage Script
        </button>
        <button
          onClick={() => handleQuickPrompt('How do I auto-commit and push changes to GitHub?')}
          className="px-2 py-0.5 bg-[#0d121c] border border-[#1e2636] hover:border-[#00f0ff] shrink-0 text-gray-300"
        >
          ⚡ Git Push Guide
        </button>
        <button
          onClick={() => handleQuickPrompt('Explain how the NEhAIro format segregation works.')}
          className="px-2 py-0.5 bg-[#0d121c] border border-[#1e2636] hover:border-[#00f0ff] shrink-0 text-gray-300"
        >
          📂 Format Hub Explanation
        </button>
        <button
          onClick={() => handleQuickPrompt('Generate a clean Express REST API structure with SQLite.')}
          className="px-2 py-0.5 bg-[#0d121c] border border-[#1e2636] hover:border-[#00f0ff] shrink-0 text-gray-300"
        >
          💻 Scaffold API
        </button>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-[#0b1018] border-t border-[#1a2332]">
        <div className="flex items-center bg-[#070b10] border border-[#1e2a3c] focus-within:border-[#00f0ff] p-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your instruction, question, or system query..."
            className="w-full bg-transparent px-3 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-1.5 bg-[#00f0ff] text-black font-bold text-xs flex items-center space-x-1 hover:bg-[#00d0df] disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            <span>SEND</span>
          </button>
        </div>
      </form>
    </div>
  );
}
