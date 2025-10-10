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
    const textEls  = Array.from(document.querySelectorAll('.reveal-text'));
    const imageEls = Array.from(document.querySelectorAll('.reveal-image'));
    const targets  = [...textEls, ...imageEls];

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
  const header = document.querySelector('header');
  if (header) header.classList.add('header-loaded');

  // Parallax via [data-lenis-speed]
  const SCALE = 0.1;
  lenis.on('scroll', ({ scroll }) => {
    document.querySelectorAll('[data-lenis-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.lenisSpeed) || 0;
      el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;
    });
  });

  /* ===== SLIDER (section with .slider-viewport / .slider-track) ===== */
  const viewport = document.querySelector('.slider-viewport');
  const track = document.querySelector('.slider-track');
  if (viewport && track) {
    const cards = Array.from(track.querySelectorAll('.card'));
    const btnPrev = document.querySelector('.slider-btn.prev');
    const btnNext = document.querySelector('.slider-btn.next');

    const GAP = 32;     // px
    const CARD_W = 640; // px
    const STEP = CARD_W + GAP;

    let offset = 0;

    function clampOffset(x) {
      const totalWidth = cards.length * CARD_W + (cards.length - 1) * GAP;
      const viewW = viewport.clientWidth;
      const maxScroll = Math.max(0, totalWidth - viewW);
      const min = -maxScroll;
      const max = 0;
      return Math.max(min, Math.min(max, x));
    }

    function update() {
      track.style.transform = `translateX(${offset}px)`;
      if (btnPrev) btnPrev.disabled = (offset >= 0);

      const totalWidth = cards.length * CARD_W + (cards.length - 1) * GAP;
      const viewW = viewport.clientWidth;
      const maxScroll = Math.max(0, totalWidth - viewW);
      if (btnNext) btnNext.disabled = (Math.abs(offset) >= maxScroll - 0.5);
    }

    function next() { offset = clampOffset(offset - STEP); update(); }
    function prev() { offset = clampOffset(offset + STEP); update(); }

    if (btnNext) btnNext.addEventListener('click', next);
    if (btnPrev) btnPrev.addEventListener('click', prev);
    window.addEventListener('resize', update);
    update();
  }
