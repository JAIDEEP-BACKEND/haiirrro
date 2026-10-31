import fs from 'fs-extra';
import path from 'path';

export const FORMAT_CATEGORIES = {
  pdf: {
    label: 'PDF Documents',
    icon: 'FileText',
    color: '#ff3366',
    extensions: ['.pdf', '.epub', '.mobi'],
    targetFolder: 'PDFs'
  },
  presentation: {
    label: 'Presentations & Slides',
    icon: 'Presentation',
    color: '#ff8800',
    extensions: ['.pptx', '.ppt', '.odp', '.key', '.pps', '.ppsx'],
    targetFolder: 'Presentations'
  },
  document: {
    label: 'Text & Documents',
    icon: 'FileCode',
    color: '#00e5ff',
    extensions: ['.docx', '.doc', '.txt', '.rtf', '.odt', '.md', '.log', '.tex', '.nfo'],
    targetFolder: 'Documents'
  },
  spreadsheet: {
    label: 'Spreadsheets & Data',
    icon: 'Table',
    color: '#00ff88',
    extensions: ['.xlsx', '.xls', '.csv', '.tsv', '.ods', '.parquet'],
    targetFolder: 'Spreadsheets'
  },
  code: {
    label: 'Code & Repositories',
    icon: 'Terminal',
    color: '#7000ff',
    extensions: [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.rs', '.go', '.html', '.css', '.json', '.sql', '.sh', '.ps1',
      '.yml', '.yaml', '.vue', '.svelte', '.rb', '.php', '.xml', '.env'
    ],
    targetFolder: 'Code'
  },
  image: {
    label: 'Images & Graphics',
    icon: 'Image',
    color: '#ff00aa',
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff', '.avif'],
    targetFolder: 'Images'
  },
  video: {
    label: 'Video Recordings',
    icon: 'Video',
    color: '#0099ff',
    extensions: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.wmv', '.flv'],
    targetFolder: 'Videos'
  },
  audio: {
    label: 'Audio & Music',
    icon: 'Music',
    color: '#e6fb04',
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'],
    targetFolder: 'Audio'
  },
  archive: {
    label: 'Archives & Packages',
    icon: 'Archive',
    color: '#a3a3a3',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.exe', '.msi'],
    targetFolder: 'Archives'
  }
};

class FormatManager {
  classifyFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    for (const [key, category] of Object.entries(FORMAT_CATEGORIES)) {
      if (category.extensions.includes(ext)) {
        return { category: key, ...category, ext };
      }
    }
    return {
      category: 'other',
      label: 'Other Files',
      icon: 'File',
      color: '#6b7280',
      extensions: [ext],
      targetFolder: 'Other',
      ext
    };
  }

  async scanByFormat(dirPath, categoryFilter = null, maxDepth = 6) {
    if (!await fs.pathExists(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const results = [];
    const skipFolders = new Set(['node_modules', '.git', '$recycle.bin', 'system volume information', 'appdata', '.cache']);

    const traverse = async (currentDir, depth) => {
      if (depth > maxDepth) return;
      let items;
      try {
        items = await fs.readdir(currentDir);
      } catch (e) {
        return;
      }

      for (const item of items) {
        if (skipFolders.has(item.toLowerCase())) continue;
        const fullPath = path.join(currentDir, item);
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            await traverse(fullPath, depth + 1);
          } else if (stat.isFile()) {
            const classification = this.classifyFile(item);
            if (!categoryFilter || categoryFilter === 'all' || classification.category === categoryFilter) {
              results.push({
                name: item,
                path: fullPath,
                directory: currentDir,
                size: stat.size,
                modifiedAt: stat.mtime,
                createdAt: stat.birthtime,
                classification,
                category: classification.category
              });
            }
          }
        } catch (e) {}
      }
    };

    await traverse(dirPath, 0);
    return results;
  }

  async autoOrganize(dirPath) {
    if (!await fs.pathExists(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const items = await fs.readdir(dirPath);
    const moved = [];
    const skipped = [];

    // Protected category folder names so we don't move created folders
    const protectedFolders = Object.values(FORMAT_CATEGORIES).map(c => c.targetFolder.toLowerCase());

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          // Check if it's already a category folder
          if (protectedFolders.includes(item.toLowerCase())) {
            continue;
          }
        }

        if (stat.isFile()) {
          const classification = this.classifyFile(item);
          if (classification.category === 'other') {
            skipped.push({ file: item, reason: 'Uncategorized format' });
            continue;
          }

          const targetSubdir = path.join(dirPath, classification.targetFolder);
          await fs.ensureDir(targetSubdir);

          const destination = path.join(targetSubdir, item);
          if (destination !== fullPath) {
            await fs.move(fullPath, destination, { overwrite: false });
            moved.push({
              fileName: item,
              from: fullPath,
              to: destination,
              category: classification.category,
              targetFolder: classification.targetFolder
            });
          }
        }
      } catch (err) {
        skipped.push({ file: item, error: err.message });
      }
    }

    return {
      success: true,
      directory: dirPath,
      totalMoved: moved.length,
      moved,
      skipped
    };
  }

  async batchMoveCategory(sourceDir, targetCategory, targetDir) {
    const files = await this.scanByFormat(sourceDir, targetCategory);
    await fs.ensureDir(targetDir);

    const moved = [];
    for (const file of files) {
      try {
        const dest = path.join(targetDir, file.name);
        await fs.move(file.path, dest, { overwrite: false });
        moved.push({ name: file.name, from: file.path, to: dest });
      } catch (e) {}
    }

    return { totalMoved: moved.length, moved };
  }
}

export const formatManager = new FormatManager();
