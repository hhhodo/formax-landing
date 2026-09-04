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
  const quoteText = document.querySelector('.quote__text');
  const quotePin = document.querySelector('.quote__pin');
  const quoteWrap = quotePin ? quotePin.closest('.quote__pin-wrap') : null;
  let lastXray = -1;
  let lastCover = -1;
  let lastFill1 = -1;
  let lastFill2 = -1;
  let lastFill3 = -1;
  let lastNavSolid = null;
  let ticking = false;
  const quoteEyebrow = document.querySelector('.quote-eyebrow');
  const seg = (t, i) => Math.round(Math.min(1, Math.max(0, t * 4 - i)) * 100);
  let lastQ0 = -1, lastQ1 = -1, lastQ2 = -1, lastQ3 = -1;
  const setQuoteFill = (t) => {
    // t: 0..1 overall, 4 pieces in reading order — eyebrow label first, then the
    // three body lines. Same continuous scroll-position-driven approach as the CTA
    // title (no lock) — kept consistent so the two don't feel like different features.
    const q0 = seg(t, 0), q1 = seg(t, 1), q2 = seg(t, 2), q3 = seg(t, 3);
    if (q0 !== lastQ0 && quoteEyebrow) { lastQ0 = q0; quoteEyebrow.style.setProperty('--quote-fill0', `${q0}%`); }
    if (q1 !== lastQ1) { lastQ1 = q1; quoteText.style.setProperty('--quote-fill1', `${q1}%`); }
    if (q2 !== lastQ2) { lastQ2 = q2; quoteText.style.setProperty('--quote-fill2', `${q2}%`); }
    if (q3 !== lastQ3) { lastQ3 = q3; quoteText.style.setProperty('--quote-fill3', `${q3}%`); }
  };

  if (reduceMotion) {
    stackRows.forEach(({ row }) => row.style.setProperty('--fill', '100%'));
    if (quoteText) {
      quoteText.style.setProperty('--quote-fill1', '100%');
      quoteText.style.setProperty('--quote-fill2', '100%');
      quoteText.style.setProperty('--quote-fill3', '100%');
      if (quoteEyebrow) quoteEyebrow.style.setProperty('--quote-fill0', '100%');
    }
  }

  // ---- cached (layout-dependent) values, recomputed only on load/resize ----
  const stickyTopPx = ctaCard ? parseFloat(getComputedStyle(ctaCard).top) || 0 : 0;
  let heroBottom = 0;
  let ctaPinStart = 0;
  let ctaPinEnd = 0;
  let ctaTitleEnd = 0;
  let ctaTitleRange = 1;
  let ctaCoverRange = 1;
  let quotePinStart = 0;
  let quoteFillRange = 1;
  // captured before any --cta-pad override exists, so this reads the CSS fallback
  // (calc(var(--u)*2)) resolved to real px — can't parse --u itself via
  // getComputedStyle since custom properties return their literal authored string,
  // not the resolved clamp() value.
  const ctaBasePadPx = ctaCard ? parseFloat(getComputedStyle(ctaCard).paddingLeft) || 28 : 28;
  // the enclosing .container's own fixed side padding (--gutter) — the card's
  // negative margin needs to counteract exactly this much to actually reach the edge
  const ctaContainer = ctaCard ? ctaCard.closest('.container') : null;
  const ctaGutterPx = ctaContainer ? parseFloat(getComputedStyle(ctaContainer).paddingLeft) || 28 : 28;

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
    if (quotePin) {
      quotePinStart = absoluteTop(quotePin) - stickyTopPx;
      quoteFillRange = Math.max(1, window.innerHeight * 1.2);
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

    // Quote text: pinned (sticky) but scroll is NOT blocked — same continuous
    // scroll-position-driven fill as the CTA title, so the two behave consistently.
    if (!reduceMotion && quoteText) {
      const qt = Math.min(1, Math.max(0, (scrollY - quotePinStart) / quoteFillRange));
      setQuoteFill(qt);
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
        const marginPx = Math.round(-ctaGutterPx * coverProgress);
        ctaCard.style.setProperty('--cta-margin', `${marginPx}px`);
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

  // ---------- contact title: ONE dot hops letter-to-letter, left to right ----------
  // a per-letter fade-in/out (one dot per span) read as separate dots blinking on
  // and off instead of one point traveling — back to a single element that
  // physically moves, using offsetLeft (pure layout, no scroll/viewport
  // dependence) instead of getBoundingClientRect so the math can't drift.
  const contactTitle = document.getElementById('contactTitle');
  const contactDot = document.getElementById('contactDot');
  if (contactTitle && contactDot && !reduceMotion) {
    const NBSP = String.fromCharCode(160);
    const chars = [...contactTitle.textContent].map((ch) => {
      const span = document.createElement('span');
      // a space alone inside an inline-block box is leading+trailing whitespace of
      // that box and gets collapsed to zero width — use a non-breaking space instead
      span.textContent = ch === ' ' ? NBSP : ch;
      return span;
    });
    contactTitle.textContent = '';
    chars.forEach((span) => contactTitle.appendChild(span));

    const HOP_MS = 500;
    let i = 0;
    let timer = null;
    // contactTitle and contactDot share the same offsetParent (contact-inner), so
    // title.offsetLeft + span.offsetLeft lines up directly with the coordinate
    // space contactDot's own `left` is positioned in
    const moveTo = (index) => {
      const span = chars[index];
      const x = contactTitle.offsetLeft + span.offsetLeft + span.offsetWidth / 2;
      contactDot.style.left = `${x}px`;
    };
    const hop = () => {
      const isLast = i === chars.length - 1;
      moveTo(i);
      contactDot.classList.remove('is-hopping', 'is-resting');
      void contactDot.offsetWidth;
      contactDot.classList.add('is-hopping');
      if (isLast) {
        clearInterval(timer);
        // freeze mid-arc instead of dropping back to baseline once the last letter is reached
        setTimeout(() => {
          contactDot.classList.remove('is-hopping');
          contactDot.classList.add('is-resting');
        }, HOP_MS);
      }
      i += 1;
    };
    // wait until the box has mostly scrolled into view before the sequence starts —
    // a center-line rootMargin trick fired too early (as soon as the tall section's
    // edge crossed the middle of the screen), finishing well before the user arrived
    if ('IntersectionObserver' in window) {
      const startObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              hop();
              timer = setInterval(hop, HOP_MS);
              startObserver.disconnect();
            }
          });
        },
        { threshold: 0.6 }
      );
      startObserver.observe(contactTitle);
    } else {
      hop();
      timer = setInterval(hop, HOP_MS);
    }
    window.addEventListener('resize', () => moveTo(Math.min(i, chars.length - 1)));
  }

  // ---------- footer wordmark: font-size fitted to container width in JS ----------
  // a flat vw-based clamp overflowed sideways at laptop widths (where the
  // container is narrower relative to the viewport); measuring the actual
  // rendered width and scaling from it keeps "FORMAX" filling the row at any width.
  const footerWordmark = document.getElementById('footerWordmark');
  if (footerWordmark) {
    const BASE_SIZE = 500;
    const fitWordmark = () => {
      footerWordmark.style.fontSize = `${BASE_SIZE}px`;
      const available = footerWordmark.clientWidth;
      const natural = footerWordmark.scrollWidth;
      const size = natural > available ? Math.floor(BASE_SIZE * (available / natural)) : BASE_SIZE;
      footerWordmark.style.fontSize = `${size}px`;
    };
    fitWordmark();
    window.addEventListener('resize', fitWordmark);
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
