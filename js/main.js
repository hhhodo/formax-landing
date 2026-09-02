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

  // ---------- stack: x-ray wipe ----------
  // The photo is pinned (sticky) and the CTA card rises over it. The line-art copy of
  // the SAME image sits above the card and is clipped to start exactly at the card's
  // top edge — so only the part of the image the card currently covers shows as
  // wireframe, and the boundary tracks the card as it scrolls.
  const stackLineArt = document.getElementById('stackLineArt');
  const stackCta = document.getElementById('cta');
  if (stackLineArt && stackCta) {
    let xrayTicking = false;
    const updateXray = () => {
      xrayTicking = false;
      const imgRect = stackLineArt.getBoundingClientRect();
      if (!imgRect.height) return;
      const cardTop = stackCta.getBoundingClientRect().top;
      let boundary = cardTop - imgRect.top;
      boundary = Math.min(Math.max(boundary, 0), imgRect.height);
      stackLineArt.style.clipPath = `inset(${boundary.toFixed(1)}px 0 0 0)`;
    };
    const scheduleXray = () => {
      if (!xrayTicking) {
        xrayTicking = true;
        requestAnimationFrame(updateXray);
      }
    };
    updateXray();
    window.addEventListener('scroll', scheduleXray, { passive: true });
    window.addEventListener('resize', scheduleXray);
    if (stackLineArt.complete) updateXray();
    else stackLineArt.addEventListener('load', updateXray);
  }

  // ---------- stack: CTA card holds scroll briefly once it locks to the top ----------
  // A 1px sentinel sits right above the sticky card. When it scrolls out of view the
  // card has just become "stuck" at the top — that's the trigger to hold scroll for a
  // moment. No animation on the card itself (it doesn't move or resize — it's already
  // full-bleed and sharp-cornered like every other card on this page).
  const ctaSentinel = document.querySelector('.stack__cta-sentinel');
  const ctaCard = document.getElementById('cta');
  if (ctaSentinel && ctaCard && 'IntersectionObserver' in window
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !window.matchMedia('(max-width: 1024px)').matches) {
    let locked = false;
    const HOLD_MS = 450;

    const preventScrollKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const preventScrollWheel = (e) => { e.preventDefault(); };
    const lockScroll = () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.addEventListener('wheel', preventScrollWheel, { passive: false });
      window.addEventListener('touchmove', preventScrollWheel, { passive: false });
      window.addEventListener('keydown', preventScrollKey);
    };
    const unlockScroll = () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('wheel', preventScrollWheel);
      window.removeEventListener('touchmove', preventScrollWheel);
      window.removeEventListener('keydown', preventScrollKey);
    };

    const ctaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !locked) {
            locked = true;
            lockScroll();
            setTimeout(() => { unlockScroll(); locked = false; }, HOLD_MS);
          }
        });
      },
      { threshold: 0, rootMargin: `-${Math.round(parseFloat(getComputedStyle(ctaCard).top) || 0)}px 0px 0px 0px` }
    );
    ctaObserver.observe(ctaSentinel);
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
