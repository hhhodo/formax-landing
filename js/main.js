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

  // ---------- stack section: title color-fill tracks live scroll position ----------
  // Rows are normal-flow (not sticky), so getBoundingClientRect() genuinely changes
  // every scroll tick — safe to use directly, unlike the earlier sticky version where
  // it stayed frozen while pinned. Fill starts as the row's title enters the lower
  // part of the viewport and finishes as it approaches the upper part, so the sweep
  // is visible for the whole time the row is comfortably on screen.
  const stackRows = document.querySelectorAll('.stack .srow');
  if (stackRows.length) {
    const reduceMotionStack = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotionStack) {
      stackRows.forEach((row) => row.style.setProperty('--fill', '100%'));
    } else {
      let stackTicking = false;
      const updateStackFill = () => {
        stackTicking = false;
        const vh = window.innerHeight;
        const startAt = vh * 0.85;
        const endAt = vh * 0.25;
        stackRows.forEach((row) => {
          const title = row.querySelector('.srow__title');
          const rect = (title || row).getBoundingClientRect();
          const anchor = rect.top + rect.height / 2;
          let progress = (startAt - anchor) / (startAt - endAt);
          progress = Math.min(1, Math.max(0, progress));
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
  }

  // ---------- stack: crossfade the sticky image to its x-ray/line-art render while
  // the CTA card is on screen (image itself never moves — it's still sticky/frozen) ----------
  const stackImgWrap = document.getElementById('stackImgWrap');
  const stackCta = document.getElementById('cta');
  if (stackImgWrap && stackCta && 'IntersectionObserver' in window) {
    const xrayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          stackImgWrap.classList.toggle('is-xray', entry.isIntersecting);
        });
      },
      { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
    );
    xrayObserver.observe(stackCta);
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
