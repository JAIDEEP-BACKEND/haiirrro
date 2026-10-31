import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { config } from '../config.js';
import { formatManager } from './FormatManager.js';

const execPromise = util.promisify(exec);

class FileSystemService {
  constructor() {
    this.rootDir = config.rootDir;
  }

  async getDrives() {
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execPromise('wmic logicaldisk get caption,volumename,freespace,size');
        const lines = stdout.trim().split('\r\n').filter(Boolean);
        const drives = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].trim().split(/\s+/);
          if (parts.length >= 1) {
            const driveLetter = parts[0];
            drives.push({
              path: driveLetter + '\\',
              name: driveLetter,
              size: parts.length > 2 ? parseInt(parts[parts.length - 1], 10) : null,
              free: parts.length > 2 ? parseInt(parts[parts.length - 2], 10) : null
            });
          }
        }
        if (drives.length > 0) return drives;
      } catch (e) {}
      return [{ path: 'C:\\', name: 'C:' }];
    }
    return [{ path: '/', name: 'Root' }];
  }

  resolveSafePath(userPath) {
    if (!userPath) return this.rootDir;
    
    // Support direct full Windows paths (e.g. C:\Users\... or D:\...)
    if (process.platform === 'win32' && /^[a-zA-Z]:\\/.test(userPath)) {
      return path.normalize(userPath);
    }
    
    // Normalize and prevent traversal escapes
    const safePath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.rootDir, safePath);
  }

  async listDirectory(dirPath = '') {
    const targetPath = this.resolveSafePath(dirPath);
    
    if (!await fs.pathExists(targetPath)) {
      throw new Error(`Directory not found: ${targetPath}`);
    }

    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${targetPath}`);
    }

    const items = await fs.readdir(targetPath);
    const statPromises = items.map(async (item) => {
      try {
        const itemPath = path.join(targetPath, item);
        const itemStat = await fs.stat(itemPath);
        const isDir = itemStat.isDirectory();
        const classification = isDir ? null : formatManager.classifyFile(item);

        return {
          name: item,
          path: itemPath,
          isDirectory: isDir,
          size: itemStat.size,
          modifiedAt: itemStat.mtime,
          createdAt: itemStat.birthtime,
          classification,
          category: classification ? classification.category : 'folder'
        };
      } catch (e) {
        return null; // Skip unreadable files / permission errors
      }
    });

    const settledEntries = await Promise.all(statPromises);
    const entries = settledEntries.filter(Boolean);

    // Sort: directories first, then alphabetical
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Generate breadcrumbs
    const parts = targetPath.split(path.sep).filter(Boolean);
    const breadcrumbs = [];
    let currentAcc = '';
    
    if (process.platform === 'win32' && parts.length > 0) {
      currentAcc = parts[0] + '\\';
      breadcrumbs.push({ name: parts[0], path: currentAcc });
      for (let i = 1; i < parts.length; i++) {
        currentAcc = path.join(currentAcc, parts[i]);
        breadcrumbs.push({ name: parts[i], path: currentAcc });
      }
    } else {
      currentAcc = '/';
      breadcrumbs.push({ name: 'Root', path: '/' });
      for (const part of parts) {
        currentAcc = path.join(currentAcc, part);
        breadcrumbs.push({ name: part, path: currentAcc });
      }
    }

    return {
      currentPath: targetPath,
      parentPath: path.dirname(targetPath) !== targetPath ? path.dirname(targetPath) : null,
      breadcrumbs,
      totalItems: entries.length,
      entries
    };
  }

  async readFileContent(filePath, maxBytes = 500000) {
    const targetPath = this.resolveSafePath(filePath);
    if (!await fs.pathExists(targetPath)) {
      throw new Error(`File not found: ${targetPath}`);
    }

    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      throw new Error(`Cannot read directory as text file`);
    }

    const isBinary = stat.size > maxBytes;
    const classification = formatManager.classifyFile(targetPath);

    if (isBinary) {
      return {
        path: targetPath,
        name: path.basename(targetPath),
        size: stat.size,
        isBinary: true,
        classification,
        content: `[Binary or Large File (${(stat.size / 1024 / 1024).toFixed(2)} MB) - Use Download or Previewer]`
      };
    }

    try {
      const content = await fs.readFile(targetPath, 'utf-8');
      return {
        path: targetPath,
        name: path.basename(targetPath),
        size: stat.size,
        isBinary: false,
        classification,
        content
      };
    } catch (e) {
      return {
        path: targetPath,
        name: path.basename(targetPath),
        size: stat.size,
        isBinary: true,
        classification,
        content: `[Unable to render as text: ${e.message}]`
      };
    }
  }

  async writeFileContent(filePath, content) {
    const targetPath = this.resolveSafePath(filePath);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, content, 'utf-8');
    return { success: true, path: targetPath };
  }

  async createFolder(dirPath, folderName) {
    const target = path.join(this.resolveSafePath(dirPath), folderName);
    await fs.ensureDir(target);
    return { success: true, path: target };
  }

  async createFile(dirPath, fileName, initialContent = '') {
    const target = path.join(this.resolveSafePath(dirPath), fileName);
    if (await fs.pathExists(target)) {
      throw new Error(`File already exists: ${fileName}`);
    }
    await fs.writeFile(target, initialContent, 'utf-8');
    return { success: true, path: target };
  }

  async moveOrRename(oldPath, newPath) {
    const source = this.resolveSafePath(oldPath);
    const dest = this.resolveSafePath(newPath);
    await fs.move(source, dest, { overwrite: true });
    return { success: true, from: source, to: dest };
  }

  async deleteItem(itemPath) {
    const target = this.resolveSafePath(itemPath);
    await fs.remove(target);
    return { success: true, path: target };
  }
}

export const fileSystemService = new FileSystemService();
