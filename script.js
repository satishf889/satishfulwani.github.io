document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Theme Toggle Logic (follows device setting until user picks light/dark)
  const themeToggleBtn = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;
  const themeStorageKey = 'theme';
  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');

  function getSystemTheme() {
    return systemThemeQuery.matches ? 'light' : 'dark';
  }

  function updateThemeToggleIcon(effectiveTheme) {
    if (!themeToggleBtn) {
      return;
    }
    const icon = themeToggleBtn.querySelector('i');
    if (!icon) {
      return;
    }
    icon.className = effectiveTheme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun';
  }

  function applyTheme(effectiveTheme) {
    htmlElement.setAttribute('data-theme', effectiveTheme);
    updateThemeToggleIcon(effectiveTheme);
  }

  function setStoredTheme(preference) {
    localStorage.setItem(themeStorageKey, preference);
    if (preference === 'system') {
      applyTheme(getSystemTheme());
      return;
    }
    applyTheme(preference);
  }

  function getStoredThemePreference() {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  }

  function resolveEffectiveTheme(preference) {
    if (preference === 'light' || preference === 'dark') {
      return preference;
    }
    return getSystemTheme();
  }

  const initialPreference = getStoredThemePreference();
  applyTheme(resolveEffectiveTheme(initialPreference));

  systemThemeQuery.addEventListener('change', (event) => {
    if (getStoredThemePreference() === 'system') {
      applyTheme(event.matches ? 'light' : 'dark');
    }
  });

  if (themeToggleBtn) {
    const themeToggleLabels = {
      system: 'Use device theme setting (click for light mode)',
      light: 'Light mode (click for dark mode)',
      dark: 'Dark mode (click to use device setting)',
    };

    const syncThemeToggleLabel = () => {
      const preference = getStoredThemePreference();
      themeToggleBtn.setAttribute('aria-label', themeToggleLabels[preference]);
    };

    syncThemeToggleLabel();

    themeToggleBtn.addEventListener('click', () => {
      const preference = getStoredThemePreference();
      const nextPreference = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
      setStoredTheme(nextPreference);
      syncThemeToggleLabel();
    });
  }

  // 3. Navbar Scroll state transition & Custom Scrollspy
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    // Initialize state on load
    handleScroll();
    window.addEventListener('scroll', handleScroll);

    // Custom ScrollSpy implementation (resolves offset timing bugs)
    const scrollTargets = document.querySelectorAll('section, header, #tech-stack');
    const navLinks = document.querySelectorAll('#navbar .nav-link');

    const activeNavSpy = () => {
      let currentActiveId = '';
      const scrollPosition = window.scrollY + 130; // 130px offset matches fixed navbar + padding

      scrollTargets.forEach((target) => {
        const targetId = target.getAttribute('id');
        if (!targetId) {
          return;
        }
        const targetTop = target.offsetTop;
        if (scrollPosition >= targetTop) {
          if (!currentActiveId) {
            currentActiveId = targetId;
          } else {
            const currentTop = document.getElementById(currentActiveId)?.offsetTop ?? 0;
            if (targetTop > currentTop) {
              currentActiveId = targetId;
            }
          }
        }
      });

      // Edge case: if scrolled to the very bottom, activate contact
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 20) {
        currentActiveId = 'contact';
      }

      if (currentActiveId) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (!href || !href.startsWith('#')) {
            link.classList.remove('active');
            return;
          }
          if (href === `#${currentActiveId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    };

    window.addEventListener('scroll', activeNavSpy);
    activeNavSpy(); // Initialize on load

    const navMenu = document.getElementById('navMenu');
    if (navMenu && typeof bootstrap !== 'undefined') {
      const navCollapse = bootstrap.Collapse.getOrCreateInstance(navMenu, { toggle: false });
      const mobileNavMedia = window.matchMedia('(max-width: 991.98px)');

      navbar.addEventListener('click', (event) => {
        if (!mobileNavMedia.matches) {
          return;
        }
        if (event.target.closest('.navbar-toggler, [data-bs-toggle="collapse"]')) {
          return;
        }
        const link = event.target.closest('a');
        const menuButton = event.target.closest('#navMenu button');
        if (link || menuButton) {
          navCollapse.hide();
        }
      }, true);

      document.addEventListener('click', (event) => {
        if (!mobileNavMedia.matches) {
          return;
        }
        if (navbar.contains(event.target)) {
          return;
        }
        navCollapse.hide();
      });
    }
  }

  // 4. Scroll Reveal Animations (using Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      // Any visible slice is enough. A 12% threshold never fires on tall
      // sections (the case-study list is taller than the viewport).
      threshold: 0,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: immediately activate if observer is not supported
    revealElements.forEach(el => el.classList.add('active'));
  }

  // Deep links (case studies) must show immediately. The target sits inside a
  // .reveal block that starts at opacity 0, so hash navigation otherwise lands
  // on a blank page. Activate ancestors, then align under the fixed nav.
  const scrollToHashTarget = () => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    let node = target;
    while (node) {
      if (node.classList && node.classList.contains('reveal')) {
        node.classList.add('active');
      }
      node = node.parentElement;
    }

    target.scrollIntoView();
  };

  scrollToHashTarget();
  window.addEventListener('hashchange', scrollToHashTarget);

  // 4b. Scroll-to-top button
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    const toggleScrollTop = () => {
      scrollTopBtn.classList.toggle('is-visible', window.scrollY > 400);
    };
    toggleScrollTop();
    window.addEventListener('scroll', toggleScrollTop, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // 5. Interactive Data Network Canvas Animation (Catchy Hero Visual)
  const canvas = document.getElementById('dataNetworkCanvas');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    // Set device pixel ratio for sharp rendering on retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Colors matching CSS theme variables
    let primaryColor = '#38bdf8'; // Cyan
    let secondaryColor = '#a855f7'; // Purple
    
    // Update colors dynamically based on light/dark theme
    const updateCanvasColors = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        primaryColor = '#0284c7';
        secondaryColor = '#7c3aed';
      } else {
        primaryColor = '#38bdf8';
        secondaryColor = '#a855f7';
      }
    };
    updateCanvasColors();
    
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateCanvasColors();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    
    const particles = [];
    const particleCount = 45;
    const maxDistance = 95;
    const mouse = { x: null, y: null, radius: 120 };
    
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 3 + 1.5;
        this.color = Math.random() > 0.5 ? primaryColor : secondaryColor;
      }
      
      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off bounds
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
        
        // Clamp position within canvas bounds
        if (this.x < 0) this.x = 0;
        if (this.x > width) this.x = width;
        if (this.y < 0) this.y = 0;
        if (this.y > height) this.y = height;
        
        // Mouse interact: attract particles
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 1.2;
            this.y += (dy / dist) * force * 1.2;
          }
        }
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      }
    }
    
    // Init particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    // Track mouse
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
    
    // Connect particles
    function connect() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < maxDistance) {
            // Draw connecting lines with alpha based on distance
            const alpha = (maxDistance - dist) / maxDistance * 0.22;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`; // Subtle purple/gradient
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }
    
    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      connect();
      requestAnimationFrame(animate);
    }
    
    // Resize handler
    window.addEventListener('resize', () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    });
    
    animate();
  }

  // 6. Contact Form AJAX Submission
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      
      // Update button state to sending
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
      
      try {
        const formData = new FormData(contactForm);
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          // Clear inputs
          contactForm.reset();
          
          // Show success state
          submitBtn.classList.remove('btn-premium');
          submitBtn.classList.add('btn-success');
          submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Message Sent!';
          
          // Clear states and redirect/scroll back up to home after delay
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-premium');
            submitBtn.innerHTML = originalBtnText;
            
            // Redirect / scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 2000);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        submitBtn.classList.remove('btn-premium');
        submitBtn.classList.add('btn-danger');
        submitBtn.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Failed to send';
        
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-danger');
          submitBtn.classList.add('btn-premium');
          submitBtn.innerHTML = originalBtnText;
        }, 3000);
      }
    });
  }
});