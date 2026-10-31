import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { formatManager } from './FormatManager.js';
import { ollamaService } from './OllamaService.js';

class AiFileFinder {
  constructor() {
    this.commonLocations = this.getCommonLocations();
  }

  getCommonLocations() {
    const home = os.homedir();
    const locs = [
      { name: 'Desktop', path: path.join(home, 'Desktop') },
      { name: 'Downloads', path: path.join(home, 'Downloads') },
      { name: 'Documents', path: path.join(home, 'Documents') },
      { name: 'Projects', path: path.join(home, 'nehairo-projects') },
      { name: 'OneDrive Desktop', path: path.join(home, 'OneDrive', 'desktop') },
      { name: 'OneDrive Documents', path: path.join(home, 'OneDrive', 'Documents') },
      { name: 'Temp', path: os.tmpdir() }
    ];

    // Filter to existing directories
    return locs.filter(l => fs.existsSync(l.path));
  }

  async findFiles(searchParams = {}) {
    const {
      query = '',
      targetDir = null,
      category = null,
      extension = null,
      contentSearch = false,
      maxResults = 100,
      deepScan = false,
      dateRange = null, // 'today', 'week', 'month', 'year'
      minSize = null,
      maxSize = null,
    } = searchParams;

    const searchRoots = targetDir 
      ? [targetDir] 
      : this.commonLocations.map(l => l.path);

    const results = [];
    const lowerQuery = query.toLowerCase().trim();
    const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

    const now = Date.now();
    let minDate = 0;
    if (dateRange === 'today') minDate = now - (24 * 60 * 60 * 1000);
    else if (dateRange === 'week') minDate = now - (7 * 24 * 60 * 60 * 1000);
    else if (dateRange === 'month') minDate = now - (30 * 24 * 60 * 60 * 1000);
    else if (dateRange === 'year') minDate = now - (365 * 24 * 60 * 60 * 1000);

    const maxDepth = deepScan ? 7 : 4;

    for (const root of searchRoots) {
      if (!fs.existsSync(root)) continue;
      await this._traverse(root, 0, maxDepth, async (filePath, stat) => {
        if (results.length >= maxResults) return false; // Stop traversal

        const fileName = path.basename(filePath);
        const lowerName = fileName.toLowerCase();
        const ext = path.extname(fileName).toLowerCase();

        // 1. Extension / Category Filter
        const classification = formatManager.classifyFile(fileName);
        if (category && category !== 'all' && classification.category !== category) {
          return true;
        }
        if (extension && ext !== extension.toLowerCase()) {
          return true;
        }

        // 2. Date Filter
        if (minDate > 0 && stat.mtimeMs < minDate) {
          return true;
        }

        // 3. Size Filter
        if (minSize && stat.size < minSize) return true;
        if (maxSize && stat.size > maxSize) return true;

        // 4. Query Matching Score
        let matchScore = 0;
        let matchedSnippet = null;

        if (queryTokens.length === 0) {
          // If no query, every file passing filters is a match
          matchScore = 1;
        } else {
          // Exact name match
          if (lowerName === lowerQuery) {
            matchScore += 100;
          } else if (lowerName.includes(lowerQuery)) {
            matchScore += 50;
          } else {
            // Token match
            let matchedTokens = 0;
            for (const token of queryTokens) {
              if (lowerName.includes(token)) {
                matchedTokens++;
                matchScore += 15;
              }
            }
            if (matchedTokens === 0 && !contentSearch) {
              return true; // No filename match
            }
          }

          // Content Search if enabled for readable files
          if (contentSearch && stat.size < 2 * 1024 * 1024) { // Max 2MB for content inspection
            const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.csv', '.yml', '.yaml', '.xml', '.env', '.log', '.sql'];
            if (textExtensions.includes(ext)) {
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                const lowerContent = content.toLowerCase();
                const idx = lowerContent.indexOf(lowerQuery);
                if (idx !== -1) {
                  matchScore += 30;
                  const start = Math.max(0, idx - 40);
                  const end = Math.min(content.length, idx + 60);
                  matchedSnippet = '...' + content.substring(start, end).replace(/\r?\n/g, ' ') + '...';
                } else {
                  for (const token of queryTokens) {
                    if (lowerContent.includes(token)) {
                      matchScore += 5;
                    }
                  }
                }
              } catch (e) {}
            }
          }
        }

        if (matchScore > 0 || queryTokens.length === 0) {
          results.push({
            name: fileName,
            path: filePath,
            directory: path.dirname(filePath),
            size: stat.size,
            modifiedAt: stat.mtime,
            createdAt: stat.birthtime,
            classification,
            category: classification.category,
            matchScore,
            matchedSnippet
          });
        }

        return true;
      });
    }

    // Sort by match score descending, then by modified time
    results.sort((a, b) => b.matchScore - a.matchScore || b.modifiedAt - a.modifiedAt);

    return {
      query,
      totalFound: results.length,
      searchRoots,
      results
    };
  }

  async _traverse(dir, currentDepth, maxDepth, callback) {
    if (currentDepth > maxDepth) return;

    let items;
    try {
      items = await fs.readdir(dir);
    } catch (err) {
      return; // Skip folders without permissions
    }

    // Exclude noisy/huge folders
    const skipFolders = new Set(['node_modules', '.git', '$recycle.bin', 'system volume information', 'appdata', '.cache']);

    for (const item of items) {
      if (skipFolders.has(item.toLowerCase())) continue;

      const fullPath = path.join(dir, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await this._traverse(fullPath, currentDepth + 1, maxDepth, callback);
        } else if (stat.isFile()) {
          const keepGoing = await callback(fullPath, stat);
          if (keepGoing === false) return;
        }
      } catch (e) {}
    }
  }

  async naturalLanguageHunt(prompt) {
    // Uses Ollama if available to parse operator intent into structured search parameters
    let searchParams = { query: prompt };
    
    try {
      if (ollamaService.isOnline) {
        const system = `Extract structured search parameters from the user's natural language file hunt request.
Respond ONLY with a valid JSON object with these optional keys:
- query: string (cleaned search keywords)
- category: string ("pdf" | "presentation" | "document" | "spreadsheet" | "code" | "image" | "video" | "audio" | "archive")
- extension: string (e.g. ".pdf", ".pptx", ".py")
- contentSearch: boolean (true if looking for content/code inside files)
- dateRange: string ("today" | "week" | "month" | "year")
Example output: {"query": "sales Q3", "category": "presentation", "extension": ".pptx"}`;

        const aiRes = await ollamaService.generateChat([
          { role: 'user', content: prompt }
        ], { system });

        const cleaned = aiRes.content.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        searchParams = { ...searchParams, ...parsed };
      }
    } catch (e) {
      // Fallback to raw prompt query
    }

    const searchResults = await this.findFiles(searchParams);
    return {
      interpretedParams: searchParams,
      ...searchResults
    };
  }
}

export const aiFileFinder = new AiFileFinder();
