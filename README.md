# 🚀 Haiirrro &mdash; Developer Portfolio & Systems Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Web)-cyan.svg)](#)

A modern, high-performance, and cyberpunk-inspired personal portfolio website built for **Full-Stack Engineers**, **AI Systems Architects**, and **Creative Technologists**.

---

## ✨ Features

- 🌌 **Interactive Constellation Canvas**: High-performance canvas particle constellation background that reacts dynamically to cursor movements.
- 💻 **Built-in CLI Terminal**: Fully functional in-browser terminal widget supporting commands such as `help`, `about`, `skills`, `projects`, `contact`, `theme`, and interactive easter eggs (`sudo hire-me` with celebratory confetti!).
- 🌓 **Dynamic Theme Engine**: Seamless Dark and Light theme switcher with local storage persistence and custom color palettes.
- ⚡ **Zero-Dependency Architecture**: Built using pure modern HTML5, CSS3, and Vanilla JavaScript. Runs directly in any browser with **zero build steps** needed.
- 📱 **100% Fully Responsive**: Pixel-perfect layout tailored for mobile devices, tablets, laptops, and ultra-wide screens.
- 🎯 **Interactive Project Modals**: Dynamic deep-dive technical modals showcasing architecture highlights, tech stacks, and live demo links.
- 🎛️ **Category-Based Filtering**: Interactive filter tabs for both Technical Skills and Featured Projects.
- ✉️ **Functional Contact Form & Quick Copy**: Interactive contact form with status feedback, toast notifications, and one-click email copying.
- 🎞️ **Infinite Tech Ticker**: Sleek hardware-accelerated marquee ribbon highlighting key frameworks and tools.

---

## 📂 Project Structure

```
haiirrro/
├── index.html           # Main markup with semantic sections & SEO metadata
├── css/
│   └── style.css        # Clean custom styles, variables, animations & responsive media queries
├── js/
│   ├── main.js          # Main app logic (theme toggle, scrollspy, project modals, form handling)
│   ├── particles.js     # Responsive interactive canvas particle constellation
│   └── terminal.js      # Interactive in-browser developer CLI widget
├── assets/
│   ├── favicon.svg      # Geometric glowing monogram brand icon
│   └── avatar.svg       # Cyberpunk developer avatar graphic
├── package.json         # Optional npm dev server helper scripts
├── .gitignore           # Standard git exclusions
├── LICENSE              # MIT License
└── README.md            # Documentation & setup guide
```

---

## ⚡ Quick Start

### Option 1: Direct File Open (Zero Install)
Simply double-click [`index.html`](file:///C:/Users/jaide/hairo-projects/haiirrro/index.html) or open it directly in your favorite web browser (Chrome, Firefox, Safari, Edge, Brave).

### Option 2: Local HTTP Server (Node.js)
```bash
# Using npx (no install needed)
npx serve .

# Or using package.json script
npm start
```
Then visit `http://localhost:3000` in your browser.

### Option 3: Python Built-in Server
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## ⌨️ CLI Terminal Commands

Visitors can interact with your portfolio using the built-in terminal:

| Command | Description |
| :--- | :--- |
| `help` | Lists all available terminal commands |
| `about` | Prints developer bio and engineering philosophy |
| `skills` | Displays breakdown of tech competencies |
| `projects` | Lists featured production projects |
| `experience` | Displays career timeline snapshot |
| `contact` | Prints direct contact channels & email |
| `theme <light\|dark>` | Toggles between dark and light modes |
| `hire` / `sudo hire-me` | Triggers a fun interactive confetti celebration |
| `clear` | Clears the terminal screen |

---

## 🛠️ Customization Guide

1. **Personal Information**:
   - Update your name, titles, and bio in `index.html` (under `#hero` and `#about`).
   - Adjust typing phrases in [`js/main.js`](file:///C:/Users/jaide/hairo-projects/haiirrro/js/main.js#L75-L84).
2. **Projects & Case Studies**:
   - Add or edit project cards in `index.html` under `#projects`.
   - Update modal data in `projectDetails` object in [`js/main.js`](file:///C:/Users/jaide/hairo-projects/haiirrro/js/main.js#L145-L210).
3. **Contact & Social Links**:
   - Update your social handles (GitHub, LinkedIn, Twitter/X, Discord) and email in `index.html`.
4. **Color Themes & Accents**:
   - Custom palette variables can be tuned in [`css/style.css`](file:///C:/Users/jaide/hairo-projects/haiirrro/css/style.css#L7-L50).

---

## 🌐 Free 1-Click Deployment

### GitHub Pages
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/haiirrro.git
   git push -u origin main
   ```
2. In your GitHub repository, navigate to **Settings > Pages**.
3. Under **Branch**, select `main` and root `/`, then click **Save**.
4. Your site will be live at `https://<your-username>.github.io/haiirrro/`!

### Vercel / Netlify
- Drag and drop this folder directly into [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com) for instant global edge deployment.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
