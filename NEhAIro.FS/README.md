# ⚡ NEhAIro.FS // CYBER AUTONOMOUS FILESYSTEM & REPO OPERATING CONSOLE

[![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-00f0ff?style=for-the-badge&logo=statuspage&logoColor=black)]()
[![Version](https://img.shields.io/badge/VERSION-2.0.0-00ff88?style=for-the-badge)]()
[![AI Engine](https://img.shields.io/badge/OLLAMA-INTEGRATED-7000ff?style=for-the-badge)]()
[![Aesthetics](https://img.shields.io/badge/AESTHETICS-CYBER_DARK-ff0055?style=for-the-badge)]()

> **NEhAIro.FS** unifies high-performance host filesystem management with autonomous developer workspace orchestration and local Ollama artificial intelligence. It combines the deep system control of NEXUS.FS and the autonomous coding pipeline of hAIro into a singular, cohesive Cyber OS.

---

## 🌟 CORE ARCHITECTURE & SUBSYSTEMS

```
                                      +------------------------------------+
                                      |          NEhAIro.FS UI             |
                                      |  (React 19 + Cyber Dark Glass HUD) |
                                      +-----------------+------------------+
                                                        |
                                              WebSocket / REST API
                                                        |
                                      +-----------------v------------------+
                                      |         NEhAIro Master Core        |
                                      |         (Node.js + Express 5)      |
                                      +---+-----------+----------+-----+---+
                                          |           |          |     |
            +-----------------------------+     +-----+----+     |     +-----------------------------+
            |                                   |          |                                   |
   +--------v--------+                 +--------v---+  +---v--------+                 +--------v--------+
   |   OLLAMA AI     |                 |  FILESYSTEM|  | FORMAT HUB |                 |   ANTIGRAVITY   |
   |  INTELLIGENCE   |                 |  C:\ & DRIVES | (PDF/PPTX) |                 |  CLI & GIT C2   |
   +-----------------+                 +------------+  +------------+                 +-----------------+
   * qwen2.5-coder:7b                  * Full Browse   * Segregator                   * Autonomous Dev
   * gemma3:4b / 12b                   * File Editor   * Auto-Organize                * Dual Terminals
   * AI File Finder                    * Move/Rename   * PDF/Media Hub                * GitHub & Vercel
```

---

## 🛡️ KEY CAPABILITIES

### 1. 📂 Drive & Host Filesystem Explorer
* **Full Root & Multi-Drive Access:** Seamlessly browse `C:\`, `D:\`, or any mounted drive.
* **Rich Inline Previewers & Editors:**
  * **Code Editor:** Edit JS, TS, Python, HTML, CSS, JSON with instant save.
  * **PDF & Documents Viewer:** Embedded document inspection.
  * **Media Center:** Image viewer with zoom, HTML5 video and audio players.
* **Atomic File Operations:** Upload, multi-file download, folder/file creation, atomic move, rename, and deletion.

### 2. 🗂️ Format-Specific Management Hub (PDF, PPTX, Data, Code, Media)
* **Dedicated Format Classifications:**
  * 📑 **PDF Documents** (`.pdf`, `.epub`)
  * 📊 **Presentations & Slides** (`.pptx`, `.ppt`, `.odp`, `.key`)
  * 📈 **Spreadsheets & Data** (`.xlsx`, `.xls`, `.csv`, `.tsv`, `.parquet`)
  * 💻 **Code & Repositories** (`.js`, `.ts`, `.py`, `.rs`, `.go`, `.html`, `.css`, etc.)
  * 📝 **Text & Markdown** (`.docx`, `.doc`, `.txt`, `.md`, `.log`)
  * 🖼️ **Images** (`.png`, `.jpg`, `.svg`, `.webp`, `.gif`)
  * 🎬 **Video & Audio** (`.mp4`, `.mp3`, `.wav`, `.mov`)
  * 📦 **Archives** (`.zip`, `.rar`, `.7z`, `.tar`, `.gz`)
* **⚡ 1-Click Auto-Organize:** Automatically analyzes any folder and sorts files into clean format subdirectories (`PDFs/`, `Presentations/`, `Documents/`, `Spreadsheets/`, `Code/`, `Images/`, etc.).
* **Format Segregator:** Batch move all files matching a specific format to a designated destination.

### 3. 🧠 Ollama Artificial Intelligence & AI File Finder
* **Local Ollama Integration:** Connected to `http://127.0.0.1:11434` with GPU acceleration.
* **Available Installed Models:**
  * `qwen2.5-coder:7b` (Code synthesis, tool orchestration, shell scripts)
  * `gemma3:4b` (Lightweight instant reasoning)
  * `llama3:latest` (8B general intelligence)
  * `gemma3:12b` (Deep instruction following)
  * `nomic-embed-text:latest` (Semantic vector embeddings)
* **🎯 AI File Finder (Lost File Hunter):**
  * Natural language search: e.g., *"Find the presentation about AI architecture"* or *"Where is the database script?"*
  * Deep content search: scans inside files and code for matched snippets with line numbers.
  * Searches user profile hotspots (Desktop, Downloads, Documents, Projects, OneDrive, Temp).
* **Model Manager Modal:** Live model switcher and 1-click model puller with progress streaming.

### 4. ⚡ Developer Workspaces & Antigravity Console (hAIro)
* **Multi-Workspace Hub:** Create or import local coding workspaces.
* **Autonomous Task Orchestrator:** Translates natural language prompts into multi-stage pipelines:
  1. Workspace & Git Preparation
  2. Autonomous Antigravity CLI Execution
  3. Live Code Diff Inspection
  4. Git Staging (`git add .`) and Semantic Commits
  5. GitHub Remote Creation & Automatic Push
  6. Vercel Live Deployment
* **Dual Execution Terminals:**
  * **Terminal 1:** Antigravity AI live task output stream.
  * **Terminal 2:** Interactive PowerShell / CMD live shell with command history.

### 5. 🛰️ Node Telemetry & Remote C2
* **Real-time Vitals:** Multi-core CPU load, active/free RAM gauge, disk utilization.
* **Process Manager:** Real-time process listing with CPU/RAM metrics and instant **TaskKill**.
* **Remote Desktop Stream:** Host screen capture feed with auto-refresh.
* **System Power Controls:** Remote Lock, Sleep, Restart, and Shutdown protocols.

---

## 🚀 QUICK START GUIDE

### 1️⃣ Start the Unified Workstation
```powershell
# From the root NEhAIro.FS directory:
npm start
```
*Access the Cyber OS at:* **`http://localhost:3001`**

### 2️⃣ Development Mode (Hot Reload)
```powershell
# Terminal 1: Backend Server
npm run server

# Terminal 2: Vite Frontend Dev Server
npm run client
```

### 3️⃣ Default Operator Credentials
* **Username:** `admin`
* **Password:** `admin123`

---

## 🛠️ TECH STACK

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Lucide Icons, Framer Motion |
| **Backend Core** | Node.js, Express 5, WebSocket (`ws`), Multer, SQLite3, JWT, bcrypt |
| **AI Runtime** | Ollama Local Engine (`qwen2.5-coder:7b`, `gemma3`, `llama3`, `nomic-embed-text`) |
| **Autonomous Engine** | Antigravity CLI (`agy`) Stream Parser & Runner |
| **Node Telemetry** | `systeminformation`, `screenshot-desktop` |
| **Version Control** | Native Git CLI, GitHub REST API, Vercel REST API |

---

**Developed for the NEhAIro Cyber Unified Operations Ecosystem**
