(function () {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
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
        smoothTouch: false,
        // allow native scroll in nested scroll areas
        autoRaf: true,
    });

    document.querySelector('.menu-div').setAttribute('data-lenis-prevent', '')
    // Collect targets
    const textEls = Array.from(document.querySelectorAll('.reveal-text'));
    const imageEls = Array.from(document.querySelectorAll('.reveal-image'));
    const imagePageEls = Array.from(document.querySelectorAll('.reveal-image-page'));
    const targets = [...textEls, ...imageEls, ...imagePageEls];


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

    const items = Array.from(document.querySelectorAll('.s-a-a-7-holder , .s-a-a-6-bottom-left'))
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



    /* ======================================================
        INIT GLOBAL ELEMENTS
    ====================================================== */
    let WindowHeight = window.innerHeight;



    /* ======================================================
        OPEN NAVIGATION
    ====================================================== */

    // Define mobile breakpoint
    document.querySelector(".han-menu-full").addEventListener("click", function () {
        document.querySelector(".menu-full").classList.toggle("menu-active");
    });

    /* ======================================================
        HEADER AND NAV LOAD ANIMATION
    ====================================================== */
    const header = document.querySelector('header');
    const nav = document.querySelector('.menu-full');
    if (header) header.classList.add('header-loaded');
    if (nav) nav.classList.add('nav-loaded');



    /* ======================================================
        TEXT ANIMATON OPACITY INITIALIZATION
    ====================================================== */
    function splitChars(selector) {
        document.querySelectorAll(selector).forEach(el => {
            const words = el.innerText.trim().split(/\s+/);

            let output = "";

            words.forEach((word, wIndex) => {
                output += `<span class="split-word" data-word="${wIndex}">`;

                word.split("").forEach((char, cIndex) => {
                    // IMPORTANT: no line breaks, no spaces
                    output += `<span class="split-char" data-char-index="${cIndex}">${char}</span>`;
                });

                output += `</span> `;  // single real space between words
            });

            el.innerHTML = output.trimEnd();
        });
    }
    splitChars(".split-chars, .s-a-p-3-img-text-el-1");
    const animatedTexts = [...document.querySelectorAll(".split-chars")];



    /* ======================================================
   ONCE-ONLY FADE IN FOR .s-a-p-3-img-text-el-1
====================================================== */

    const titleEls = document.querySelectorAll(".s-a-p-3-img-text-el-1");

    // Track which elements already animated
    const animatedSet = new WeakSet();

    const titleObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animatedSet.has(entry.target)) {
                animatedSet.add(entry.target);
                animateTitle(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.3,     // trigger once about 30% on screen
        rootMargin: "0px 0px -10% 0px"
    });

    titleEls.forEach(el => titleObserver.observe(el));


    // Animate letters
    function animateTitle(el) {
        const chars = el.querySelectorAll(".split-char");

        chars.forEach((char, i) => {
            const delay = i * 15; // ms per letter fade-in

            setTimeout(() => {
                char.style.opacity = 1;
            }, delay);
        });
    }

    /* ======================================================
       ANIMATING ELEMENTS LOGIC INITIALIZATION
    ====================================================== */
    // 1. CONFIG: Add all parallax groups here
    const parallaxGroups = [
        {
            wrapper: ".s-a-p-2",
            elements: ".s-a-p-2-img-2",
            factors: [0.1],
            mode: "parallax", // old behavior
        },
        {
            wrapper: ".s-a-p-3",
            elements: ".s-a-p-3-img-2",
            factors: [0.1],
            mode: "parallax", // old behavior
        },
        {
            wrapper: ".s-a-p-4",
            elements: ".s-a-p-4-img-2 , .s-a-p-4-img-3",
            factors: [0.07, 0.085],
            mode: "parallax"
        },
        {
            wrapper: ".s-a-p-5-left-img",
            elements: ".s-a-p-5-left-img img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.1,
            translateRange: 200
        },
        {
            wrapper: ".s-a-p-5-right-img",
            elements: ".s-a-p-5-right-img img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.15,
            translateRange: 250
        },
        {
            wrapper: ".s-a-a-6-bottom-left",
            elements: ".s-a-a-6-bottom-left-holder-1 img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.15,
            translateRange: 250
        },
        {
            wrapper: ".s-a-a-6",
            elements: ".s-a-a-6-bottom-left-holder-2 img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.15,
            translateRange: 250
        },
        {
            wrapper: ".s-a-p-7",
            elements: ".s-a-p-7-img img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.2,
            translateRange: 300
        },
        {
            wrapper: ".s-a-p-3",
            elements: ".s-a-p-3-img-1-holder img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.2,
            translateRange: 300
        },
        {
            wrapper: ".s-a-p-2",
            elements: ".s-a-p-2-img-1-holder img",
            factors: [0.1],
            mode: "scaleTranslate", // NEW animation
            initialScale: 1.1,
            translateRange: 250
        },
        {
            wrapper: ".s-a-a-6",
            elements: ".s-a-p-6-img-2",
            factors: [0.3, 0.3, 0.3],
            mode: "parallax"
        },

    ];


    /* ======================================================
       RESPONSIVE SCALING
    ====================================================== */
    function getResponsiveScale() {
        const maxW = 1920;
        const minW = 850;

        if (window.innerWidth >= maxW) return 1;
        if (window.innerWidth <= minW) return 0.5;

        const pct = (window.innerWidth - minW) / (maxW - minW);
        return 0.5 + (pct * 0.5);
    }

    let responsiveScale = getResponsiveScale();
    window.addEventListener("resize", () => {
        responsiveScale = getResponsiveScale();
    });


    /* ======================================================
       SETUP
    ====================================================== */
    parallaxGroups.forEach(g => {
        g.wrapperEl = document.querySelector(g.wrapper);
        g.elementsEl = document.querySelectorAll(g.elements);
        g.offsetTop = window.pageYOffset + g.wrapperEl.getBoundingClientRect().top;
    });

    window.addEventListener("resize", () => {
        parallaxGroups.forEach(g => {
            g.offsetTop = window.pageYOffset + g.wrapperEl.getBoundingClientRect().top;
        });
    });


    /* ======================================================
       TRANSFORM MERGING
    ====================================================== */
    function mergeTransform(el, newTranslateY) {
        let existing = el.style.transform;

        // If no inline transform, read “transform” from CSS rules (NOT the computed matrix)
        if (!existing) {
            existing = el.getAttribute("data-original-transform");
            if (!existing) {
                // Extract raw CSS transform using computed style *but keep the string before conversion*
                const style = el.getAttribute("style") || "";
                const cssTransform = style.match(/transform:\s*([^;]+)/);

                if (cssTransform) {
                    existing = cssTransform[1].trim();
                } else {
                    // LAST RESORT: use computed transform ONLY if not "none"
                    const computed = window.getComputedStyle(el).transform;
                    existing = computed === "none" ? "" : computed;
                }
            }
        }

        // Remove old translateY()
        existing = (existing || "").replace(/translateY\([^)]*\)/g, "").trim();

        // Final combine
        if (!existing || existing === "none") {
            return `translateY(${newTranslateY}px)`;
        }

        return `${existing} translateY(${newTranslateY}px)`.trim();
    }


    /* ======================================================
       EXTRA: CLAMP FUNCTION
    ====================================================== */
    function clamp2(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }


    /* ======================================================
       SCROLL TRIGGER
    ====================================================== */
    lenis.on('scroll', ({ scroll }) => {

        /* ======================================================
            INVERT MENU
        ====================================================== */
        if (scroll > WindowHeight - 100) {
            document.querySelector(".menu-full").classList.add("menu-filled")
            document.querySelector(".menu-full").classList.add("inverted")
        } else {
            document.querySelector(".menu-full").classList.remove("menu-filled")
            document.querySelector(".menu-full").classList.remove("inverted")
        }


        /* ======================================================
            HEADER PARALAX
        ====================================================== */
        document.querySelectorAll('[data-lenis-speed]').forEach((el) => {
            const speed = parseFloat(el.dataset.lenisSpeed) || 0;
            if (scroll < 1.5 * WindowHeight)
                el.style.transform = `translate3d(0, ${scroll * speed * 0.1}px, 0)`;
        });


        /* ======================================================
            ANIMATING ELEMENTS LOGIC TRIGGER
        ====================================================== */
        const vh = window.innerHeight;

        parallaxGroups.forEach(g => {
            const rect = g.wrapperEl.getBoundingClientRect();

            // Visibility check
            if (rect.top - 1.5 * WindowHeight < 0 &&
                rect.top + g.wrapperEl.clientHeight + 0.5 * WindowHeight > 0) {

                g.elementsEl.forEach((el, i) => {

                    const factor = g.factors[i];
                    if (factor === undefined) return;

                    /* -----------------------------------------
                        MODE 1: OLD PARALLAX (translate only)
                    ----------------------------------------- */
                    if (g.mode === "parallax") {
                        const val = factor * responsiveScale * (g.offsetTop - scroll);
                        el.style.transform = mergeTransform(el, val);
                        return;
                    }

                    /* -----------------------------------------
                        MODE 2: NEW SCALE + TRANSLATE ANIMATION
                    ----------------------------------------- */
                    if (g.mode === "scaleTranslate") {

                        const it = {
                            img: el,
                            top: g.offsetTop,
                            height: g.wrapperEl.clientHeight,
                            scale: g.initialScale || 1.2,
                            extra: g.translateRange || 300
                        };

                        const distanceFromTop = it.top - scroll;
                        const totalDistance = vh + it.height;
                        const distanceCovered = vh - distanceFromTop;

                        const percent = clamp2(distanceCovered / totalDistance, 0, 1);

                        // Scale calculation remains absolute (visual fit)
                        const currentScale =
                            it.scale - ((it.scale - 1) * percent);

                        // --- MODIFIED LOGIC HERE ---
                        // We apply responsiveScale to the translation range (it.extra)
                        const scaledExtra = it.extra * responsiveScale;

                        const translateY =
                            -(scaledExtra / 2) + (scaledExtra * percent);

                        it.img.style.transform =
                            `translate3d(0, ${translateY}px, 0) scale(${currentScale})`;

                        return;
                    }

                });
            }
        });



        /* ======================================================
            TEXT ANIMATON OPACITY TRIGGER
        ====================================================== */
        animatedTexts.forEach(el => {
            const rect = el.getBoundingClientRect();

            const start = vh - vh * 0.2;
            const end = vh * 0.25;

            let progress = (rect.top - end) / (start - end);
            progress = Math.max(0, Math.min(1, 1 - progress));

            const chars = el.querySelectorAll(".split-char");
            const maxStagger = (chars.length - 1) * 0.03;

            const extendedProgress = progress * (1 + maxStagger);

            chars.forEach((char, i) => {
                const stagger = i * 0.03;
                char.style.opacity =
                    Math.max(0, Math.min(1, extendedProgress - stagger));
            });
        });

    });

    /* ======================================================
        TABS LOGIC
    ====================================================== */
    const tabs = document.querySelectorAll('.s-a-a-6-top-element');
    const contents = document.querySelectorAll('.s-a-a-6-bottom');

    // Loop through each tab to add a click event listener
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {

            // 1. Deactivate all tabs
            tabs.forEach(t => t.classList.remove('s-a-a-6-top-element-active'));

            // 2. Activate the clicked tab
            tab.classList.add('s-a-a-6-top-element-active');

            // 3. Hide all content areas
            contents.forEach(c => c.classList.remove('s-a-a-6-bottom-active'));

            // 4. Show the content area that matches the index of the clicked tab
            if (contents[index]) {
                contents[index].classList.add('s-a-a-6-bottom-active');
            }
            lenis.resize();
        });
    });


})();