// ---------- Shared helpers (used by every section instance) ----------
  function initSection(root) {
    if (!root) return;

    const prevBtn = root.querySelector('.slider-btn.prev');
    const nextBtn = root.querySelector('.slider-btn.next');

    const leftBox   = root.querySelector('.section-2-right-down-left');
    const rightHold = root.querySelector('.section-2-right-down-right-holder');
    const leftHold  = root.querySelector('.section-2-left-holder');

    const numWrap   = root.querySelector('.num-swap-wrap');
    const numAllEl  = root.querySelector('.section-2-numbers-all');
    const rightUp   = root.querySelector('.section-2-right-up'); // progress bar

    const slideEls  = Array.from(root.querySelectorAll('.section-2-slides .slide'));
    if (!slideEls.length) return;

    // ---- one-time holder setup
    if (numAllEl) numAllEl.textContent = String(slideEls.length).padStart(2, '0');

    let fit = rightHold ? rightHold.querySelector('.fit') : null;
    if (rightHold && !fit) {
      fit = document.createElement('div');
      fit.className = 'fit';
      const currentPic = rightHold.querySelector('picture') || rightHold.querySelector('img');
      if (currentPic) fit.appendChild(currentPic);
      rightHold.appendChild(fit);
    }

    let leftFit = leftHold ? leftHold.querySelector('.fit') : null;
    if (leftHold && !leftFit) {
      leftFit = document.createElement('div');
      leftFit.className = 'fit';
      const currentLeftPic = leftHold.querySelector('picture') || leftHold.querySelector('img');
      if (currentLeftPic) leftFit.appendChild(currentLeftPic);
      leftHold.appendChild(leftFit);
    }

    // ---- helpers scoped to this section
    function swapNumber(newStr) {
      if (!numWrap) return;
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

    function swapImageWipe(slideEl) {
      if (!rightHold) return;
      const pic = slideEl.querySelector('.slide-picture');
      const nextHTML = pic ? pic.innerHTML : '';
      const overlay = document.createElement('div');
      overlay.className = 'wipe-layer wipe-enter';
      overlay.innerHTML = nextHTML;
      rightHold.appendChild(overlay);
      overlay.offsetHeight;
      overlay.classList.add('wipe-enter-active');
      overlay.addEventListener('transitionend', () => {
        rightHold.innerHTML = '';
        const stable = document.createElement('div');
        stable.className = 'fit';
        stable.innerHTML = nextHTML;
        rightHold.appendChild(stable);
      }, { once: true });
    }

    function swapLeftImageWipe(slideEl) {
      if (!leftHold) return;
      const pic = slideEl.querySelector('.slide-left-picture');
      const nextHTML = pic ? pic.innerHTML : '';
      if (!nextHTML) return;
      const overlay = document.createElement('div');
      overlay.className = 'wipe-layer wipe-enter';
      overlay.innerHTML = nextHTML;
      leftHold.appendChild(overlay);
      overlay.offsetHeight;
      overlay.classList.add('wipe-enter-active');
      overlay.addEventListener('transitionend', () => {
        leftHold.innerHTML = '';
        const stable = document.createElement('div');
        stable.className = 'fit';
        stable.innerHTML = nextHTML;
        leftHold.appendChild(stable);
      }, { once: true });
    }

    // --- per-line splitter that preserves spaces
    function splitIntoLines(blockEl) {
      const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return node.nodeValue.replace(/\s/g, '').length
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      const seg = (typeof Intl !== 'undefined' && Intl.Segmenter)
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;

      textNodes.forEach((tn) => {
        const src = tn.nodeValue;
        let pieces = src.split(/(\s+)/).filter(s => s.length > 0);
        if (pieces.length === 1) {
          pieces = seg ? Array.from(seg.segment(src), s => s.segment) : Array.from(src);
        }
        const frag = document.createDocumentFragment();
        pieces.forEach((part) => {
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'word-token';
            span.style.display = 'inline-block';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        tn.parentNode.replaceChild(frag, tn);
      });

      const tokens = Array.from(blockEl.querySelectorAll('.word-token'));
      if (!tokens.length) return;

      const lines = [];
      let currentTop = null;
      let group = [];
      tokens.forEach((tok) => {
        const top = Math.round(tok.getBoundingClientRect().top);
        if (currentTop === null || Math.abs(top - currentTop) <= 1) {
          currentTop = (currentTop === null) ? top : currentTop;
          group.push(tok);
        } else {
          lines.push(group);
          group = [tok];
          currentTop = top;
        }
      });
      if (group.length) lines.push(group);

      const wrapper = document.createElement('div');
      wrapper.className = 'line-block';
      lines.forEach((arr) => {
        const line = document.createElement('span');
        line.className = 'line';
        const inner = document.createElement('span');
        inner.className = 'line-inner';
        arr.forEach((tok) => inner.appendChild(tok));
        line.appendChild(inner);
        wrapper.appendChild(line);
      });

      blockEl.innerHTML = '';
      blockEl.appendChild(wrapper);
    }

    function buildLeftPerLineFromSlide(slideEl) {
      const wrap = document.createElement('div');
      const src = slideEl.querySelector('.slide-text');
      wrap.innerHTML = src ? src.innerHTML : '';
      wrap.querySelectorAll('h4 ,h3 , p').forEach(splitIntoLines);
      const a = wrap.querySelector('a');
      if (a) {
        const linkText = a.textContent;
        a.textContent = ' ';
        const line = document.createElement('span');
        line.className = 'line';
        const inner = document.createElement('span');
        inner.className = 'line-inner';
        inner.textContent = linkText;
        line.appendChild(inner);
        a.appendChild(line);
      }
      return wrap;
    }

    function swapLeftTextPerLine(container, slideEl) {
      if (!container) return;
      const current = container.lastElementChild;

      const nextEl = buildLeftPerLineFromSlide(slideEl);

      const h = container.offsetHeight;
      container.style.minHeight = h + 'px';

      nextEl.querySelectorAll('.line').forEach((line) => line.classList.add('line-enter'));

      container.appendChild(nextEl);

      nextEl.offsetHeight;

      if (current) {
        current.querySelectorAll('.line').forEach((line) => line.classList.add('line-exit'));
        current.offsetHeight;
        current.classList.add('line-exit-active');
        current.querySelectorAll('.line').forEach((line) => line.classList.add('line-exit-active'));
      }

      nextEl.querySelectorAll('.line').forEach((line) => {
        line.classList.add('line-enter-active');
      });

      const lastIncoming = nextEl.querySelector('.line:last-child .line-inner') || nextEl;
      lastIncoming.addEventListener('transitionend', () => {
        if (current) current.remove();
        nextEl.querySelectorAll('.line').forEach((line) => {
          line.classList.remove('line-enter', 'line-enter-active');
        });
        container.style.minHeight = '';
      }, { once: true });
    }

    // cooldown per section
    let isAnimating = false;
    const COOLDOWN_MS = 1500;
    function startCooldown() {
      isAnimating = true;
      setTimeout(() => { isAnimating = false; }, COOLDOWN_MS);
    }

    function setProgress(index) {
      if (!rightUp) return;
      const progress = ((index + 1) / slideEls.length) * 100;
      rightUp.style.setProperty('--progress', `${progress}%`);
    }

    // ---- render & nav
    let index = 0;

    function render(i) {
      const slideEl = slideEls[i];
      if (!slideEl) return;
      const numStr = slideEl.dataset.number || String(i + 1).padStart(2, '0');

      swapLeftTextPerLine(leftBox, slideEl);
      swapNumber(numStr);
      swapImageWipe(slideEl);
      swapLeftImageWipe(slideEl);
      setProgress(i);
    }

    render(index);

    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (isAnimating) return;
      startCooldown();
      index = (index + 1) % slideEls.length;
      render(index);
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (isAnimating) return;
      startCooldown();
      index = (index - 1 + slideEls.length) % slideEls.length;
      render(index);
    });
  }

  // Initialize ALL sections that use this pattern
  document.querySelectorAll('.section-2, .section-6').forEach(initSection);
  /* ===== SECTION-2 SWAPPER ===== 
  const root = document.querySelector('.section-2');
  if (root) {
    const prevBtn = root.querySelector('.slider-btn.prev');
    const nextBtn = root.querySelector('.slider-btn.next');

    const leftBox   = root.querySelector('.section-2-right-down-left');
    const rightHold = root.querySelector('.section-2-right-down-right-holder');

    const numWrap   = root.querySelector('.num-swap-wrap');
    const numAllEl  = root.querySelector('.section-2-numbers-all');
    const rightUp   = root.querySelector('.section-2-right-up'); // <-- progress bar container

    const slideEls  = Array.from(root.querySelectorAll('.section-2-slides .slide'));

    const leftHold  = root.querySelector('.section-2-left-holder');

    if (numAllEl) numAllEl.textContent = String(slideEls.length).padStart(2, '0');

    let fit = rightHold ? rightHold.querySelector('.fit') : null;
    if (rightHold && !fit) {
      fit = document.createElement('div');
      fit.className = 'fit';
      const currentPic = rightHold.querySelector('picture') || rightHold.querySelector('img');
      if (currentPic) fit.appendChild(currentPic);
      rightHold.appendChild(fit);
    }

    let leftFit = leftHold ? leftHold.querySelector('.fit') : null;
    if (leftHold && !leftFit) {
      leftFit = document.createElement('div');
      leftFit.className = 'fit';
      const currentLeftPic = leftHold.querySelector('picture') || leftHold.querySelector('img');
      if (currentLeftPic) leftFit.appendChild(currentLeftPic);
      leftHold.appendChild(leftFit);
    }

    function swapNumber(newStr) {
      if (!numWrap) return;
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
    function swapImageWipe(slideEl) {
  if (!rightHold) return;

  // Get the next image HTML from the slide
  const pic = slideEl.querySelector('.slide-picture');
  const nextHTML = pic ? pic.innerHTML : '';

  // Create overlay layer (the one being revealed)
  const overlay = document.createElement('div');
  overlay.className = 'wipe-layer wipe-enter';
  overlay.innerHTML = nextHTML;

  // Append overlay on top of current image
  rightHold.appendChild(overlay);

  // Trigger reflow to start transition
  overlay.offsetHeight; // force reflow
  overlay.classList.add('wipe-enter-active');

  // When animation ends, clean up and make new image the base layer
  overlay.addEventListener('transitionend', () => {
    rightHold.innerHTML = ''; // clear existing
    const stable = document.createElement('div');
    stable.className = 'fit';
    stable.innerHTML = nextHTML;
    rightHold.appendChild(stable);
  }, { once: true });
    }
    function swapLeftImageWipe(slideEl) {
  if (!leftHold) return;

  const pic = slideEl.querySelector('.slide-left-picture');
  const nextHTML = pic ? pic.innerHTML : '';

  if (!nextHTML) return; // no left image for this slide

  const overlay = document.createElement('div');
  overlay.className = 'wipe-layer wipe-enter';
  overlay.innerHTML = nextHTML;

  leftHold.appendChild(overlay);

  // start the wipe
  overlay.offsetHeight; // reflow
  overlay.classList.add('wipe-enter-active');

  overlay.addEventListener('transitionend', () => {
    leftHold.innerHTML = '';
    const stable = document.createElement('div');
    stable.className = 'fit';
    stable.innerHTML = nextHTML;
    leftHold.appendChild(stable);
  }, { once: true });
    }
    // Turn a block element's wrapped words into per-line groups
    function splitIntoLines(blockEl) {
  // 1) collect text nodes (ignore pure whitespace-only nodes)
  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue.replace(/\s/g, '').length
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  // Grapheme splitter for CJK/emoji/no-space text
  const seg = (typeof Intl !== 'undefined' && Intl.Segmenter)
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

  // 2) replace each text node with a mixture of spans (words/graphemes) and TEXT NODES (spaces)
  textNodes.forEach((tn) => {
    const src = tn.nodeValue;

    // First try splitting by whitespace while keeping it
    let pieces = src.split(/(\s+)/).filter(s => s.length > 0);

    // If no whitespace at all, split by grapheme (or per-char fallback)
    if (pieces.length === 1) {
      pieces = seg
        ? Array.from(seg.segment(src), s => s.segment)
        : Array.from(src);
    }

    const frag = document.createDocumentFragment();

    pieces.forEach((part) => {
      if (/^\s+$/.test(part)) {
        // PRESERVE SPACES as text nodes so spacing renders naturally
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement('span');
        span.className = 'word-token';
        span.style.display = 'inline-block'; // keeps each token measurable
        span.textContent = part;
        frag.appendChild(span);
      }
    });

    tn.parentNode.replaceChild(frag, tn);
  });

  // 3) group tokens by visual line (spaces are text nodes and still affect layout)
  const tokens = Array.from(blockEl.querySelectorAll('.word-token'));
  if (!tokens.length) return;

  const lines = [];
  let currentTop = null;
  let group = [];

  tokens.forEach((tok) => {
    const top = Math.round(tok.getBoundingClientRect().top);
    if (currentTop === null || Math.abs(top - currentTop) <= 1) {
      currentTop = (currentTop === null) ? top : currentTop;
      group.push(tok);
    } else {
      lines.push(group);
      group = [tok];
      currentTop = top;
    }
  });
  if (group.length) lines.push(group);

  // 4) rebuild into .line > .line-inner (spaces remain between tokens naturally)
  const wrapper = document.createElement('div');
  wrapper.className = 'line-block';

  lines.forEach((arr) => {
    const line = document.createElement('span');
    line.className = 'line';
    const inner = document.createElement('span');
    inner.className = 'line-inner';

    // Move the measured tokens into the inner — surrounding text nodes (spaces)
    // will automatically move along with them because they are siblings in the DOM.
    arr.forEach((tok) => inner.appendChild(tok));

    line.appendChild(inner);
    wrapper.appendChild(line);
  });

  blockEl.innerHTML = '';
  blockEl.appendChild(wrapper);
}
    // Build the left content with per-line structure
    function buildLeftPerLineFromSlide(slideEl) {
      const wrap = document.createElement('div');
      const src = slideEl.querySelector('.slide-text');
      wrap.innerHTML = src ? src.innerHTML : '';

      // Split only the elements we want line-animated (h4, p, and optionally the link text)
      wrap.querySelectorAll('h4, p').forEach(splitIntoLines);

      // For the link: animate as a single line (optional)
      const a = wrap.querySelector('a');
      if (a) {
        // wrap the link text into line container
        const linkText = a.textContent;
        a.textContent = ' ';
        const line = document.createElement('span');
        line.className = 'line';
        const inner = document.createElement('span');
        inner.className = 'line-inner';
        inner.textContent = linkText;
        line.appendChild(inner);
        a.appendChild(line);
      }

      return wrap;
    }

    // Animate current-left out (line by line) and next-left in (line by line)
    function swapLeftTextPerLine(container, slideEl) {
      if (!container) return;
      const current = container.lastElementChild;

      // Build next
      const nextEl = buildLeftPerLineFromSlide(slideEl);

      // Lock height to avoid reflow jumps
      const h = container.offsetHeight;
      container.style.minHeight = h + 'px';

      // Prepare next lines: mark as entering
      nextEl.querySelectorAll('.line').forEach((line) => line.classList.add('line-enter'));

      // Append next
      container.appendChild(nextEl);

      // Reflow then animate both directions
      nextEl.offsetHeight;

      // Animate out old lines (down)
      if (current) {
        current.querySelectorAll('.line').forEach((line) => line.classList.add('line-exit'));
        current.offsetHeight;
        current.classList.add('line-exit-active');
        current.querySelectorAll('.line').forEach((line) => line.classList.add('line-exit-active'));
      }

      // Animate in new lines (from top)
      nextEl.querySelectorAll('.line').forEach((line) => {
        line.classList.add('line-enter-active');
      });

      // Cleanup when the incoming finishes (listen on the last line)
      const lastIncoming = nextEl.querySelector('.line:last-child .line-inner') || nextEl;
      lastIncoming.addEventListener('transitionend', () => {
        // Remove outgoing node
        if (current) current.remove();

        // Drop helper classes
        nextEl.querySelectorAll('.line').forEach((line) => {
          line.classList.remove('line-enter', 'line-enter-active');
        });

        container.style.minHeight = '';
      }, { once: true });
    }

    let isAnimating = false;
    const COOLDOWN_MS = 1500;

    function startCooldown() {
      isAnimating = true;
      setTimeout(() => {
        isAnimating = false;
      }, COOLDOWN_MS);
    }
    // --- Progress underline ---
    function setProgress(index) {
      if (!rightUp) return;
      const progress = ((index + 1) / slideEls.length) * 100;
      rightUp.style.setProperty('--progress', `${progress}%`);
    }

    let index = 0;

    function render(i) {
      const slideEl = slideEls[i];
      if (!slideEl) return;
      const numStr = slideEl.dataset.number || String(i + 1).padStart(2, '0');

      swapLeftTextPerLine(leftBox, slideEl); // two-stage: exit fully, then enter
      swapNumber(numStr);
      //swapIn(rightHold, buildRightFromSlide(slideEl), 'to-left');
      swapImageWipe(slideEl);
      // NEW: left image wipe (right -> left)
      swapLeftImageWipe(slideEl);
      setProgress(i); // <-- update underline width
    }

    render(index);

 if (nextBtn) nextBtn.addEventListener('click', () => {
  if (isAnimating) return; // stop spamming
  startCooldown();
  index = (index + 1) % slideEls.length;
  render(index);
});

if (prevBtn) prevBtn.addEventListener('click', () => {
  if (isAnimating) return;
  startCooldown();
  index = (index - 1 + slideEls.length) % slideEls.length;
  render(index);
});
  }
*/
  /* ===== NEW: STICKY GROW SECTIONS (70vw -> 100vw while pinned) =====
     Markup:
       <section class="grow-section" data-grow-distance="120vh" data-grow-start="0.7" data-grow-end="1">
         <div class="pin">
           <div class="frame"> ... </div>
         </div>
       </section>
     Required CSS (summary):
       .grow-section{height:calc(100vh + var(--grow-distance,120vh))}
       .grow-section .pin{position:sticky;top:0;height:100vh;overflow:clip}
       .grow-section .frame{width:100vw;height:100vh;transform-origin:center;transform:scaleX(0.7);will-change:transform}
  */
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
    const lerp  = (a, b, t) => a + (b - a) * t;

    const state = growSections.map((section) => {
      const pin   = section.querySelector('.pin');
      const frame = section.querySelector('.frame');
      const video = frame ? frame.querySelector('img') : null;

      // Frame (container) scale range
      const startScale = parseFloat(section.dataset.growStart || 0.7);
      const endScale   = parseFloat(section.dataset.growEnd   || 1.0);

      // Video: its own range + a curve exponent to change the pace
      const vStart = parseFloat(section.dataset.videoStart ?? startScale);
      const vEnd   = parseFloat(section.dataset.videoEnd   ?? endScale);
      const vCurve = parseFloat(section.dataset.videoCurve || 1); // 1=linear, <1 ease-out, >1 ease-in

      const distStr = section.dataset.growDistance
        || getComputedStyle(section).getPropertyValue('--grow-distance')
        || '120vh';
      let growDistance = toPx(distStr);

      // Sync section height (pin duration)
      section.style.setProperty('--grow-distance', `${growDistance}px`);
      section.style.height = `calc(100vh + ${growDistance}px)`;

      // Initial transforms (in case CSS didn’t set them)
      if (frame && !frame.style.transform) frame.style.transform = `scale(${startScale})`;
      if (video && !video.style.transform) video.style.transform = `scale(${vStart})`;

      return { section, pin, frame, video, startScale, endScale, vStart, vEnd, vCurve, growDistance };
    });

    function updateGrow() {
      state.forEach((s) => {
        if (!s.section || !s.frame) return;
        const rect = s.section.getBoundingClientRect();

        // Base progress while pinned
        const p = clamp((-rect.top) / s.growDistance, 0, 1);

        // Frame: linear
        const frameScale = lerp(s.startScale, s.endScale, p);
        s.frame.style.transform = `scale(${frameScale})`;

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
        s.section.style.setProperty('--grow-distance', `${s.growDistance}px`);
        s.section.style.height = `calc(100vh + ${s.growDistance}px)`;
      });
      updateGrow();
    }

    // Hook into Lenis + resize
    if (window.__lenis) window.__lenis.on('scroll', updateGrow);
    window.addEventListener('resize', recomputeDistances);
    updateGrow();
  }


 document.querySelector(".han-menu-full").addEventListener("click", function(){
  document.querySelector(".menu-full").classList.toggle("menu-active");
 });
 const menu = document.querySelector('.menu-full');
    if (!menu) return;

    let threshold = window.innerHeight; // 100vh
    const getY = () =>
      (window.__lenis && typeof window.__lenis.scroll === 'number')
        ? window.__lenis.scroll
        : (window.scrollY || document.documentElement.scrollTop || 0);

    const apply = () => {
      const y = getY();
      if (y >= threshold) {
        menu.classList.add('inverted');
      } else {
        menu.classList.remove('inverted');
      }
    };

    // Keep threshold in sync with viewport changes
    const onResize = () => {
      threshold = window.innerHeight;
      apply();
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Hook into Lenis if available; otherwise fall back to native scroll
    if (window.__lenis && typeof window.__lenis.on === 'function') {
      window.__lenis.on('scroll', apply);
    } else {
      window.addEventListener('scroll', apply, { passive: true });
    }

    // Run once on load
    apply();
  
})();
