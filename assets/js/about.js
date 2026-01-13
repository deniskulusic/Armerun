(function () {
    /* =========================================
       LENIS SETUP (Copied from index.js)
       ========================================= */
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lerp: 0.1,
        smoothWheel: true,
        smoothTouch: false,
        autoRaf: true,
    });

    // Menu logic
    document.querySelector(".han-menu-full").addEventListener("click", function () {
        const menu = document.querySelector(".menu-full");
        menu.classList.toggle("menu-active");
    });

    // Invert menu on scroll (Basic version)
    lenis.on('scroll', ({ scroll }) => {
        if (scroll > 2 * window.innerHeight - 100) {
            document.querySelector(".menu-full").classList.add("inverted");
        } else {
            document.querySelector(".menu-full").classList.remove("inverted");
        }
    });

    /* =========================================
       HERO ANIMATION LOGIC
       ========================================= */
    const heroSection = document.querySelector('.about-hero-section');
    const centerEl = document.querySelector('.ah-center');
    const leftEl = document.querySelector('.ah-left');
    const rightEl = document.querySelector('.ah-right');
    const heroOverlay = document.querySelector('.ah-overlay');

    // Config
    // Config
    const heroScrollHeight = window.innerHeight; // match css var--hero-scroll-height (100vh)
    const tintEl = document.querySelector('.ah-center-overlay-tint');

    function updateHero() {
        if (!heroSection) return;

        const scrollY = (window.__lenis && typeof window.__lenis.scroll === 'number')
            ? window.__lenis.scroll
            : window.scrollY;

        // Progress 0 to 1 over the duration of the hero pin
        // Note: The section is height 300vh total (100vh + 200vh scroll)
        // It pins for the scroll height.

        // Calculate progress based on scroll distance relative to the section start
        // Since it's at the top (top:0), we can just use scrollY
        // Or cleaner: progress = scrollY / (totalHeight - viewportHeight)
        // section height = 100vh visible + 200vh scrollable
        const maxScroll = heroSection.offsetHeight - window.innerHeight;
        const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

        // 1. Center Image Expansion
        // Start: 30vw width, 60vh height
        // End: 100vw width, 100vh height
        const startW = 25; // vw
        const endW = 100;
        const startH = 70; // vh
        const endH = 100;

        const currentW = startW + (endW - startW) * progress;
        const currentH = startH + (endH - startH) * progress;

        if (centerEl) {
            centerEl.style.width = `${currentW}vw`;
            centerEl.style.height = `${currentH}vh`;

            // Remove border radius or similar if added later
        }

        // 2. Side Images Exit
        // Move them outwards offscreen (100% of their own width)
        const movePercent = 100 * progress;

        if (leftEl) {
            // Left image: moves left (-100%)
            leftEl.style.transform = `translateY(-50%) translateX(-${movePercent}%)`;
        }
        if (rightEl) {
            // Right image: moves right (+100%)
            rightEl.style.transform = `translateY(-50%) translateX(${movePercent}%)`;
        }

        // 3. Tint Overlay Opacity (0 to 0.4)
        if (tintEl) {
            tintEl.style.opacity = 0.4 * progress;
        }
    }

    // Loop
    function raf(time) {
        lenis.raf(time);
        updateHero();
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    /* =========================================
       TEXT REVEAL / SPLIT LOGIC (Ported from index.js)
       ========================================= */

    // 1. Split Chars Helper
    function splitChars(selector) {
        document.querySelectorAll(selector).forEach(el => {
            const words = el.innerText.trim().split(/\s+/);
            let output = "";
            words.forEach((word, wIndex) => {
                output += `<span class="split-word" data-word="${wIndex}">`;
                word.split("").forEach((char, cIndex) => {
                    output += `<span class="split-char" data-char-index="${cIndex}" style="opacity: 0; transition: opacity 0.5s;">${char}</span>`;
                });
                output += `</span> `;
            });
            el.innerHTML = output.trimEnd();
        });
    }

    // Apply to target class
    // Apply to target class
    // Apply to target class
    splitChars(".s-a-p-3-img-text-el-1");
    // Apply to Highlights Section Heading
    splitChars(".hl-col-center h2");

    // Apply to Hero Overlay H1 (Page Load)
    const heroH1 = document.querySelector(".ah-overlay h1");
    if (heroH1) {
        splitChars(".ah-overlay h1");
        // Trigger animation immediately after split/layout
        // Use slight timeout to ensure split layout is ready
        setTimeout(() => {
            animateTitle(heroH1);
        }, 100);
    }

    // 2. Animate Title (Character stagger)
    function animateTitle(el) {
        const chars = el.querySelectorAll(".split-char");
        chars.forEach((char, i) => {
            const delay = i * 25; // slightly slower stagger than index.js 15ms
            setTimeout(() => { char.style.opacity = 1; }, delay);
        });
    }

    // 3. Observer for Split Titles
    const titleObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTitle(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll(".s-a-p-3-img-text-el-1").forEach(el => titleObserver.observe(el));
    document.querySelectorAll(".hl-col-center h2").forEach(el => titleObserver.observe(el));


    // 4. Observer for General Reveal Text
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.reveal-text').forEach(el => revealObserver.observe(el));

    /* =========================================
       HIGHLIGHTS PARALLAX LOGIC
       ========================================= */

    // Config
    const parallaxGroups = [
        // Highlights
        { wrapper: ".highlights-section", elements: ".hl-col-left .hl-img-wrapper", factor: 0.1 },
        { wrapper: ".highlights-section", elements: ".hl-col-right .hl-img-wrapper", factor: -0.15 },
        // Argo
        { wrapper: ".s-a-p-2", elements: ".s-a-p-2-img-2", factor: 0.1 },
        { wrapper: ".s-a-p-3", elements: ".s-a-p-3-img-2", factor: 0.1 }
    ];

    // Initialize offsets
    function initParallax() {
        parallaxGroups.forEach(g => {
            g.wrapperEl = document.querySelector(g.wrapper);
            if (g.wrapperEl) {
                g.elementsEl = document.querySelectorAll(g.elements);
                // Cache initial offset top of the section to calc relative scroll
                g.offsetTop = g.wrapperEl.offsetTop;
            }
        });
    }

    // Call init
    initParallax();
    window.addEventListener('resize', initParallax);

    // Merge Transform Helper (Copied from page.js)
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

                // Save it so we don't re-compute every frame (optimization)
                if (existing) el.setAttribute("data-original-transform", existing);
            }
        }

        // Remove old translateY() defined by us
        existing = (existing || "").replace(/translateY\([^)]*\)/g, "").trim();

        // Final combine
        if (!existing || existing === "none") {
            return `translateY(${newTranslateY}px)`;
        }

        return `${existing} translateY(${newTranslateY}px)`.trim();
    }

    // Update function
    function updateParallax() {
        const scroll = (window.__lenis && typeof window.__lenis.scroll === 'number')
            ? window.__lenis.scroll
            : window.scrollY;

        const vh = window.innerHeight;

        parallaxGroups.forEach(g => {
            if (!g.wrapperEl) return;

            // Check visibility roughly
            const rect = g.wrapperEl.getBoundingClientRect();
            // If section is roughly in view (allow buffer)
            if (rect.top < vh && rect.bottom > 0) {
                // Calculate displacement based on distance from viewport top/center
                // Use (offsetTop - scroll) logic similar to index.js
                // Note: g.offsetTop is page-relative Y position of the wrapper
                const distance = (g.offsetTop - scroll);
                const val = distance * g.factor;

                g.elementsEl.forEach(el => {
                    el.style.transform = mergeTransform(el, val);
                });
            }
        });
    }

    // Hook into Lenis scroll event
    lenis.on('scroll', updateParallax);
    // Also run once
    updateParallax();

    /* =========================================
       HOVER SLIDER LOGIC
       ========================================= */
    const hsSection = document.querySelector('.hover-slider-section');
    if (hsSection) {
        const links = hsSection.querySelectorAll('.hs-link');
        const bgs = hsSection.querySelectorAll('.hs-bg-layer');

        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const target = link.dataset.target;
                // Remove active from all
                bgs.forEach(bg => bg.classList.remove('active'));
                // Add active to target
                const targetBg = hsSection.querySelector(`.hs-bg-layer[data-bg="${target}"]`);
                if (targetBg) targetBg.classList.add('active');
            });

            link.addEventListener('mouseleave', () => {
                // Revert to default
                bgs.forEach(bg => bg.classList.remove('active'));
                const defaultBg = hsSection.querySelector('.hs-bg-layer[data-bg="default"]');
                if (defaultBg) defaultBg.classList.add('active');
            });
        });
    }

})();
