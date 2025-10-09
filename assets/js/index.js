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
        duration: 1.15,            // seconds it takes to reach the target
        easing: (t) => 1 - Math.pow(1 - t, 3), // custom cubic easing
        lerp: 0.1,                 // linear interpolation (used internally)
        smoothWheel: true,
        smoothTouch: false
      });

      // rAF loop — drives Lenis updates
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Optional: scroll to hash on load if URL contains one (with header offset)
      const stickyOffset = 64; // header height in px
      if (window.location.hash) {
        const el = document.querySelector(window.location.hash);
        if (el) {
          // slight delay to ensure layout is ready
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
          // Update the URL hash (optional)
          history.pushState(null, '', targetId);
        });
      });

      // Expose for debugging in the console
      window.__lenis = lenis;




      /*bASIC*/
       const header=document.querySelector("header");
        header.classList.add("header-loaded");

        const SCALE = 0.1;

// Apply parallax automatically to anything with [data-lenis-speed]
lenis.on("scroll", ({ scroll }) => {
    console.log("yo")
  document.querySelectorAll("[data-lenis-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.lenisSpeed) || 0;
    el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;
  });
});
/*
const viewport = document.querySelector('.slider-viewport');
  const track = document.querySelector('.slider-track');
  const cards = Array.from(track.querySelectorAll('.card'));
  const btnPrev = document.querySelector('.slider-btn.prev');
  const btnNext = document.querySelector('.slider-btn.next');

  // Dimensions (must match CSS)
  const GAP = 32;           // gap between cards (px)
  const CARD_W = 640;       // card width (px)
  const STEP = CARD_W + GAP;

  let offset = 0;           // current translateX (negative or 0)

  function clampOffset(x) {
    // Max scroll so that the last card's right edge aligns with viewport's right edge
    const totalWidth = cards.length * CARD_W + (cards.length - 1) * GAP;
    const viewW = viewport.clientWidth;
    const maxScroll = Math.max(0, totalWidth - viewW);  // pixels we can move left
    const min = -maxScroll;  // negative value (left)
    const max = 0;           // at start
    return Math.max(min, Math.min(max, x));
  }

  function update() {
    track.style.transform = `translateX(${offset}px)`;
    // Disable buttons at bounds with 0.6 opacity via :disabled styling
    btnPrev.disabled = (offset >= 0);
    // Compute max scroll again for safety
    const totalWidth = cards.length * CARD_W + (cards.length - 1) * GAP;
    const viewW = viewport.clientWidth;
    const maxScroll = Math.max(0, totalWidth - viewW);
    btnNext.disabled = (Math.abs(offset) >= maxScroll - 0.5); // tolerate rounding
  }

  function next() {
    offset = clampOffset(offset - STEP);
    update();
  }

  function prev() {
    offset = clampOffset(offset + STEP);
    update();
  }

  // Button handlers
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  // Recalculate on resize to keep the last item aligned correctly
  window.addEventListener('resize', update);

  // Initialize
  update();
*/
 const root      = document.querySelector('.section-2');
  const prevBtn   = root.querySelector('.slider-btn.prev');
  const nextBtn   = root.querySelector('.slider-btn.next');

  const leftBox   = root.querySelector('.section-2-right-down-left');
  const rightHold = root.querySelector('.section-2-right-down-right-holder');

  const numWrap   = root.querySelector('.num-swap-wrap');
  const numAllEl  = root.querySelector('.section-2-numbers-all');

  // All slides authored in HTML:
  const slideEls  = Array.from(root.querySelectorAll('.section-2-slides .slide'));

  // Set total count from DOM
  if (numAllEl) numAllEl.textContent = String(slideEls.length).padStart(2, '0');

  // Ensure right holder has a .fit layer for stacking images during swaps
  let fit = rightHold.querySelector('.fit');
  if (!fit) {
    fit = document.createElement('div');
    fit.className = 'fit';
    const currentPic = rightHold.querySelector('picture') || rightHold.querySelector('img');
    if (currentPic) fit.appendChild(currentPic);
    rightHold.appendChild(fit);
  }

  // Swap helpers (enter stays in flow, exit becomes absolute)
  function swapIn(container, nextEl, exitTo = 'to-left') {
  const current = container.lastElementChild;
  const h = container.offsetHeight;
  container.style.minHeight = h + 'px';

  container.appendChild(nextEl);

  // kick off transition
  nextEl.offsetHeight;            // reflow
  nextEl.classList.add('swap-enter-active');

  if (current) {
    current.classList.add('swap-exit', exitTo, 'swap-exit-active');
    current.addEventListener('transitionend', () => current.remove(), { once: true });
  }

  // when the enter animation ends, drop the directional class
  nextEl.addEventListener('transitionend', () => {
    nextEl.classList.remove('from-right', 'swap-enter', 'swap-enter-active');
    container.style.minHeight = '';
  }, { once: true });
}

  function swapNumber(newStr) {
  const current = numWrap.querySelector('.num-swap');
  const nextNum = document.createElement('span');
  nextNum.className = 'section-2-numbers-current num-swap num-enter from-top';
  nextNum.textContent = newStr;

  numWrap.appendChild(nextNum);
  nextNum.offsetHeight;
  nextNum.classList.add('num-enter-active');

  if (current) {
    current.classList.add('num-exit', 'to-bottom', 'num-exit-active');
    current.addEventListener('transitionend', () => current.remove(), { once: true });
  }

  nextNum.addEventListener('transitionend', () => {
    nextNum.classList.remove('from-top', 'num-enter', 'num-enter-active');
  }, { once: true });
}

  function buildLeftFromSlide(slideEl) {
    const wrap = document.createElement('div');
    wrap.className = 'swap-enter from-right';
    const src = slideEl.querySelector('.slide-text');
    wrap.innerHTML = src ? src.innerHTML : '';
    return wrap;
  }

  function buildRightFromSlide(slideEl) {
    const wrap = document.createElement('div');
    wrap.className = 'swap-enter from-right fit';
    const pic = slideEl.querySelector('.slide-picture');
    wrap.innerHTML = pic ? pic.innerHTML : '';
    return wrap;
  }

  let index = 0; // start on first authored slide

  function render(i) {
    const slideEl = slideEls[i];
    const numStr = slideEl.dataset.number || String(i + 1).padStart(2, '0');

    swapIn(leftBox,  buildLeftFromSlide(slideEl), 'to-left');
    swapNumber(numStr);
    swapIn(rightHold, buildRightFromSlide(slideEl), 'to-left');
  }

  // Initialize display from Slide 1 (already visible markup gets replaced smoothly)
  render(index);

  // Looping navigation (no disabling)
  nextBtn.addEventListener('click', () => {
    index = (index + 1) % slideEls.length;
    render(index);
  });

  prevBtn.addEventListener('click', () => {
    index = (index - 1 + slideEls.length) % slideEls.length;
    render(index);
  });


    })();