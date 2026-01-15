(function () {
    /* =========================================
       LENIS SETUP
       ========================================= */
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lerp: 0.1,
        smoothWheel: true,
        smoothTouch: false, // Keep false for mobile performance
        autoRaf: true,
    });

    // Make Lenis global for scroll access in other functions
    window.__lenis = lenis;

    // Menu logic
    const menuFull = document.querySelector(".menu-full");
    document.querySelector(".han-menu-full").addEventListener("click", function () {
        menuFull.classList.toggle("menu-active");
    });

    // Invert menu on scroll
    lenis.on('scroll', ({ scroll }) => {
        if (scroll > 2 * window.innerHeight - 100) {
            menuFull.classList.add("inverted");
        } else {
            menuFull.classList.remove("inverted");
        }
    });

    /* =========================================
       HERO ANIMATION LOGIC (Optimized)
       ========================================= */
    const heroSection = document.querySelector('.about-hero-section');
    const centerEl = document.querySelector('.ah-center');
    const leftEl = document.querySelector('.ah-left');
    const rightEl = document.querySelector('.ah-right');
    const tintEl = document.querySelector('.ah-center-overlay-tint');

    let heroH = 0;
    let winH = window.innerHeight;

    function updateMetrics() {
        if (heroSection) heroH = heroSection.offsetHeight;
        winH = window.innerHeight;
    }
    updateMetrics();
    window.addEventListener('resize', updateMetrics);

    function updateHero() {
        if (!heroSection) return;

        const scrollY = window.__lenis.scroll || window.scrollY;
        const maxScroll = heroH - winH;

        if (maxScroll <= 0) return;

        const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

        // 1. Center Image Expansion
        if (centerEl) {
            // Using logic from previous script
            const startW = 25; const endW = 100;
            const startH = 70; const endH = 100;

            const currentW = startW + (endW - startW) * progress;
            const currentH = startH + (endH - startH) * progress;

            centerEl.style.width = `${currentW}vw`;
            centerEl.style.height = `${currentH}vh`;
        }

        // 2. Side Images Exit (Use translate3d for GPU)
        const movePercent = 100 * progress;
        if (leftEl) leftEl.style.transform = `translate3d(-${movePercent}%, -50%, 0)`;
        if (rightEl) rightEl.style.transform = `translate3d(${movePercent}%, -50%, 0)`;

        // 3. Tint Overlay
        if (tintEl) tintEl.style.opacity = 0.4 * progress;
    }

    // Bind Hero update to raf
    lenis.on('scroll', updateHero);

    /* =========================================
       TEXT REVEAL / SPLIT LOGIC
       ========================================= */
    function splitChars(selector) {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset.splitted) return; // Prevent double split
            el.dataset.splitted = "true";

            const words = el.innerText.trim().split(/\s+/);
            let output = "";
            words.forEach((word, wIndex) => {
                output += `<span class="split-word" style="display:inline-block;">`;
                word.split("").forEach((char, cIndex) => {
                    output += `<span class="split-char" style="opacity: 0; transition: opacity 0.5s;">${char}</span>`;
                });
                output += `</span> `;
            });
            el.innerHTML = output.trimEnd();
        });
    }

    splitChars(".s-a-p-3-img-text-el-1");
    splitChars(".hl-col-center h2");

    // Hero H1
    const heroH1 = document.querySelector(".ah-overlay h1");
    if (heroH1) {
        splitChars(".ah-overlay h1");
        setTimeout(() => animateTitle(heroH1), 100);
    }

    function animateTitle(el) {
        const chars = el.querySelectorAll(".split-char");
        chars.forEach((char, i) => {
            const delay = i * 25;
            setTimeout(() => { char.style.opacity = 1; }, delay);
        });
    }

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

    // HS Header H2 SPLIT
    const hsH2 = document.querySelector(".hs-header h2");
    if (hsH2) {
        splitChars(".hs-header h2");
        titleObserver.observe(hsH2);
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.reveal-text').forEach(el => revealObserver.observe(el));

    /* =========================================
       HIGHLIGHTS PARALLAX LOGIC (Highly Optimized)
       ========================================= */
    const parallaxGroups = [
        { wrapper: ".highlights-section", elements: ".hl-col-left .hl-img-wrapper", factor: 0.1 },
        { wrapper: ".highlights-section", elements: ".hl-col-right .hl-img-wrapper", factor: -0.15 },
        { wrapper: ".s-a-p-2", elements: ".s-a-p-2-img-2", factor: 0.1 },
        { wrapper: ".s-a-p-3", elements: ".s-a-p-3-img-2", factor: 0.1 },
        // New ScaleTranslate for Hover Slider Default BG
        {
            wrapper: ".hover-slider-section",
            elements: ".hs-bg-layer[data-bg='default'] img",
            mode: "scaleTranslate",
            initialScale: 1.15,
            translateRange: 200
        }
    ];

    function initParallax() {
        const scroll = window.scrollY || document.documentElement.scrollTop;
        parallaxGroups.forEach(g => {
            g.wrapperEl = document.querySelector(g.wrapper);
            if (g.wrapperEl) {
                g.elementsEl = document.querySelectorAll(g.elements);
                const rect = g.wrapperEl.getBoundingClientRect();

                // Cache metrics relative to document top
                g.offsetTop = rect.top + scroll;
                g.offsetHeight = g.wrapperEl.offsetHeight;

                // Optimization: Promote to GPU layer
                g.elementsEl.forEach(el => el.style.willChange = 'transform');
            }
        });
    }

    // Recalculate on resize
    window.addEventListener('resize', initParallax);
    // Init after a small delay to ensure layout is done
    setTimeout(initParallax, 100);

    function clamp2(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function updateParallax() {
        if (!window.__lenis) return;
        const scroll = window.__lenis.scroll;
        const wh = window.innerHeight;

        parallaxGroups.forEach(g => {
            if (!g.wrapperEl) return;

            // Math only visibility check
            const rectTop = g.offsetTop - scroll;
            const rectBottom = rectTop + g.offsetHeight;

            // Only animate if in viewport (with buffer)
            if (rectBottom > -100 && rectTop < wh + 100) {

                /* -----------------------------------------
                   MODE 1: EXISTING PARALLAX (translate only)
                ----------------------------------------- */
                if (!g.mode || g.mode === 'parallax') {
                    const distance = rectTop;
                    const val = distance * g.factor;
                    g.elementsEl.forEach(el => {
                        el.style.transform = `translate3d(0, ${val}px, 0)`;
                    });
                    return;
                }

                /* -----------------------------------------
                   MODE 2: SCALE + TRANSLATE ANIMATION
                ----------------------------------------- */
                if (g.mode === 'scaleTranslate') {
                    const it = {
                        top: g.offsetTop,
                        height: g.offsetHeight,
                        scale: g.initialScale || 1.15,
                        extra: g.translateRange || 200
                    };

                    const distanceFromTop = it.top - scroll;
                    const totalDistance = wh + it.height;
                    const distanceCovered = wh - distanceFromTop;

                    const percent = clamp2(distanceCovered / totalDistance, 0, 1);

                    const currentScale = it.scale - ((it.scale - 1) * percent);
                    const translateY = -(it.extra / 2) + (it.extra * percent);

                    g.elementsEl.forEach(el => {
                        el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${currentScale})`;
                    });
                }
            }
        });
    }

    lenis.on('scroll', updateParallax);

    /* =========================================
       HOVER SLIDER LOGIC & MENU HIDE
       ========================================= */
    const hsSection = document.querySelector('.hover-slider-section');
    if (hsSection) {
        const links = hsSection.querySelectorAll('.hs-link');
        const bgs = hsSection.querySelectorAll('.hs-bg-layer');

        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const target = link.dataset.target;
                bgs.forEach(bg => bg.classList.remove('active'));
                const targetBg = hsSection.querySelector(`.hs-bg-layer[data-bg="${target}"]`);
                if (targetBg) targetBg.classList.add('active');
            });

            link.addEventListener('mouseleave', () => {
                bgs.forEach(bg => bg.classList.remove('active'));
                const defaultBg = hsSection.querySelector('.hs-bg-layer[data-bg="default"]');
                if (defaultBg) defaultBg.classList.add('active');
            });
        });

        // Menu Hiding Logic
        // Hide menu when the top of the viewport is INSIDE the hover slider section
        lenis.on('scroll', ({ scroll }) => {
            const rect = hsSection.getBoundingClientRect();
            // rect.top is relative to viewport. 
            // If rect.top <= 0, the top of the section has passed the top of the viewport
            // If rect.bottom > 0, the bottom is still below the top of viewport

            // Refined requirement: "dissapears when the top of the window inside of the page"
            // Interpreted as: When viewport is within the section.

            // Adjust offsets as needed. Let's say we hide it as soon as we enter
            const top = hsSection.offsetTop - 85;
            const height = hsSection.offsetHeight;

            if (scroll >= top && scroll < top + height) {
                document.body.classList.add('menu-hidden');
            } else {
                document.body.classList.remove('menu-hidden');
            }
        });
    }

    /* =========================================
       FLOATING OVERVIEW BAR (Optimized)
       ========================================= */
    const fob = document.querySelector('.floating-overviewbar');
    const fobLinksContainer = document.querySelector('.fob-links');
    const stickySections = document.querySelectorAll('[data-sticky]');
    const footer = document.querySelector('.site-footer');

    // Metrics
    let footerTop = Infinity;
    let fobHeight = 0;

    function updateFobMetrics() {
        if (footer) footerTop = footer.offsetTop;
        if (fob) fobHeight = fob.offsetHeight;
    }
    window.addEventListener('resize', updateFobMetrics);
    setTimeout(updateFobMetrics, 500);

    if (fob && fobLinksContainer && stickySections.length > 0) {
        // 1. Generate Links
        stickySections.forEach(section => {
            const label = section.getAttribute('data-sticky');
            if (label) {
                const link = document.createElement('a');
                link.className = 'fob-link';
                link.innerText = label;
                link.dataset.targetId = label;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    lenis.scrollTo(section, { offset: -50 });
                });
                fobLinksContainer.appendChild(link);
            }
        });

        // 2. Observer for Active Section (Replaces Scroll Loop Calculation)
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-sticky');
                    // Update active class
                    document.querySelectorAll('.fob-link').forEach(l => {
                        l.classList.toggle('active', l.dataset.targetId === id);
                    });
                }
            });
        }, {
            rootMargin: "-40% 0px -40% 0px", // Middle of screen
            threshold: 0
        });

        stickySections.forEach(sec => sectionObserver.observe(sec));

        // 3. Simple Visibility Toggle
        lenis.on('scroll', ({ scroll }) => {
            const pastHero = scroll > winH + fobHeight;
            const beforeFooter = (scroll + winH) < footerTop;

            if (pastHero && beforeFooter) {
                fob.classList.add('is-visible');
                fob.classList.remove('hide-bar');
            } else {
                fob.classList.remove('is-visible');
                // Only hide if we aren't at footer (prevents flicker at bottom)
                if (!beforeFooter) fob.classList.remove('hide-bar');
                else fob.classList.add('hide-bar');
            }
        });
    }

    /* =========================================
       DUAL ROW INFINITE SLIDER + CURSOR
       ========================================= */
    const cursor = document.createElement('div');
    cursor.className = 'drag-cursor';
    cursor.innerHTML = `<span class="label">DRAG</span>`;
    document.body.appendChild(cursor);

    let cursorX = 0, cursorY = 0;
    let targetX = 0, targetY = 0;

    function lerp(start, end, t) { return start * (1 - t) + end * t; }

    function moveCursor() {
        cursorX = lerp(cursorX, targetX, 0.15);
        cursorY = lerp(cursorY, targetY, 0.15);
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        requestAnimationFrame(moveCursor);
    }
    moveCursor();

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    const sliderSection = document.querySelector('.dual-slider-container');
    if (sliderSection) {
        sliderSection.addEventListener('mouseenter', () => cursor.classList.add('show'));
        sliderSection.addEventListener('mouseleave', () => cursor.classList.remove('show'));

        document.querySelectorAll('.ds-row').forEach(row => {
            const track = row.querySelector('.ds-track');
            const speed = parseFloat(row.dataset.speed || 1);
            const direction = parseFloat(row.dataset.direction || 1);

            // Clone content just once or twice based on need, not 4x blindly
            // Assuming sufficient items for 2 clones to fill wide screens
            const originalContent = track.innerHTML;
            track.innerHTML = originalContent + originalContent + originalContent;

            let x = 0;
            let isDragging = false;
            let startX = 0;
            let startXVal = 0;
            let lastDragX = 0;

            function animate() {
                if (!isDragging) {
                    x += speed * direction;
                }

                // Wrap logic
                const totalW = track.scrollWidth;
                const thirdW = totalW / 3; // Based on 3 copies

                if (direction === -1) {
                    if (x <= -thirdW) x += thirdW;
                    if (x > 0) x -= thirdW;
                } else {
                    if (x >= 0) x -= thirdW;
                    if (x < -thirdW) x += thirdW;
                }

                track.style.transform = `translate3d(${x}px, 0, 0)`;
                requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);

            // Pointer Events
            row.addEventListener('pointerdown', (e) => {
                isDragging = true;
                row.dataset.isDragging = 'false';
                startX = e.clientX;
                startXVal = x;
                lastDragX = e.clientX;
                row.setPointerCapture(e.pointerId);
                cursor.classList.add('cursor-mode-drag');
                cursor.querySelector('.label').textContent = "GRAB";
                cursor.style.transform = "translate(-50%, -50%) scale(0.9)";
            });

            row.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                const diff = e.clientX - startX;
                if (Math.abs(diff) > 5) row.dataset.isDragging = 'true';
                x = startXVal + diff;
                lastDragX = e.clientX;
            });

            const stopDrag = (e) => {
                if (!isDragging) return;
                isDragging = false;
                row.releasePointerCapture(e.pointerId);

                if (row.dataset.isDragging !== 'true') {
                    const item = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ds-item');
                    if (item) {
                        const img = item.querySelector('img');
                        if (img) {
                            window.dispatchEvent(new CustomEvent('gallery-request', { detail: { src: img.getAttribute('src') } }));
                        }
                    }
                }
                cursor.classList.remove('cursor-mode-drag');
                cursor.querySelector('.label').textContent = "DRAG";
                cursor.style.transform = "";
            };

            row.addEventListener('pointerup', stopDrag);
            row.addEventListener('pointerleave', stopDrag);
        });
    }

    /* =========================================
       LIGHTBOX (Same as before)
       ========================================= */
    const lightbox = document.getElementById('galleryLightbox');
    if (lightbox && sliderSection) {
        const lbMainImg = document.getElementById('lbMainImage');
        const lbCounter = document.getElementById('lbCounter');
        const lbThumbnails = document.getElementById('lbThumbnails');
        const btnClose = document.getElementById('lbClose');
        const btnPrev = document.getElementById('lbPrev');
        const btnNext = document.getElementById('lbNext');

        let galleryImages = [];
        let currentIndex = 0;

        const collectImages = () => {
            const seen = new Set();
            const images = [];
            document.querySelectorAll('.ds-item img').forEach(img => {
                const src = img.getAttribute('src');
                if (!seen.has(src)) {
                    seen.add(src);
                    images.push({ src: src });
                }
            });
            return images;
        };

        const populateThumbnails = () => {
            lbThumbnails.innerHTML = '';
            galleryImages.forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = img.src;
                thumb.className = 'lb-thumb';
                thumb.dataset.index = index;
                thumb.addEventListener('click', () => {
                    currentIndex = index;
                    updateLightbox();
                });
                lbThumbnails.appendChild(thumb);
            });
        };

        const updateLightbox = () => {
            if (!galleryImages.length) return;

            // Update Main Image
            lbMainImg.style.opacity = 0;
            setTimeout(() => {
                lbMainImg.src = galleryImages[currentIndex].src;
                lbMainImg.style.opacity = 1;
            }, 100);

            // Update Counter
            lbCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;

            // Update Thumbnails
            const thumbs = lbThumbnails.querySelectorAll('.lb-thumb');
            thumbs.forEach((t, i) => {
                if (i === currentIndex) {
                    t.classList.add('active');
                    t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                } else {
                    t.classList.remove('active');
                }
            });
        };

        const openGallery = (index) => {
            if (!galleryImages.length) {
                galleryImages = collectImages();
                populateThumbnails();
            }
            currentIndex = index;
            updateLightbox();
            lightbox.classList.add('visible');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const closeGallery = () => {
            lightbox.classList.remove('visible');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        btnClose.addEventListener('click', closeGallery);
        btnNext.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % galleryImages.length;
            updateLightbox();
        });
        btnPrev.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
            updateLightbox();
        });

        window.addEventListener('gallery-request', (e) => {
            if (!galleryImages.length) {
                galleryImages = collectImages();
                populateThumbnails();
            }
            const idx = galleryImages.findIndex(img => img.src === e.detail.src);
            if (idx !== -1) openGallery(idx);
        });
    }

    /* =========================================
       FAQ
       ========================================= */
    const faqHeaders = document.querySelectorAll('.faq-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const body = item.querySelector('.faq-body');
            const isOpen = item.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(other => {
                if (other !== item) {
                    other.classList.remove('active');
                    other.querySelector('.faq-body').style.maxHeight = '0';
                }
            });

            if (isOpen) {
                item.classList.remove('active');
                body.style.maxHeight = '0';
            } else {
                item.classList.add('active');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });

})();