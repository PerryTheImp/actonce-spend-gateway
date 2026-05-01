// ActOnce Spend Gateway — Landing Page Scripts

document.addEventListener('DOMContentLoaded', function() {
  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all
      faqItems.forEach(i => i.classList.remove('active'));
      
      // Open clicked if not already active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
  
  // Mobile Menu Toggle
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav');
  
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('nav-open');
    });
  }
  
  // Copy to Clipboard
  const copyBtns = document.querySelectorAll('.copy-btn');
  
  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.clipboard;
      
      try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalSVG = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#10b981" stroke-width="2"><path d="M3 8l4 4 6-6"/></svg>';
        
        setTimeout(() => {
          btn.innerHTML = originalSVG;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Navbar background on scroll
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      nav.style.background = 'rgba(10, 14, 26, 0.95)';
    } else {
      nav.style.background = 'rgba(10, 14, 26, 0.8)';
    }
    
    lastScroll = currentScroll;
  });
  
  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${Math.random() * 0.3}s`;
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, observerOptions);
  
  // Observe cards
  document.querySelectorAll('.pain-card, .feature-card, .pricing-card').forEach(card => {
    observer.observe(card);
  });
});
