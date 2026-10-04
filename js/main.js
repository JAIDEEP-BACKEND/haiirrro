/**
 * Haiirrro Portfolio - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Theme Management (Dark / Light)
  // ==========================================
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('haiirrro-theme', theme);
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  window.setTheme = applyTheme;

  const savedTheme = localStorage.getItem('haiirrro-theme') || 
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ==========================================
  // 2. Navigation & Mobile Menu
  // ==========================================
  const navHeader = document.querySelector('.navbar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinksList = document.getElementById('nav-links');
  const navLinks = document.querySelectorAll('.nav-link');

  // Navbar scroll blur effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navHeader.classList.add('scrolled');
    } else {
      navHeader.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinksList) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navLinksList.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navLinksList.classList.remove('open');
      });
    });
  }

  // ScrollSpy
  const sections = document.querySelectorAll('section[id]');
  function updateScrollSpy() {
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');
      const targetNavLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (targetNavLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          targetNavLink.classList.add('active');
        } else {
          targetNavLink.classList.remove('active');
        }
      }
    });
  }
  window.addEventListener('scroll', updateScrollSpy);

  // ==========================================
  // 3. Hero Typewriter Animation
  // ==========================================
  const typewriterElement = document.getElementById('typewriter');
  if (typewriterElement) {
    const phrases = [
      'Full-Stack Engineer',
      'AI Systems Architect',
      'Cloud & Distributed Builder',
      'Creative Technologist'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        typewriterElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 45;
      } else {
        typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 95;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 1800; // Pause at full word
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 400; // Pause before next word
      }

      setTimeout(type, typeSpeed);
    }
    type();
  }

  // ==========================================
  // 4. Skills Filtering & Animation
  // ==========================================
  const skillCategoryButtons = document.querySelectorAll('.skill-tab-btn');
  const skillCards = document.querySelectorAll('.skill-category-group');

  skillCategoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      skillCategoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-skill-category');

      skillCards.forEach(group => {
        if (category === 'all' || group.getAttribute('data-category') === category) {
          group.style.display = 'grid';
          setTimeout(() => {
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
          }, 10);
        } else {
          group.style.opacity = '0';
          group.style.transform = 'translateY(15px)';
          setTimeout(() => {
            group.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // ==========================================
  // 5. Projects Filtering & Modal
  // ==========================================
  const projectFilterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  projectFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      projectFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category.includes(filter)) {
          card.classList.remove('hidden');
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.classList.add('hidden');
          }, 200);
        }
      });
    });
  });

  // Project Modal Data
  const projectDetails = {
    'cognitiveflow': {
      title: 'CognitiveFlow - Multi-Agent AI Orchestration',
      badge: 'AI & Multi-Agent Swarm',
      description: 'An enterprise-grade autonomous agent framework enabling complex task decomposition, parallel execution, and self-correcting synthesis. Supports heterogeneous LLMs with native RAG vector memory integration.',
      highlights: [
        'Real-time streaming agent communication protocol using WebSockets',
        'Dynamic tool generation and sandboxed safe execution environment',
        'Sub-second semantic vector lookups with Qdrant and pgvector',
        'Interactive DAG visualization for task tree exploration'
      ],
      tech: ['TypeScript', 'Node.js', 'Python', 'FastAPI', 'Qdrant', 'React', 'Docker'],
      demoUrl: 'https://github.com',
      githubUrl: 'https://github.com'
    },
    'auracloud': {
      title: 'AuraCloud - Serverless Edge Compute Platform',
      badge: 'Distributed Cloud Architecture',
      description: 'A global edge computing control plane that deploys WASM micro-functions across 200+ edge nodes with sub-10ms cold start times and real-time observability.',
      highlights: [
        'Built with WebAssembly and distributed Raft consensus protocol',
        'Automatic routing and global latency-based traffic optimization',
        'Integrated zero-trust security and end-to-end telemetry pipeline',
        'Interactive web management console with live traffic maps'
      ],
      tech: ['Go', 'Rust', 'WebAssembly', 'Next.js', 'PostgreSQL', 'Grafana'],
      demoUrl: 'https://github.com',
      githubUrl: 'https://github.com'
    },
    'pulsemetrics': {
      title: 'PulseMetrics - Real-Time Telemetry Pipeline',
      badge: 'High-Throughput Analytics',
      description: 'An ultra-fast event streaming platform capable of ingesting and aggregating 100K+ ops/sec with sub-second dashboard rendering and automated anomaly alerting.',
      highlights: [
        'Apache Kafka event streaming with Apache Pinot query engine',
        'Dynamic percentile calculations and sliding-window aggregations',
        'Custom WebGL time-series chart rendering at 60 FPS',
        'Intelligent anomaly detection using statistical models'
      ],
      tech: ['Node.js', 'Kafka', 'ClickHouse', 'Tailwind CSS', 'Chart.js', 'Redis'],
      demoUrl: 'https://github.com',
      githubUrl: 'https://github.com'
    },
    'omnisynth': {
      title: 'OmniSynth - Generative Creative Canvas',
      badge: 'Creative Tech & Neural Graphics',
      description: 'A rich collaborative infinite-canvas tool integrating multimodal generative AI models, vector graphic manipulation, and audio-reactive spatial sound synthesis.',
      highlights: [
        'Infinite canvas powered by WebGL & Canvas API with smooth 120Hz pan/zoom',
        'Real-time multi-user collaboration via CRDTs (Conflict-free Replicated Data Types)',
        'Local and cloud AI synthesis pipelines with diffusion models',
        'Export to SVG, High-Res PNG, and WebM format'
      ],
      tech: ['React', 'WebGL', 'WebAudio API', 'FastAPI', 'WebSockets', 'Python'],
      demoUrl: 'https://github.com',
      githubUrl: 'https://github.com'
    }
  };

  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-details-content');

  document.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const projKey = btn.getAttribute('data-project');
      const data = projectDetails[projKey];
      if (!data || !modalBody) return;

      modalBody.innerHTML = `
        <div class="modal-header-meta">
          <span class="project-pill">${data.badge}</span>
          <h3 class="modal-title">${data.title}</h3>
        </div>
        <p class="modal-description">${data.description}</p>
        <div class="modal-section">
          <h4>Key Technical Highlights</h4>
          <ul class="modal-highlights">
            ${data.highlights.map(h => `<li><i class="fas fa-check-circle"></i> <span>${h}</span></li>`).join('')}
          </ul>
        </div>
        <div class="modal-section">
          <h4>Architecture & Tools</h4>
          <div class="project-tags">
            ${data.tech.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="modal-actions">
          <a href="${data.demoUrl}" target="_blank" rel="noreferrer" class="btn btn-primary">
            <i class="fas fa-external-link-alt"></i> Live Preview
          </a>
          <a href="${data.githubUrl}" target="_blank" rel="noreferrer" class="btn btn-secondary">
            <i class="fab fa-github"></i> Source Code
          </a>
        </div>
      `;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  if (modalClose && modal) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================
  // 6. Contact Form & Clipboard
  // ==========================================
  const contactForm = document.getElementById('contact-form');
  const toast = document.getElementById('toast');
  const copyEmailBtn = document.getElementById('copy-email-btn');

  function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.className = 'toast';
    }, 3800);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transmitting...';
      submitBtn.disabled = true;

      // Simulate transmission with smooth feedback
      setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Transmitted!';
        showToast('🚀 Transmission received! Thank you, I will respond promptly.');
        contactForm.reset();

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 2500);
      }, 1200);
    });
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = copyEmailBtn.getAttribute('data-email') || 'jaideep@hairo.dev';
      navigator.clipboard.writeText(email).then(() => {
        showToast('📋 Email copied to clipboard: ' + email);
      }).catch(() => {
        showToast('Direct email: ' + email);
      });
    });
  }

  // ==========================================
  // 7. Back-to-Top Button
  // ==========================================
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 450) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================
  // 8. 3D Card Hover Tilt Effect
  // ==========================================
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });

  // ==========================================
  // 9. Easter Egg Confetti Trigger
  // ==========================================
  window.confettiEffect = function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#00f2fe', '#4facfe', '#7928ca', '#ff0080', '#10b981', '#f59e0b'];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    let frame = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // air drag
        p.rotation += p.vRot;
        if (frame > 40) p.alpha -= 0.015;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      frame++;
      if (alive) {
        requestAnimationFrame(renderConfetti);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(renderConfetti);
  };
});
