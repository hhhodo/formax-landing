(() => {
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
  let lastXray = -1;
  let ticking = false;

  if (reduceMotion) {
    stackRows.forEach(({ row }) => row.style.setProperty('--fill', '100%'));
  }

  const onFrame = () => {
    ticking = false;
    const vh = window.innerHeight;

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

  // CTA card lock/grow-on-scroll (IntersectionObserver + overflow:hidden toggling)
  // was pulled out entirely — across several attempts it kept re-triggering itself
  // (flicker), which fed bad values into the rAF loop above and made the sticky
  // image jitter too. The card still holds at the top via plain CSS position:sticky
  // (see .stack__cta / .stack__cta-wrap in site.css) — just no lock or grow animation.

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
