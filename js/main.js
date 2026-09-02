(() => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = !window.matchMedia('(max-width: 1024px)').matches;

  // =====================================================================
  // ONE scroll loop for everything. Previously nav / row-fill / x-ray each
  // registered their own scroll listener with their own rAF, so every frame
  // ran three callbacks and wrote styles even for elements far off screen —
  // and they wrote sub-pixel values (.toFixed(1)), forcing a repaint of the
  // text-clipped gradients and the 800px image on changes nobody can see.
  // Now: single rAF, skip anything off screen, round to whole units, and
  // bail out entirely when the value hasn't actually changed.
  // =====================================================================
  const stackRows = [...document.querySelectorAll('.stack .srow')].map((row) => ({
    row,
    title: row.querySelector('.srow__title'),
    last: -1,
  }));
  const stackLineArt = document.getElementById('stackLineArt');
  const ctaCard = document.getElementById('cta');
  let lastNavScrolled = null;
  let lastXray = -1;
  let ticking = false;

  if (reduceMotion) {
    stackRows.forEach(({ row }) => row.style.setProperty('--fill', '100%'));
  }

  const onFrame = () => {
    ticking = false;
    const vh = window.innerHeight;

    const scrolled = window.scrollY > 40;
    if (scrolled !== lastNavScrolled) {
      lastNavScrolled = scrolled;
      nav.classList.toggle('is-scrolled', scrolled);
    }

    if (!reduceMotion) {
      const startAt = vh * 0.85;
      const endAt = vh * 0.25;
      for (let i = 0; i < stackRows.length; i += 1) {
        const item = stackRows[i];
        const rect = (item.title || item.row).getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue; // off screen: skip
        const anchor = rect.top + rect.height / 2;
        let pct = Math.round(((startAt - anchor) / (startAt - endAt)) * 100);
        pct = Math.min(100, Math.max(0, pct));
        if (pct !== item.last) {
          item.last = pct;
          item.row.style.setProperty('--fill', `${pct}%`);
        }
      }
    }

    if (stackLineArt && ctaCard) {
      const imgRect = stackLineArt.getBoundingClientRect();
      if (imgRect.height && imgRect.bottom > -200 && imgRect.top < vh + 200) {
        const cardTop = ctaCard.getBoundingClientRect().top;
        let boundary = Math.round(cardTop - imgRect.top);
        boundary = Math.min(Math.max(boundary, 0), Math.round(imgRect.height));
        if (boundary !== lastXray) {
          lastXray = boundary;
          stackLineArt.style.clipPath = `inset(${boundary}px 0 0 0)`;
        }
      }
    }
  };

  const schedule = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onFrame);
    }
  };
  onFrame();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if (stackLineArt && !stackLineArt.complete) {
    stackLineArt.addEventListener('load', onFrame);
  }

  // ---------- CTA card: locks at the top, grows to black out the whole screen ----------
  // The 1px sentinel above the sticky card tells us the exact moment it becomes stuck.
  // Then: lock scroll -> the card's background layer scales up past the header so the
  // entire screen goes black -> unlock once that growth finishes.
  const ctaSentinel = document.querySelector('.stack__cta-sentinel');
  if (ctaSentinel && ctaCard && 'IntersectionObserver' in window && !reduceMotion && desktop) {
    let locked = false;
    let expanded = false;
    const GROW_MS = 450;

    const preventKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const preventWheel = (e) => { e.preventDefault(); };
    // NOTE: body{position:fixed} was tried for this and it broke the sticky card's
    // stuck-state the instant it applied (card jumped elsewhere). overflow:hidden
    // stops scrolling without disturbing anyone's layout.
    const lockScroll = () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.addEventListener('wheel', preventWheel, { passive: false });
      window.addEventListener('touchmove', preventWheel, { passive: false });
      window.addEventListener('keydown', preventKey);
    };
    const unlockScroll = () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('wheel', preventWheel);
      window.removeEventListener('touchmove', preventWheel);
      window.removeEventListener('keydown', preventKey);
    };

    const ctaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const stuck = !entry.isIntersecting;
          if (stuck && !expanded && !locked) {
            // how much taller than its own box the card must grow to also cover
            // the header strip above it
            const h = ctaCard.offsetHeight;
            const above = ctaCard.getBoundingClientRect().top;
            ctaCard.style.setProperty('--cta-grow', h ? ((h + Math.max(above, 0)) / h).toFixed(3) : '1.06');
            expanded = true;
            locked = true;
            lockScroll();
            ctaCard.classList.add('is-expanded');
            setTimeout(() => { unlockScroll(); locked = false; }, GROW_MS);
          } else if (!stuck && expanded && !locked) {
            expanded = false;
            ctaCard.classList.remove('is-expanded');
          }
        });
      },
      { threshold: 0, rootMargin: `-${Math.round(parseFloat(getComputedStyle(ctaCard).top) || 0)}px 0px 0px 0px` }
    );
    ctaObserver.observe(ctaSentinel);
  }

  // ---------- generic reveal-on-scroll ----------
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
