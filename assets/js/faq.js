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
        smoothTouch: false,
        autoRaf: true,
    });

    window.__lenis = lenis;

    /* =========================================
       MENU LOGIC
       ========================================= */
    const menuFull = document.querySelector(".menu-full");
    document.querySelector(".han-menu-full").addEventListener("click", function () {
        menuFull.classList.toggle("menu-active");

        if (menuFull.classList.contains("menu-active")) {
            lenis.stop();
        } else {
            lenis.start();
        }
    });


    /* =========================================
       FAQ ACCORDION LOGIC
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

            // Update Lenis scroll layout
            setTimeout(() => {
                lenis.resize();
            }, 550); // wait for transition to finish
            lenis.resize();
        });
    });

    /* =========================================
       ANIMATIONS (Text Reveal & Split Chars)
       ========================================= */

    // 1. Reveal Text Observer
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-text').forEach(el => revealObserver.observe(el));


    // 2. Split Chars Logic (Title Animation)
    function splitChars(selector) {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset.splitted) return;
            el.dataset.splitted = "true";

            const words = el.innerText.trim().split(/\s+/);
            let output = "";
            words.forEach((word) => {
                output += `<span class="split-word" style="display:inline-block;">`;
                word.split("").forEach((char) => {
                    output += `<span class="split-char" style="opacity: 0; transition: opacity 1s;">${char}</span>`;
                });
                output += `</span> `;
            });
            el.innerHTML = output.trimEnd();
        });
    }

    function animateTitle(el) {
        const chars = el.querySelectorAll(".split-char");
        chars.forEach((char, i) => {
            const delay = i * 25; // MATCHED: 25ms stagger from about.js
            setTimeout(() => { char.style.opacity = 1; }, delay);
        });
    }

    // Initialize Split on Title
    splitChars(".faq-main-title");

    // Observe Title for Animation
    const titleObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTitle(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 }); // MATCHED: 0.3 threshold from about.js

    const titleEl = document.querySelector(".faq-main-title");
    if (titleEl) titleObserver.observe(titleEl);

})();
