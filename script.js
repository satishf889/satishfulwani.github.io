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
    const syncThemeToggleLabel = () => {
      const effective = htmlElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      themeToggleBtn.setAttribute(
        'aria-label',
        effective === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
      );
    };

    syncThemeToggleLabel();

    themeToggleBtn.addEventListener('click', () => {
      const effective = htmlElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      setStoredTheme(effective === 'light' ? 'dark' : 'light');
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
    const scrollTargets = document.querySelectorAll('header[id], section[id]');
    const navLinks = document.querySelectorAll('#navbar .nav-link');

    const getDocumentTop = (element) => element.getBoundingClientRect().top + window.scrollY;

    const activeNavSpy = () => {
      let currentActiveId = '';
      const scrollPosition = window.scrollY + 130; // 130px offset matches fixed navbar + padding

      scrollTargets.forEach((target) => {
        const targetId = target.getAttribute('id');
        if (!targetId || targetId === 'about' || targetId === 'tech-stack') {
          return;
        }
        const targetTop = getDocumentTop(target);
        if (scrollPosition >= targetTop) {
          if (!currentActiveId) {
            currentActiveId = targetId;
          } else {
            const currentEl = document.getElementById(currentActiveId);
            const currentTop = currentEl ? getDocumentTop(currentEl) : 0;
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

  // 5. Case study modal
  const caseStudyModalEl = document.getElementById('caseStudyModal');
  const caseStudyModalBody = document.getElementById('caseStudyModalBody');
  const caseStudyModalLabel = document.getElementById('caseStudyModalLabel');
  let caseStudyModal;
  let lastCaseStudyTrigger = null;

  if (caseStudyModalEl && typeof bootstrap !== 'undefined') {
    caseStudyModal = new bootstrap.Modal(caseStudyModalEl);

    document.querySelectorAll('.case-study-open').forEach((btn) => {
      btn.addEventListener('click', () => {
        const studyId = btn.getAttribute('data-study');
        const template = document.getElementById(`case-study-${studyId}`);
        if (!template || !caseStudyModalBody) {
          return;
        }

        lastCaseStudyTrigger = btn;
        caseStudyModalBody.innerHTML = '';
        caseStudyModalBody.appendChild(template.content.cloneNode(true));

        const titleEl = caseStudyModalBody.querySelector('.blog-title');
        if (titleEl && caseStudyModalLabel) {
          caseStudyModalLabel.textContent = titleEl.textContent.trim();
        }

        caseStudyModal.show();
      });
    });

    caseStudyModalEl.addEventListener('hidden.bs.modal', () => {
      if (caseStudyModalBody) {
        caseStudyModalBody.innerHTML = '';
      }
      if (lastCaseStudyTrigger) {
        lastCaseStudyTrigger.focus();
        lastCaseStudyTrigger = null;
      }
    });
  }

  // 7. Contact Form AJAX Submission
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