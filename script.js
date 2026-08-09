document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Theme Toggle Logic
  const themeToggleBtn = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  function setTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('i');
      if (icon) {
        if (theme === 'light') {
          icon.className = 'bi bi-moon-fill';
        } else {
          icon.className = 'bi bi-sun';
        }
      }
    }
  }

  // Load saved theme preference or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
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
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('#navbar .nav-link');

    const activeNavSpy = () => {
      let currentActiveId = '';
      const scrollPosition = window.scrollY + 130; // 130px offset matches fixed navbar + padding

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentActiveId = section.getAttribute('id');
        }
      });

      // Edge case: if scrolled to the very bottom, activate the contact link
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 20) {
        const lastLink = navLinks[navLinks.length - 1];
        if (lastLink) {
          currentActiveId = lastLink.getAttribute('href').substring(1);
        }
      }

      if (currentActiveId) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${currentActiveId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    };

    window.addEventListener('scroll', activeNavSpy);
    activeNavSpy(); // Initialize on load
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
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: immediately activate if observer is not supported
    revealElements.forEach(el => el.classList.add('active'));
  }

  // 5. Interactive Data Network Canvas Animation (Catchy Hero Visual)
  const canvas = document.getElementById('dataNetworkCanvas');
  if (canvas) {
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