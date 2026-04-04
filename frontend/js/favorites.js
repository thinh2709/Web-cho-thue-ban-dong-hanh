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

function getAvatarEmoji(id) {
  const emojis = ['👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🎤', '👩‍🎤', '👱‍♂️', '👱‍♀️', '👨‍𱁂', '👩‍𱁂', '🧑‍🚀'];
  return emojis[typeof id === 'number' ? id % emojis.length : id.charCodeAt(0) % emojis.length];
}

function createRow(item, onRemove) {
  const card = document.createElement("div");
  card.className = "f-card";

  const companionId = item.companionId || item.id;
  const location = item.location || "Hà Nội";
  const tagsHtml = ['Du lịch', 'Ẩm thực'].map(t => `<span class="f-tag">${t}</span>`).join('');

  card.innerHTML = `
    <div class="f-card-header" style="background: rgba(139, 92, 246, 0.9);">
      <div class="f-actions-top">
        <span class="badge-online">Online</span>
        <div class="f-fav-icon" title="Bỏ yêu thích" style="background: white; border-radius: 50%; width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: black; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <i class="fa-regular fa-heart"></i>
        </div>
      </div>
      <div class="f-avatar" style="font-size: 60px;">${item.avatar || getAvatarEmoji(companionId)}</div>
    </div>
    <div class="f-card-body" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2);">
      <h3 class="f-name">${item.name || `Bạn đồng hành ${companionId}`}</h3>
      <div class="f-location" style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;"><i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${location}</div>
      <div class="f-tags" style="display: flex; gap: 8px; margin-bottom: 20px;">
        <span style="background: white; color: #1e293b; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600;">Du lịch</span>
        <span style="background: white; color: #1e293b; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600;">Ẩm thực</span>
      </div>
      <div class="f-divider" style="height: 1px; background: rgba(0,0,0,0.2); margin-bottom: 16px;"></div>
      <div class="f-footer" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="f-rating"><i class="fa-solid fa-star" style="color: #fbbf24;"></i> ${item.rating ?? "4.9"} (128)</div>
        <div class="f-price" style="font-weight: 600;">${formatPrice(item.pricePerHour || 500000)}</div>
      </div>
      <button class="f-btn-book" style="background: rgba(139, 92, 246, 0.9); color: white; width: 100%; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">📅 Đặt lịch</button>
    </div>
  `;

  const favIcon = card.querySelector('.f-fav-icon');
  favIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    onRemove(companionId);
  });

  return card;
}

async function loadFavorites() {
  const status = document.getElementById("favoritesStatus");
  const list = document.getElementById("favoritesList");
  if (!status || !list) return;

  status.style.display = "block";
  list.innerHTML = "";
  renderEmpty(false);

  try {
    const data = await window.api.favoritesList();
    const items = data.favorites || [];
    if (items.length === 0) {
      status.style.display = "none";
      renderEmpty(true);
      return;
    }

    renderEmpty(false, items.length);

    async function remove(companionId) {
      try {
        await window.api.favoritesRemove(companionId);
        await loadFavorites();
      } catch (e) {
        alert(e.message || String(e));
      }
    }

    for (const item of items) list.appendChild(createRow(item, remove));
    status.style.display = "none";
  } catch (e) {
    status.textContent = e.message || "Lỗi tải dữ liệu";
  }
}

loadFavorites();
