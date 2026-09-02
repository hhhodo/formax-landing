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

  // ---------- stack: CTA card locks + grows to fill the screen, scroll disabled meanwhile ----------
  // A 1px sentinel sits right above the sticky card. When it scrolls out of view the
  // card has just become "stuck" at the top — that's the trigger to lock scroll and
  // play the grow animation (clip-path shrinking to 0, driven by CSS transition).
  const ctaSentinel = document.querySelector('.stack__cta-sentinel');
  const ctaCard = document.getElementById('cta');
  if (ctaSentinel && ctaCard && 'IntersectionObserver' in window
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !window.matchMedia('(max-width: 1024px)').matches) {
    let expanded = false;
    let locked = false;
    let lockedScrollY = 0;

    const lockScroll = () => {
      lockedScrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    };
    const unlockScroll = () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockedScrollY);
    };

    const onTransitionEnd = (e) => {
      if (e.propertyName !== 'clip-path' || !locked) return;
      ctaCard.removeEventListener('transitionend', onTransitionEnd);
      unlockScroll();
      locked = false;
    };

    const ctaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const stuck = !entry.isIntersecting;
          if (stuck && !expanded && !locked) {
            expanded = true;
            locked = true;
            lockScroll();
            requestAnimationFrame(() => ctaCard.classList.add('is-expanded'));
            ctaCard.addEventListener('transitionend', onTransitionEnd);
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
