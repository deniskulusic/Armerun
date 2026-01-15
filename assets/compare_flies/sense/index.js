(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If user prefers reduced motion, skip Lenis entirely (accessibility first)
  if (prefersReduced) {
    console.info('[Lenis] Disabled due to prefers-reduced-motion.');
    document.documentElement.style.scrollBehavior = 'smooth';
    return;
  }

  if (typeof window.Lenis !== 'function') {
    console.warn('[Lenis] CDN failed or unavailable. Falling back to native scrolling.');
    return;
  }

  // Initialize Lenis
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    lerp: 0.1,
    smoothWheel: true,
    smoothTouch: false
  });
  // Collect targets
  const textEls = Array.from(document.querySelectorAll('.reveal-text'));
  const imageEls = Array.from(document.querySelectorAll('.reveal-image'));
  const targets = [...textEls, ...imageEls];

  if (!targets.length) return;

  // Optional: lightweight stagger for siblings
  const applyStagger = (els, base = 70) => {
    els.forEach((el, i) => {
      if (!el.matches('.reveal-text')) return;
      el.dataset.stagger = "1";
      el.style.setProperty('--stagger', `${i * base}ms`);
    });
  };

  // Group consecutive reveal-text siblings for nicer stagger
  let group = [];
  const flushGroup = () => { if (group.length) { applyStagger(group); group = []; } };
  textEls.forEach((el, i) => {
    const prev = textEls[i - 1];
    if (prev && prev.parentElement === el.parentElement) {
      group.push(el);
      if (!group.includes(prev)) group.unshift(prev);
    } else {
      flushGroup();
      group = [el];
    }
  });
  flushGroup();

  // If reduced motion, just mark them visible and bail
  if (prefersReduced) {
    targets.forEach(el => el.classList.add('is-inview'));
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
        // Unobserve once revealed (one-time animation)
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    // Reveal a bit before fully on screen for a snappier feel
    rootMargin: '0px 0px -15% 0px',
    threshold: 0.12
  });

  targets.forEach(t => io.observe(t));

  // Optional: if you use Lenis, ensure IO gets regular rAF ticks (helps on some mobile browsers)
  // Your rAF already runs; but we can ping IO’s internal checks during scroll:
  if (window.__lenis) {
    window.__lenis.on('scroll', () => { /* no-op; forces layout/paint cadence with Lenis */ });
  }


  const VH = () => window.innerHeight || document.documentElement.clientHeight;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const items = Array.from(document.querySelectorAll('.section-3-element-holder , .section-7-holder , .section-10-img-holder , .blog-element-holder'))
    .map(el => {
      const picture = el.querySelector('picture');
      const img = picture && picture.querySelector('img');
      if (!picture || !img) return null;

      const scale = parseFloat(img.dataset.scale || el.dataset.scale || 1.2);
      return {
        el, img, scale,
        height: 0,
        top: 0,
        extra: 0
      };
    })
    .filter(Boolean);

  const measure = () => {
    items.forEach(it => {
      const rect = it.el.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      it.height = rect.height;
      it.top = rect.top + scrollY;
      it.extra = (it.scale - 1) * it.height;
    });
  };

  measure();
  window.addEventListener('resize', () => requestAnimationFrame(measure), { passive: true });

  // ✅ This is what the raf() will call
  window.updateParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const vh = VH();

    items.forEach(it => {
      const start = it.top - vh;
      const end = it.top + it.height;
      const t = clamp((scrollY - start) / (end - start), 0, 1);
      const y = (0.5 - t) * it.extra;

      it.img.style.setProperty('--s', it.scale);
      it.img.style.setProperty('--y', `${y}px`);
    });
  };





  // rAF loop — drives Lenis updates
  function raf(time) {
    lenis.raf(time);

    // ✅ add this new line
    if (window.updateParallax) window.updateParallax();

    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Export for Unit Testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { clamp };
  }


  // Optional: scroll to hash on load if URL contains one (with header offset)
  const stickyOffset = 64; // header height in px
  if (window.location.hash) {
    const el = document.querySelector(window.location.hash);
    if (el) {
      setTimeout(() => lenis.scrollTo(el, { offset: -stickyOffset }), 50);
    }
  }

  // Enhance all in-page anchor links to use Lenis
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const el = document.querySelector(targetId);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -stickyOffset });
      history.pushState(null, '', targetId); // optional
    });
  });

  // Expose for debugging in the console
  window.__lenis = lenis;









  /* ===== BASIC ===== */
  let WindowHeight = window.innerHeight;
  let WindowWidth = window.innerWidth;
  const header = document.querySelector('header');
  const menu = document.querySelector('.menu-full');
  const growSection = document.querySelectorAll('.grow-section');
  let PreFooter = document.querySelector('.image-group');
  let PreFooterElements = document.querySelectorAll('.image-group div');
  let PreFooterFromTop = window.pageYOffset + PreFooter.getBoundingClientRect().top;
  let translation = 0;
  // 2. Define the unique speed for each element (based on your snippet)
  const factors = [0.22, 0.15, 0.08, 0.15, 0.22];
  // 1. Define your boundaries
  const maxW = 1920;
  const minW = 850;
  let responsiveScale = 1; // Default to 1x

  // 2. Calculate the scale based on current width
  if (window.innerWidth >= maxW) {
    responsiveScale = 1;
  } else if (window.innerWidth <= minW) {
    responsiveScale = 0.5;
  } else {
    // Calculate percentage of width between 850 and 1920
    const percentage = (window.innerWidth - minW) / (maxW - minW);
    // Map that percentage to the 0.5 - 1.0 range
    responsiveScale = 0.5 + (percentage * 0.5);
  }


  window.addEventListener("resize", function () {
    PreFooterFromTop = window.pageYOffset + PreFooter.getBoundingClientRect().top;
  });
  if (header) header.classList.add('header-loaded');

  // Parallax via [data-lenis-speed]
  const SCALE = 0.1;
  const parallaxElements = document.querySelectorAll('[data-lenis-speed]');

  lenis.on('scroll', ({ scroll }) => {
    if (scroll > WindowHeight - 100) {
      document.querySelector(".menu-full").classList.add("menu-filled")
    }
    else {
      document.querySelector(".menu-full").classList.remove("menu-filled")
    }

    if (scroll > 50) {
      document.querySelector(".search-overlap-wrapper").classList.add("search-overlap-wrapper-active")
    }
    else {
      document.querySelector(".search-overlap-wrapper").classList.remove("search-overlap-wrapper-active")
    }
    // Top of the screen (0px offset)
    const viewportTop = scroll;

    let insideGrow = false;

    growSection.forEach(section => {
      // REPLACEMENT START: Use getBoundingClientRect for mobile accuracy
      const rect = section.getBoundingClientRect();
      // console.log(rect.top, rect.bottom)
      // rect.top <= 0 means the top of the section has hit or passed the top of the viewport
      // rect.bottom > 0 means the bottom of the section is still visible (hasn't passed the top yet)
      if (rect.top <= 1 && rect.bottom > 0) {
        insideGrow = true;
      }
      // REPLACEMENT END
    });

    // Toggle the class
    if (insideGrow) {
      menu.classList.add('menu-hidden');
    } else {
      menu.classList.remove('menu-hidden');
    }

    parallaxElements.forEach((el) => {
      const speed = parseFloat(el.dataset.lenisSpeed) || 0;
      if (scroll < 1.5 * WindowHeight)
        el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;
    });

    // 3. Check Visibility
    if (PreFooter.getBoundingClientRect().top - 1.5 * WindowHeight < 0 &&
      PreFooter.getBoundingClientRect().top + PreFooter.clientHeight + 0.5 * WindowHeight > 0) {

      // Loop through the elements
      // Assuming PreFooterElements is a NodeList or Array
      for (let i = 0; i < PreFooterElements.length; i++) {
        if (factors[i] !== undefined) {
          // Calculate distance
          let val = factors[i] * responsiveScale * (PreFooterFromTop - scroll);

          // Apply style directly (more performant than .animate)
          PreFooterElements[i].style.transform = "translateY(" + val + "px)";
        }
      }
    }
  });








  /* =======================================================
           // 1. SHARED CURSOR LOGIC (for the main slider)
           // ======================================================= */
  const cursor = document.createElement('div');
  cursor.className = 'drag-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  // MODIFICATION: Add plus icon and ring elements
  cursor.innerHTML = `
    <span class="label">scroll</span>
    <span class="plus-icon">VIEW</span>
    <div class="ring" aria-hidden="true"></div>
`;
  document.body.appendChild(cursor);

  let cursorRAF = null;
  let cursorX = 0, cursorY = 0;
  let targetX = 0, targetY = 0;
  let cursorScale = 1, targetScale = 1;

  function showCursor() { cursor.classList.add('show'); if (cursorRAF == null) cursorLoop(); }
  function hideCursor() { cursor.classList.remove('show'); if (cursorRAF != null) { cancelAnimationFrame(cursorRAF); cursorRAF = null; } }

  function cursorLoop() {
    cursorX += (targetX - cursorX) * 0.18;
    cursorY += (targetY - cursorY) * 0.18;
    cursorScale += (targetScale - cursorScale) * 0.15;
    // Use style properties for smooth transformation
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursor.style.transform = `translate(-50%, -50%) scale(${cursorScale})`;
    cursorRAF = requestAnimationFrame(cursorLoop);
  }
  window.addEventListener('touchstart', () => hideCursor(), { passive: true });

  // Helper to set cursor mode
  function setCursorMode(mode) {
    cursor.classList.remove('cursor-mode-drag', 'cursor-mode-scroll', 'cursor-mode-plus');
    cursor.classList.add(`cursor-mode-${mode}`);
    // Update label text
    if (mode === 'drag' || mode === 'scroll') {
      cursor.querySelector('.label').textContent = mode;
    }
  }


  /* =======================================================
      // 2. PROGRESS BAR LOGIC (Independent)
      // ======================================================= 
  
  const currentSlideCountEl = document.getElementById('currentSlideCount');
  const totalSlideCountEl = document.getElementById('totalSlideCount');
  const progressBarIndicator = document.getElementById('progressBarIndicator');
  
  function updateProgressBarUI(currentIndex, totalSlides) {
      if (totalSlides === 0) return;
      
      const current = currentIndex + 1;
      // Calculate progress percentage: the bar should fully fill on the LAST slide
      const progress = (current / totalSlides) * 100;
  
      // Update text counts
      currentSlideCountEl.textContent = "0" + current;
      totalSlideCountEl.textContent = "0" + totalSlides;
  
      // Update progress indicator width
      progressBarIndicator.style.width = `${progress}%`;
  }
  */

  /* =======================================================
      // 3. MAIN SLIDER FUNCTIONALITY (Drag & Snap)
      // ======================================================= */

  function initSlider(root) {
    const viewport = root.querySelector('.slider-viewport');
    const track = root.querySelector('.slider-track');
    const btnPrev = root.querySelector('.slider-btn.prev');
    const btnNext = root.querySelector('.slider-btn.next');
    const cards = Array.from(root.querySelectorAll('.card'));

    if (!viewport || !track) return;

    const isButtonsOnly = root.classList.contains('buttons-only');
    const dragEnabled = !isButtonsOnly && root.dataset.drag !== 'false';

    let offset = 0;
    let baseOffset = 0;
    let maxScroll = 0;
    let stops = [];
    let momentumRAF = null;

    function measure() {
      const viewW = viewport.clientWidth;

      if (cards.length === 0) {
        baseOffset = 0;
        maxScroll = 0;
        stops = [0];
        return;
      }

      const first = cards[0];
      const last = cards[cards.length - 1];

      const csFirst = getComputedStyle(first);
      const csLast = getComputedStyle(last);

      // Calculate total track width and offsets
      const firstLeftOuter = first.offsetLeft - (parseFloat(csFirst.marginLeft) || 0);
      const lastRightOuter = last.offsetLeft + last.offsetWidth + (parseFloat(csLast.marginRight) || 0);
      const totalWidth = lastRightOuter - firstLeftOuter;

      baseOffset = -firstLeftOuter;
      maxScroll = Math.max(0, totalWidth - viewW);

      // Precompute snap positions (aligned to the left edge of each card)
      stops = cards.map(card => {
        const cs = getComputedStyle(card);
        const leftOuter = card.offsetLeft - (parseFloat(cs.marginLeft) || 0);
        return clamp(-leftOuter); // Ensure stops are clamped
      });

      // Keep offset within bounds
      offset = clamp(offset);
    }

    function clamp(x) {
      const min = baseOffset - maxScroll;
      const max = baseOffset;
      return Math.max(min, Math.min(max, x));
    }

    function render() {
      track.style.transform = `translateX(${offset}px)`;

      // Update buttons
      if (btnPrev) btnPrev.disabled = (offset >= baseOffset - 0.5);
      if (btnNext) btnNext.disabled = (offset <= (baseOffset - maxScroll) + 0.5);

      // Update Progress Bar
      let currentIndexForProgress = 0;
      // Find the index of the card whose stop position is closest to the current offset
      let minDiff = Infinity;
      let closestIndex = 0;

      stops.forEach((stop, index) => {
        const diff = Math.abs(stop - offset);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });

      /*  updateProgressBarUI(closestIndex, cards.length);*/
    }

    function update() {
      measure();
      // Initial run: align to base offset (first card)
      if (Math.abs(offset) < 0.001 && Math.abs(baseOffset) > 0.001) {
        offset = baseOffset;
      }
      render();
    }

    // Snap logic: Find the next/previous *full card* stop position
    function findNextStop(current) {
      const currentCardIndex = stops.findIndex(s => Math.abs(s - current) < 1);
      if (currentCardIndex !== -1 && currentCardIndex < stops.length - 1) {
        return stops[currentCardIndex + 1];
      }
      // Find the first card stop position *to the left* of the current position (if not currently snapped)
      let nextStop = current;
      for (let i = stops.length - 1; i >= 0; i--) {
        if (stops[i] < current - 1) { // Stop is further left than current view
          nextStop = stops[i];
          break;
        }
      }
      return clamp(nextStop);
    }

    function findPrevStop(current) {
      const currentCardIndex = stops.findIndex(s => Math.abs(s - current) < 1);
      if (currentCardIndex > 0) {
        return stops[currentCardIndex - 1];
      }
      // Find the first card stop position *to the right* of the current position (if not currently snapped)
      let prevStop = current;
      for (let i = 0; i < stops.length; i++) {
        if (stops[i] > current + 1) { // Stop is further right than current view
          prevStop = stops[i];
          break;
        }
      }
      return clamp(prevStop);
    }

    function next() {
      offset = findNextStop(offset);
      render();
    }
    function prev() {
      offset = findPrevStop(offset);
      render();
    }

    // Attach button listeners
    if (btnNext) btnNext.addEventListener('click', next);
    if (btnPrev) btnPrev.addEventListener('click', prev);

    // Resize & Load handling
    const roViewport = new ResizeObserver(update);
    const roTrack = new ResizeObserver(update);
    roViewport.observe(viewport);
    roTrack.observe(track);
    window.addEventListener('load', update);
    update();


    /* --- Cursor and Dragging Logic (From User Input) --- */

    if (isButtonsOnly) {
      viewport.addEventListener('pointerenter', () => {
        showCursor();
        setCursorMode('plus');
      });
      viewport.addEventListener('pointerleave', () => {
        hideCursor();
        targetScale = 1;
      });
      viewport.addEventListener('pointermove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      });
      return;
    }

    // ======= Dragging only if enabled =======
    if (!dragEnabled) return;

    let isDragging = false;
    let startX = 0, startOffset = 0, lastX = 0, lastTs = 0, velocity = 0;
    const DRAG_THRESHOLD = 3;

    function stopMomentum() { if (momentumRAF != null) cancelAnimationFrame(momentumRAF); momentumRAF = null; }
    function startMomentum() {
      stopMomentum();
      const decay = 0.95;
      const minVel = 0.05;
      const frame = () => {
        velocity *= decay;
        if (Math.abs(velocity) < minVel) { stopMomentum(); return; }
        // Apply momentum, clamp, and render
        offset = clamp(offset + velocity * 16);
        render();

        // Stop momentum if we hit the edge
        if (offset === 0 || offset === (baseOffset - maxScroll)) {
          velocity = 0; // stop the velocity abruptly
          stopMomentum();
          return;
        }
        momentumRAF = requestAnimationFrame(frame);
      };
      momentumRAF = requestAnimationFrame(frame);
    }

    // Cursor bubble (only for draggable sliders)
    viewport.addEventListener('pointerenter', () => {
      showCursor();
      setCursorMode('scroll');
    });
    viewport.addEventListener('pointerleave', () => { hideCursor(); targetScale = 1; });
    viewport.addEventListener('pointermove', (e) => { targetX = e.clientX; targetY = e.clientY; });

    // Pointer events for drag
    viewport.addEventListener('pointerdown', (e) => {
      // 🆕 Allow links to be clickable — don't start drag if pointer down on an <a>
      const anchor = e.target.closest('a');
      if (anchor) {
        return; // let the browser handle the link normally
      }

      if (e.button !== 0 && e.pointerType === 'mouse') return;
      viewport.setPointerCapture(e.pointerId);
      stopMomentum();
      isDragging = true;
      startX = lastX = e.clientX;
      startOffset = offset;
      lastTs = performance.now();
      velocity = 0;
      setCursorMode('drag');
      targetScale = 0.9;
      viewport.classList.add('dragging');
      e.preventDefault();
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dxRaw = e.clientX - startX;

      const dxBase = Math.abs(dxRaw) < DRAG_THRESHOLD ? 0 : dxRaw;
      const dx = dxBase * 1; // Drag dampening

      offset = clamp(startOffset + dx);
      render();

      const dt = now - lastTs || 16;
      velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTs = now;

      const speed = Math.min(Math.abs(velocity) * 30, 1);
      targetScale = 1 - speed * 0.35;
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('dragging');
      setCursorMode('scroll');
      targetScale = 1;

      // Start momentum only if it wasn't a static click and we are not at the edge
      if (Math.abs(velocity) > 0.01 && offset > (baseOffset - maxScroll) + 1 && offset < baseOffset - 1) {
        startMomentum();
      } else {
        // Snap back if momentum is negligible
        offset = clamp(offset); // Re-clamp just in case
        render();
      }
      velocity = 0; // Reset velocity after drag ends
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);

    track.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // Initialize all sliders
  document.querySelectorAll('.slider').forEach(initSlider);















  /*GROW SECTION*/




  /*GROW SECTION*/

  const growSections = Array.from(document.querySelectorAll('.grow-section'));
  if (growSections.length) {
    const toPx = (val) => {
      if (typeof val !== 'string') return Number(val) || 0;
      if (val.endsWith('vh')) return (parseFloat(val) / 100) * window.innerHeight;
      if (val.endsWith('vw')) return (parseFloat(val) / 100) * window.innerWidth;
      if (val.endsWith('px')) return parseFloat(val);
      return parseFloat(val) || 0;
    };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    const state = growSections.map((section) => {
      const pin = section.querySelector('.pin');
      const frame = section.querySelector('.frame');
      const video = frame ? frame.querySelector('img') : null;

      // Frame (container) scale range
      const startScale = parseFloat(section.dataset.growStart || 0.7);
      const endScale = parseFloat(section.dataset.growEnd || 1.0);

      // Video: its own range + a curve exponent to change the pace
      const vStart = parseFloat(section.dataset.videoStart ?? startScale);
      const vEnd = parseFloat(section.dataset.videoEnd ?? endScale);
      const vCurve = parseFloat(section.dataset.videoCurve || 1); // 1=linear, <1 ease-out, >1 ease-in

      const distStr = section.dataset.growDistance
        || getComputedStyle(section).getPropertyValue('--grow-distance')
        || '120vh';
      let growDistance = toPx(distStr);

      // Extra hold after reaching full scale (defaults to 10vh)
      const holdStr = section.dataset.growHold || '20vh';
      let holdPx = toPx(holdStr);

      // Sync section height (pin duration) — include hold
      section.style.setProperty('--grow-distance', `${growDistance}px`);
      section.style.setProperty('--grow-hold', `${holdPx}px`);
      section.style.height = `calc(100vh + ${growDistance}px + ${holdPx}px)`;

      // Initial transforms (in case CSS didn’t set them)
      if (frame && !frame.style.transform) frame.style.transform = `scale(${startScale})`;
      if (video && !video.style.transform) video.style.transform = `scale(${vStart})`;

      return { section, pin, frame, video, startScale, endScale, vStart, vEnd, vCurve, growDistance, holdPx, holdStr };
    });

    function updateGrow() {
      state.forEach((s) => {
        if (!s.section || !s.frame) return;
        const rect = s.section.getBoundingClientRect();

        // Use growDistance + holdPx as the effective pinned distance so the section
        // remains pinned (and at scale 1) for an extra holdPx of scroll.
        const effectiveDistance = s.growDistance + s.holdPx;

        // Base progress for the animation (0..1)
        // This should complete over growDistance, before the hold.
        const p = clamp((-rect.top) / s.growDistance, 0, 1);

        // Frame: linear
        const frameScale = lerp(s.startScale, s.endScale, p);
        s.frame.style.transform = `scale(${frameScale})`;

        // When it reaches full scale (or beyond) we can toggle any UI hooks
        if (frameScale >= 1) {
          const S2RD = document.querySelector(".overlay");
          if (S2RD) S2RD.classList.add('overlay-text-active');

        }

        // Video: apply curve to change pace
        const pv = Math.pow(p, s.vCurve); // <1 = faster at start, >1 = slower at start
        const videoScale = lerp(s.vStart, s.vEnd, clamp(pv, 0, 1));
        if (s.video) s.video.style.transform = `scale(${videoScale})`;
      });
    }

    function recomputeDistances() {
      state.forEach((s) => {
        const distStr = s.section.dataset.growDistance
          || getComputedStyle(s.section).getPropertyValue('--grow-distance')
          || '120vh';
        s.growDistance = toPx(distStr);

        // Recompute hold (in case CSS or dataset changed)
        const holdStr = s.section.dataset.growHold || s.holdStr || '10vh';
        s.holdPx = toPx(holdStr);

        s.section.style.setProperty('--grow-distance', `${s.growDistance}px`);
        s.section.style.setProperty('--grow-hold', `${s.holdPx}px`);
        s.section.style.height = `calc(100vh + ${s.growDistance}px + ${s.holdPx}px)`;
      });
      updateGrow();
    }

    // Hook into Lenis + resize
    if (window.__lenis) window.__lenis.on('scroll', updateGrow);
    window.addEventListener('resize', recomputeDistances);
    updateGrow();
  }




  /*END OF GROW SECTION*/




  const slider = document.getElementById('review_slider');
  const track = document.getElementById('review_track');
  const prevBtn2 = slider.querySelector('.review_btn.review_prev');
  const nextBtn2 = slider.querySelector('.review_btn.review_next');

  function getVisibleCount() {
    return window.innerWidth <= 768 ? 1 : 3;
  }

  let VISIBLE = getVisibleCount();

  let slideEls = Array.from(track.children);

  // Clone first/last N for seamless edges
  function addClones() {
    // Clean any existing clones (idempotent re-init on resize)
    Array.from(track.children).forEach((el) => {
      if (el.dataset.clone === 'true') el.remove();
    });

    slideEls = Array.from(track.children);
    const firstClones = slideEls.slice(0, VISIBLE).map(el => { const c = el.cloneNode(true); c.dataset.clone = 'true'; return c; });
    const lastClones = slideEls.slice(-VISIBLE).map(el => { const c = el.cloneNode(true); c.dataset.clone = 'true'; return c; });
    // Prepend last clones, append first clones
    lastClones.forEach(c => track.insertBefore(c, track.firstChild));
    firstClones.forEach(c => track.appendChild(c));
  }

  // Compute geometry
  let index = VISIBLE; // start on first real slide (after prepended clones)
  let step = 0; // pixel distance per move

  function computeStep() {
    const firstCard = track.querySelector('.review_card');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    if (!firstCard) return 0;
    const cardWidth = firstCard.getBoundingClientRect().width; // gap is separate
    step = Math.round(cardWidth + gap);
    return step;
  }

  function updateActive() {
    const cards = track.querySelectorAll('.review_card');
    cards.forEach(c => {
      c.classList.remove('active');
      c.removeAttribute('aria-current');
    });

    // center slide depends on VISIBLE
    let centerOffset = Math.floor(VISIBLE / 2);
    const centerIdx = index + centerOffset;

    const centerEl = track.children[centerIdx];

    if (centerEl && centerEl.classList.contains('review_card')) {
      centerEl.classList.add('active');
      centerEl.setAttribute('aria-current', 'true');
    }
  }


  function jumpWithoutAnim(newIndex) {
    track.style.transition = 'none';
    index = newIndex;
    track.style.transform = `translateX(${-index * step}px)`;
    updateActive();
    // force reflow to apply instantly, then restore transition
    track.getBoundingClientRect();
    requestAnimationFrame(() => {
      track.style.transition = 'transform 420ms ease';
    });
  }

  function goTo(newIndex) {
    index = newIndex;
    track.style.transform = `translateX(${-index * step}px)`;
    updateActive();
  }

  function disableDuringTransition(disabled = true) {
    prevBtn2.disabled = disabled; nextBtn2.disabled = disabled;
  }

  function setup() {
    addClones();
    computeStep();
    // Position to first real slide after clones
    track.style.transition = 'none';
    track.style.transform = `translateX(${-index * step}px)`;
    updateActive();
    // enable transition after first paint
    requestAnimationFrame(() => track.style.transition = 'transform 420ms ease');
  }

  // Transition end: snap back if we've crossed into clones
  track.addEventListener('transitionend', () => {
    disableDuringTransition(false);
    const total = track.children.length; // includes clones
    const realCount = total - (VISIBLE * 2);
    const firstReal = VISIBLE; // after prepended clones
    const lastRealStart = firstReal + realCount - 1;

    if (index > lastRealStart) {
      // passed the end into appended clones — snap to matching real index
      const delta = index - (lastRealStart + 1);
      jumpWithoutAnim(firstReal + delta);
    } else if (index < firstReal) {
      // went to the left into prepended clones — snap to matching real index
      const delta = firstReal - index;
      jumpWithoutAnim(lastRealStart - delta + 1);
    } else {
      updateActive();
    }
  });

  nextBtn2.addEventListener('click', () => {
    disableDuringTransition(true);
    goTo(index + 1);
  });

  prevBtn2.addEventListener('click', () => {
    disableDuringTransition(true);
    goTo(index - 1);
  });

  // Keyboard support
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextBtn2.click();
    if (e.key === 'ArrowLeft') prevBtn2.click();
  });
  slider.tabIndex = 0; // make focusable for keyboard nav

  // Basic drag / swipe support
  let startX = 0; let dragging = false; let startTransform = 0;
  const onPointerDown = (e) => {
    dragging = true; startX = e.clientX || e.touches?.[0]?.clientX || 0;
    const matrix = new DOMMatrix(getComputedStyle(track).transform);
    startTransform = matrix.m41; // current translateX
    track.style.transition = 'none';
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const delta = x - startX;
    track.style.transform = `translateX(${startTransform + delta}px)`;
  };
  const onPointerUp = (e) => {
    if (!dragging) return; dragging = false;
    const x = e.clientX || e.changedTouches?.[0]?.clientX || 0;
    const delta = x - startX;
    // threshold: move at least 1/4 step to change slide
    const threshold = step * 0.25;
    requestAnimationFrame(() => track.style.transition = 'transform 420ms ease');
    if (Math.abs(delta) > threshold) {
      if (delta < 0) goTo(index + 1); else goTo(index - 1);
    } else {
      goTo(index); // snap back
    }
  };
  track.addEventListener('mousedown', onPointerDown);
  track.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);

  // Recompute on resize and re-init clones so card width changes are respected
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      VISIBLE = getVisibleCount();          // ✔ update # of visible slides
      const previousRealOffset = index - VISIBLE;
      setup();
      jumpWithoutAnim(VISIBLE + Math.max(0, previousRealOffset));
    }, 100);
  });

  setup();

  const dropdown = document.getElementById('boat-dropdown');
  const selectedText = dropdown.querySelector('.dropdown-selected');
  const options = dropdown.querySelectorAll('.dropdown-options li');
  const hiddenInput = document.getElementById('boat-type-hidden');

  // 1. Toggle dropdown open/close on click
  dropdown.addEventListener('click', function (e) {
    // Prevent immediate closing when clicking inside
    e.stopPropagation();
    this.classList.toggle('active');
  });

  // 2. Handle Item Selection
  options.forEach(option => {
    option.addEventListener('click', function () {
      // Update the visible text
      selectedText.textContent = this.textContent;

      // Update the actual hidden form value
      hiddenInput.value = this.getAttribute('data-value');

      // Add a specific color class if you want the selected text to be darker
      selectedText.style.color = "#132b51";
    });
  });

  // 3. Close dropdown if clicking anywhere else on the page
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });




  const menuBtn = document.querySelector(".han-menu-full");
  const menuFULL = document.querySelector(".menu-full");

  // Define mobile breakpoint
  const isMobile = window.innerWidth < 768;

  if (menuBtn && menuFULL) {
    // Variable to store scroll position for native fallback
    let nativeScrollPos = 0;

    menuBtn.addEventListener("click", () => {
      const isActive = menuFULL.classList.toggle("menu-active");


      // CHECK 1: Is Lenis active? (Use this for both Desktop AND Mobile if available)
      // We removed the "!isMobile" check because lenis.stop() is cleaner than CSS hacks on mobile
      if (typeof lenis !== "undefined" && lenis) {
        if (isActive) {
          lenis.stop();
        } else {
          lenis.start();
        }
        console.log("Lenis toggle active");
      }

      // CHECK 2: Fallback (If Lenis is disabled due to Reduced Motion or error)
      else {
        if (isActive) {
          // LOCK: Record position -> Fix body -> Offset top
          nativeScrollPos = window.scrollY || window.pageYOffset;
          document.body.style.position = 'fixed';
          document.body.style.top = `-${nativeScrollPos}px`;
          document.body.style.width = '100%';
          document.body.style.overflow = 'hidden';
        } else {
          // UNLOCK: Remove styles -> Restore scroll position
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, nativeScrollPos);
        }
        console.log("Native scroll toggle active");
      }
    });
  }
})();
