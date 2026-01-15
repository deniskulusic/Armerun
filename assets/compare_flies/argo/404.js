document.querySelector(".han-menu-full").addEventListener("click", function () {
  const menu = document.querySelector(".menu-full");
  const isActive = menu.classList.toggle("menu-active");
  document.querySelector(".menu-bg").classList.toggle("menu-active-bg");
});