import { apiGet, apiPost, apiDelete, bootstrapUserId } from "./api.js";

/** Đánh dấu nav có `data-nav="<key>"`. */
export function setActiveNav(key) {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.classList.toggle("active", el.dataset.nav === key);
  });
}

export function setStatus(message, kind) {
  const el = document.querySelector("[data-status]");
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("text-error", "text-success");
  if (kind === "error") el.classList.add("text-error");
  if (kind === "success") el.classList.add("text-success");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPriceVnd(n) {
  try {
    return `${Number(n).toLocaleString("vi-VN")}đ/h`;
  } catch {
    return `${n}đ/h`;
  }
}

function companionCard(c, favoriteIds) {
  const isFav = favoriteIds.has(c.id);
  const online = c.online
    ? `<span class="companion-card__badge companion-card__badge--online">🟢 Online</span>`
    : "";
  const tags = (c.tags || []).map((t) => `<span class="companion-tag">${escapeHtml(t)}</span>`).join("");
  const reviews = c.reviewCount != null ? ` (${c.reviewCount})` : "";
  return `
    <article class="companion-card" role="listitem" data-companion-id="${escapeHtml(c.id)}">
      <div class="companion-card__media">
        <span class="companion-card__avatar" aria-hidden="true">${c.avatar || "👤"}</span>
        ${online}
        <button type="button" class="companion-card__fav js-fav" aria-label="${isFav ? "Bỏ yêu thích" : "Thêm yêu thích"}" aria-pressed="${isFav}">${isFav ? "❤️" : "🤍"}</button>
      </div>
      <div class="companion-card__body">
        <h2 class="companion-card__name">${escapeHtml(c.name)}</h2>
        <p class="companion-card__loc">📍 ${escapeHtml(c.location || "")}</p>
        <div class="companion-card__tags">${tags}</div>
        <div class="companion-card__meta">
          <span class="companion-card__rating"><span aria-hidden="true">⭐</span> ${c.rating ?? "—"}${reviews}</span>
          <span class="companion-card__price">${formatPriceVnd(c.pricePerHour ?? 0)}</span>
        </div>
        <p class="companion-card__book-wrap">
          <a class="companion-card__book" href="/pages/booking.html?companion=${encodeURIComponent(c.id)}&name=${encodeURIComponent(c.name)}">📅 Đặt lịch</a>
        </p>
      </div>
    </article>
  `;
}

async function loadFavoriteIds() {
  try {
    await bootstrapUserId();
    const data = await apiGet("/api/favorites");
    const favs = data.favorites || [];
    return new Set(favs.map((f) => f.companionId || f.id).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function refreshHome() {
  const grid = document.querySelector(".discover-grid");
  const countEl = document.querySelector(".discover-toolbar__count strong");
  if (!grid) return;

  const [{ companions }, favoriteIds] = await Promise.all([
    apiGet("/api/home/featured"),
    loadFavoriteIds(),
  ]);

  const list = Array.isArray(companions) ? companions : [];
  grid.innerHTML =
    list.length > 0
      ? list.map((c) => companionCard(c, favoriteIds)).join("")
      : `<p class="muted discover-grid__empty">Chưa có bạn đồng hành để hiển thị.</p>`;
  grid.setAttribute("aria-busy", "false");
  if (countEl) countEl.textContent = String(list.length);

  grid.querySelectorAll(".js-fav").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest("[data-companion-id]");
      const id = card?.dataset.companionId;
      if (!id) return;
      const pressed = btn.getAttribute("aria-pressed") === "true";
      try {
        await bootstrapUserId();
        if (pressed) {
          await apiDelete(`/api/favorites/${encodeURIComponent(id)}`);
        } else {
          await apiPost("/api/favorites", { companionId: id });
        }
        const next = await loadFavoriteIds();
        const isFav = next.has(id);
        btn.setAttribute("aria-pressed", String(isFav));
        btn.setAttribute("aria-label", isFav ? "Bỏ yêu thích" : "Thêm yêu thích");
        btn.textContent = isFav ? "❤️" : "🤍";
      } catch (e) {
        console.warn(e);
      }
    });
  });
}

if (document.body.classList.contains("page-discover")) {
  refreshHome().catch((e) => console.warn("Không tải trang chủ:", e));
}
