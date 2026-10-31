import axios from 'axios';
import { config } from '../config.js';

class OllamaService {
  constructor() {
    this.host = config.ollama.host;
    this.activeModel = config.ollama.defaultModel;
    this.embedModel = config.ollama.embedModel;
    this.isOnline = false;
    this.cachedModels = [];
  }

  async checkStatus() {
    try {
      const res = await axios.get(`${this.host}/api/tags`, { timeout: 3000 });
      this.isOnline = true;
      this.cachedModels = res.data.models || [];
      
      // Auto-set active model if current default isn't present
      if (this.cachedModels.length > 0) {
        const hasActive = this.cachedModels.some(m => m.name === this.activeModel || m.model === this.activeModel);
        if (!hasActive) {
          this.activeModel = this.cachedModels[0].name;
        }
      }
      return {
        online: true,
        host: this.host,
        activeModel: this.activeModel,
        models: this.cachedModels,
      };
    } catch (err) {
      this.isOnline = false;
      return {
        online: false,
        host: this.host,
        error: err.message,
        models: [],
      };
    }
  }

  async getModels() {
    try {
      const res = await axios.get(`${this.host}/api/tags`, { timeout: 4000 });
      this.cachedModels = res.data.models || [];
      return this.cachedModels;
    } catch (err) {
      return this.cachedModels;
    }
  }

  setModel(modelName) {
    this.activeModel = modelName;
    return this.activeModel;
  }

  async pullModel(modelName, onProgress) {
    try {
      const response = await axios.post(
        `${this.host}/api/pull`,
        { name: modelName, stream: true },
        { responseType: 'stream' }
      );

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (onProgress) onProgress(data);
            } catch (e) {}
          }
        });

        response.data.on('end', () => {
          resolve({ success: true, model: modelName });
        });

        response.data.on('error', (err) => {
          reject(err);
        });
      });
    } catch (err) {
      throw new Error(`Failed to pull model ${modelName}: ${err.message}`);
    }
  }

  async generateChat(messages, options = {}) {
    const model = options.model || this.activeModel;
    const systemPrompt = options.system || `You are NEhAIro Core Intelligence, an ultra-capable AI operating console engine. 
You assist the operator with file system operations, code analysis, shell commands, project architecture, format organization, and system telemetry.
Provide precise, actionable responses. When suggesting commands, use Markdown codeblocks with the target shell specified (e.g. powershell or bash).`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const res = await axios.post(`${this.host}/api/chat`, {
        model,
        messages: fullMessages,
        stream: false,
        options: {
          temperature: options.temperature || 0.2,
          num_predict: options.num_predict || 256,
          top_k: 20,
          top_p: 0.8
        }
      }, { timeout: 60000 });

      return {
        content: res.data.message?.content || '',
        model: res.data.model,
        totalDuration: res.data.total_duration,
        evalCount: res.data.eval_count
      };
    } catch (err) {
      throw new Error(`Ollama Generation Error (${model}): ${err.message}`);
    }
  }

  async generateEmbeddings(prompt) {
    try {
      const res = await axios.post(`${this.host}/api/embeddings`, {
        model: this.embedModel,
        prompt: prompt
      }, { timeout: 10000 });
      return res.data.embedding;
    } catch (err) {
      return null;
    }
  }
}

export const ollamaService = new OllamaService();
