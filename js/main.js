(() => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // ---------- stack section: per-row pinned scroll, title text-fill progress ----------
  const stackRows = document.querySelectorAll('.stack .srow');
  if (stackRows.length) {
    const rowAbsoluteTop = (el) => {
      let top = 0;
      let node = el;
      while (node) {
        top += node.offsetTop;
        node = node.offsetParent;
      }
      return top;
    };

    let stackTicking = false;
    const updateStackFill = () => {
      stackTicking = false;
      stackRows.forEach((row) => {
        const stickyTop = parseFloat(getComputedStyle(row).top) || 0;
        const pinStart = rowAbsoluteTop(row) - stickyTop;
        const pinRange = row.offsetHeight - window.innerHeight;
        let progress = 0;
        if (pinRange > 0) {
          progress = (window.scrollY - pinStart) / pinRange;
          progress = Math.min(1, Math.max(0, progress));
        } else {
          progress = window.scrollY >= pinStart ? 1 : 0;
        }
        row.style.setProperty('--fill', `${(progress * 100).toFixed(1)}%`);
      });
    };
    const scheduleStackFill = () => {
      if (!stackTicking) {
        stackTicking = true;
        requestAnimationFrame(updateStackFill);
      }
    };
    updateStackFill();
    window.addEventListener('scroll', scheduleStackFill, { passive: true });
    window.addEventListener('resize', scheduleStackFill);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => observer.observe(el));
  }
})();
