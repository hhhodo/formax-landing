(() => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const hero = document.querySelector('.hero');

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

  // =====================================================================
  // ONE scroll loop for everything, single rAF, off-screen elements skipped,
  // values rounded and only written when actually changed.
  // =====================================================================
  const stackRows = [...document.querySelectorAll('.stack .srow')].map((row) => ({
    row,
    title: row.querySelector('.srow__title'),
    last: -1,
  }));
  const stackLineArt = document.getElementById('stackLineArt');
  const ctaCard = document.getElementById('cta');
  const ctaWrap = ctaCard ? ctaCard.closest('.stack__cta-wrap') : null;
  let lastXray = -1;
  let lastCover = -1;
  let lastFill1 = -1;
  let lastFill2 = -1;
  let lastFill3 = -1;
  let lastNavSolid = null;
  let ticking = false;

  if (reduceMotion) {
    stackRows.forEach(({ row }) => row.style.setProperty('--fill', '100%'));
  }

  // ---- cached (layout-dependent) values, recomputed only on load/resize ----
  const stickyTopPx = ctaCard ? parseFloat(getComputedStyle(ctaCard).top) || 0 : 0;
  let heroBottom = 0;
  let ctaPinStart = 0;
  let ctaPinEnd = 0;
  let ctaTitleEnd = 0;
  let ctaTitleRange = 1;
  let ctaCoverRange = 1;
  // captured before any --cta-pad override exists, so this reads the CSS fallback
  // (calc(var(--u)*2)) resolved to real px — can't parse --u itself via
  // getComputedStyle since custom properties return their literal authored string,
  // not the resolved clamp() value.
  const ctaBasePadPx = ctaCard ? parseFloat(getComputedStyle(ctaCard).paddingLeft) || 28 : 28;

  const absoluteTop = (el) => {
    let top = 0;
    let node = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent;
    }
    return top;
  };

  const recomputeLayout = () => {
    if (hero) heroBottom = absoluteTop(hero) + hero.offsetHeight;
    if (ctaCard && ctaWrap) {
      ctaPinStart = absoluteTop(ctaCard) - stickyTopPx;
      ctaPinEnd = absoluteTop(ctaWrap) + ctaWrap.offsetHeight - ctaCard.offsetHeight - stickyTopPx;
      const totalPin = Math.max(1, ctaPinEnd - ctaPinStart);
      // sequence: title fill (line 1 then line 2) first, THEN the header-cover growth —
      // only once both lines are fully white does the card start expanding.
      ctaTitleRange = Math.max(1, Math.min(window.innerHeight * 0.9, totalPin * 0.6));
      ctaTitleEnd = ctaPinStart + ctaTitleRange;
      ctaCoverRange = Math.max(1, ctaPinEnd - ctaTitleEnd);
    }
  };
  recomputeLayout();

  const onFrame = () => {
    ticking = false;
    const vh = window.innerHeight;
    const scrollY = window.scrollY;

    // A) header stays a solid black bar over the (dark) hero; once scrolled past it,
    // switch to transparent + mix-blend-mode:difference so it auto-inverts per section.
    if (nav) {
      const solid = scrollY < heroBottom - stickyTopPx;
      if (solid !== lastNavSolid) {
        lastNavSolid = solid;
        nav.classList.toggle('nav--solid', solid);
      }
    }

    // B) row title color-fill STARTS exactly at screen-center (not while still
    // entering from below) and finishes as it continues up toward the top —
    // so the sweep is something you actually watch happen, not something that's
    // already half-done by the time the title reaches the middle.
    if (!reduceMotion) {
      const startAt = vh * 0.5;
      const endAt = vh * -0.35;
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

    // x-ray wipe: only the part of the product image the CTA card currently covers
    // shows as line-art.
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

    // C) CTA title fills white top-to-bottom / left-to-right, one line at a time —
    // line 2 only starts once line 1 is fully white, line 3 only once line 2 is.
    // Only after all three finish does the card start growing over the header
    // (--cta-cover) with its side padding closing up (--cta-pad) — all driven
    // purely by scroll position, no locks/observers.
    if (ctaCard) {
      const titleProgress = Math.min(1, Math.max(0, (scrollY - ctaPinStart) / ctaTitleRange));
      const fill1 = Math.round(Math.min(1, titleProgress * 3) * 100);
      const fill2 = Math.round(Math.min(1, Math.max(0, titleProgress * 3 - 1)) * 100);
      const fill3 = Math.round(Math.min(1, Math.max(0, titleProgress * 3 - 2)) * 100);
      if (fill1 !== lastFill1) {
        lastFill1 = fill1;
        ctaCard.style.setProperty('--cta-fill1', `${fill1}%`);
      }
      if (fill2 !== lastFill2) {
        lastFill2 = fill2;
        ctaCard.style.setProperty('--cta-fill2', `${fill2}%`);
      }
      if (fill3 !== lastFill3) {
        lastFill3 = fill3;
        ctaCard.style.setProperty('--cta-fill3', `${fill3}%`);
      }

      const coverProgress = Math.min(1, Math.max(0, (scrollY - ctaTitleEnd) / ctaCoverRange));
      const coverPx = Math.round(coverProgress * stickyTopPx);
      if (coverPx !== lastCover) {
        lastCover = coverPx;
        ctaCard.style.setProperty('--cta-cover', `${coverPx}px`);
        const padPx = Math.round(ctaBasePadPx * (1 - coverProgress));
        ctaCard.style.setProperty('--cta-pad', `${padPx}px`);
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
  window.addEventListener('resize', () => { recomputeLayout(); schedule(); });
  if (stackLineArt && !stackLineArt.complete) {
    stackLineArt.addEventListener('load', () => { recomputeLayout(); onFrame(); });
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
