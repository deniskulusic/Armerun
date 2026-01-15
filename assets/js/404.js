
document.addEventListener('DOMContentLoaded', () => {
    /* =========================================
       MENU TOGGLE LOGIC
       ========================================= */
    const menuBtn = document.querySelector('.han-menu-full');
    const menuFull = document.querySelector('.menu-full');

    if (menuBtn && menuFull) {
        menuBtn.addEventListener('click', () => {
            menuFull.classList.toggle('menu-active');

            // Optional: Toggle body scroll lock if menu is full screen
            if (menuFull.classList.contains('menu-active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    /* =========================================
       SIMPLE PARALLAX or EFFECTS (Optional)
       ========================================= */
    // If we want the background to move slightly with mouse:
    const errorPage = document.querySelector('.error-page');
    const bgImg = document.querySelector('.boatnaslov img');

    if (errorPage && bgImg) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // -10 to 10
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            bgImg.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
        });

        bgImg.style.transition = 'transform 0.1s ease-out';
    }
});
