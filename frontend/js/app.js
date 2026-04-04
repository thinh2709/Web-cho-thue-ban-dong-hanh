export function setActiveNav(active) {
  const links = document.querySelectorAll("[data-nav]");
  links.forEach((a) => {
    a.dataset.active = a.dataset.nav === active ? "true" : "false";
  });
}

export function setStatus(message, type = "info") {
  const el = document.querySelector("[data-status]");
  if (!el) return;
  el.textContent = message;
  el.style.opacity = message ? "1" : "0";
  el.dataset.type = type;
}
