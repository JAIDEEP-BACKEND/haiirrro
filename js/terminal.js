/**
 * Haiirrro Portfolio - Interactive CLI Terminal Widget
 */
(function() {
  const terminalBody = document.getElementById('terminal-body');
  const terminalInput = document.getElementById('terminal-input');
  if (!terminalBody || !terminalInput) return;

  const commandHistory = [];
  let historyIndex = -1;

  const commands = {
    help: () => `
<span class="term-bold">Available Commands:</span>
  <span class="term-cyan">about</span>      - Who is Haiirrro?
  <span class="term-cyan">skills</span>     - Core technologies & strengths
  <span class="term-cyan">projects</span>   - Top featured developments
  <span class="term-cyan">experience</span> - Career journey snapshot
  <span class="term-cyan">contact</span>    - Ways to connect
  <span class="term-cyan">theme</span>      - Switch theme (e.g. <span class="term-yellow">theme light</span> or <span class="term-yellow">theme dark</span>)
  <span class="term-cyan">hire</span>       - Want to collaborate? (or try <span class="term-yellow">sudo hire-me</span>)
  <span class="term-cyan">clear</span>      - Clear terminal screen
  <span class="term-cyan">date</span>       - Print system time
`,
    about: () => `
<span class="term-green">🚀 Haiirrro (Jaideep)</span>
Full-Stack Engineer & AI Systems Architect.
Passionate about crafting ultra-responsive web applications, generative AI workflows,
and resilient cloud systems with a focus on craftsmanship, design, and performance.
`,
    skills: () => `
<span class="term-bold">Tech Stack:</span>
  <span class="term-purple">[Languages]</span>   TypeScript, JavaScript, Python, Go, SQL, HTML5/CSS3
  <span class="term-cyan">[Frontend]</span>    React, Next.js, Vue, Tailwind CSS, WebGL, Vite
  <span class="term-green">[Backend]</span>     Node.js, Express, Fastify, FastAPI, GraphQL, REST
  <span class="term-yellow">[AI / ML]</span>     LLMs, PyTorch, LangChain, RAG Pipelines, Vector DBs
  <span class="term-pink">[DevOps]</span>      Docker, Kubernetes, AWS, Cloudflare, CI/CD, Git
`,
    projects: () => `
<span class="term-bold">Featured Projects:</span>
  1. <span class="term-cyan">CognitiveFlow</span> - Multi-agent autonomous task orchestration engine
  2. <span class="term-cyan">AuraCloud</span>     - Serverless edge compute & analytics dashboard
  3. <span class="term-cyan">PulseMetrics</span>  - High-throughput real-time telemetry pipeline
  4. <span class="term-cyan">OmniSynth</span>     - AI-assisted generative canvas & studio
  <span class="term-dim">Tip: Scroll down to the Projects section to explore interactive previews!</span>
`,
    experience: () => `
<span class="term-bold">Experience Overview:</span>
  • <span class="term-cyan">Lead Systems Engineer</span> (2023 - Present) - Distributed microservices & AI automation
  • <span class="term-cyan">Senior Full-Stack Developer</span> (2021 - 2023) - High-traffic web platforms & React apps
  • <span class="term-cyan">Software Engineer</span> (2019 - 2021) - API architecture, UI/UX optimization
`,
    contact: () => `
<span class="term-bold">Let's Connect:</span>
  • Email:    <a href="mailto:jaideep@hairo.dev" class="term-link">jaideep@hairo.dev</a>
  • GitHub:   <a href="https://github.com" target="_blank" rel="noreferrer" class="term-link">github.com/haiirrro</a>
  • LinkedIn: <a href="https://linkedin.com" target="_blank" rel="noreferrer" class="term-link">linkedin.com/in/hairo</a>
  • Twitter:  <a href="https://x.com" target="_blank" rel="noreferrer" class="term-link">@haiirrro_dev</a>
`,
    date: () => new Date().toLocaleString(),
    hire: () => `
<span class="term-green">🎉 Access Granted!</span>
Status: Available for high-impact roles, engineering contracts, and pioneering projects.
Let's build something extraordinary together! Drop a message in the contact form below.
`,
    'sudo hire-me': () => `
<span class="term-green">👑 Root Privilege Confirmed!</span>
Starting celebration protocols... 🚀✨
Contract initialized: 100% innovation guaranteed!
`
  };

  function executeCommand(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Record history
    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Display user command in output
    const cmdLine = document.createElement('div');
    cmdLine.className = 'term-line';
    cmdLine.innerHTML = `<span class="term-prompt">guest@haiirrro:~$</span> <span class="term-user-input">${escapeHTML(trimmed)}</span>`;
    terminalBody.appendChild(cmdLine);

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim().toLowerCase();

    const outputLine = document.createElement('div');
    outputLine.className = 'term-output';

    if (trimmed.toLowerCase() === 'sudo hire-me') {
      outputLine.innerHTML = commands['sudo hire-me']();
      triggerConfetti();
    } else if (mainCmd === 'clear') {
      terminalBody.innerHTML = '';
      return;
    } else if (mainCmd === 'theme') {
      if (arg === 'light' || arg === 'dark') {
        if (window.setTheme) {
          window.setTheme(arg);
          outputLine.innerHTML = `<span class="term-green">Theme switched to ${arg} mode.</span>`;
        } else {
          outputLine.textContent = `Theme switched to ${arg}.`;
        }
      } else {
        outputLine.innerHTML = `<span class="term-yellow">Usage: theme [dark|light]</span>`;
      }
    } else if (mainCmd === 'echo') {
      outputLine.textContent = parts.slice(1).join(' ');
    } else if (commands[mainCmd]) {
      outputLine.innerHTML = commands[mainCmd]();
      if (mainCmd === 'hire') triggerConfetti();
    } else {
      outputLine.innerHTML = `<span class="term-red">Command not recognized: "${escapeHTML(trimmed)}".</span> Type <span class="term-cyan">help</span> to view all commands.`;
    }

    terminalBody.appendChild(outputLine);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function triggerConfetti() {
    if (window.confettiEffect) {
      window.confettiEffect();
    }
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      executeCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = terminalInput.value.toLowerCase().trim();
      const available = Object.keys(commands).concat(['clear', 'theme', 'echo']);
      const match = available.find(c => c.startsWith(current));
      if (match) terminalInput.value = match;
    }
  });

  // Focus input when clicking anywhere inside terminal
  const terminalWrapper = document.getElementById('terminal-wrapper');
  if (terminalWrapper) {
    terminalWrapper.addEventListener('click', () => {
      terminalInput.focus();
    });
  }
})();
