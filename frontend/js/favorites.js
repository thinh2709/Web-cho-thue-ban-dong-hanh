import { apiGet, apiDelete, bootstrapUserId } from "./api.js";

function renderEmpty(show, count = 0) {
  const empty = document.getElementById("favoritesEmpty");
  const subtitle = document.getElementById("favoritesSubtitle");
  if (empty) empty.hidden = !show;
  if (subtitle) {
    if (show) subtitle.textContent = "Chưa có bạn đồng hành nào trong danh sách yêu thích.";
    else subtitle.textContent = `Bạn có ${count} bạn đồng hành yêu thích`;
  }
}

function formatPrice(pricePerHour) {
  try {
    return `${Number(pricePerHour).toLocaleString("vi-VN")}đ/h`;
  } catch {
    return `${pricePerHour}đ/h`;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createRow(item, onRemove) {
  const card = document.createElement("div");
  card.className = "f-card";

  const companionId = item.companionId || item.id;
  const location = item.location || "—";
  const name = item.name || `Bạn đồng hành ${companionId}`;
  const tags = (item.tags || ["Du lịch", "Ẩm thực"])
    .slice(0, 3)
    .map((t) => `<span class="f-tag">${escapeHtml(t)}</span>`)
    .join("");

  card.innerHTML = `
    <div class="f-card-header" style="background: rgba(139, 92, 246, 0.9);">
      <div class="f-actions-top">
        <span class="badge-online">${item.online ? "Online" : "Offline"}</span>
        <button type="button" class="f-fav-icon" title="Bỏ yêu thích" aria-label="Bỏ yêu thích">❤️</button>
      </div>
      <div class="f-avatar" style="font-size: 60px;">${item.avatar || "👤"}</div>
    </div>
    <div class="f-card-body" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2);">
      <h3 class="f-name">${escapeHtml(name)}</h3>
      <div class="f-location" style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">📍 ${escapeHtml(location)}</div>
      <div class="f-tags" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">${tags}</div>
      <div class="f-footer" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="f-rating">⭐ ${item.rating ?? "—"}</div>
        <div class="f-price" style="font-weight: 600;">${formatPrice(item.pricePerHour || 500000)}</div>
      </div>
      <a class="f-btn-book" href="/pages/booking.html?companion=${encodeURIComponent(companionId)}&name=${encodeURIComponent(name)}" style="background: rgba(139, 92, 246, 0.9); color: white; width: 100%; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;">📅 Đặt lịch</a>
    </div>
  `;

  const favBtn = card.querySelector(".f-fav-icon");
  favBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    onRemove(companionId);
  });

  return card;
}

async function loadFavorites() {
  const status = document.getElementById("favoritesStatus");
  const list = document.getElementById("favoritesList");
  if (!status || !list) return;

  status.hidden = false;
  status.textContent = "Đang tải…";
  status.classList.remove("form-message--error");
  list.innerHTML = "";
  renderEmpty(false);

  try {
    await bootstrapUserId();
    const data = await apiGet("/api/favorites");
    const items = data.favorites || [];
    if (items.length === 0) {
      status.hidden = true;
      status.textContent = "";
      renderEmpty(true);
      return;
    }

    renderEmpty(false, items.length);

    async function remove(companionId) {
      try {
        await apiDelete(`/api/favorites/${encodeURIComponent(companionId)}`);
        await loadFavorites();
      } catch (e) {
        alert(e.message || String(e));
      }
    }

    for (const item of items) list.appendChild(createRow(item, remove));
    status.hidden = true;
    status.textContent = "";
  } catch (e) {
    status.hidden = false;
    status.textContent = e.message || "Lỗi tải dữ liệu";
    status.classList.add("form-message--error");
  }
}

loadFavorites();
