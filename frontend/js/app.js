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

function createCard(companion, favoritesSet, onToggle) {
  const card = document.createElement("div");
  card.className = "f-card";

  const isFav = favoritesSet.has(companion.id);
  const location = companion.location || "Hà Nội";

  card.innerHTML = `
    <div class="f-card-header" style="background: rgba(139, 92, 246, 0.9);">
      <div class="f-actions-top">
        <span class="badge-online">Online</span>
        <div class="f-fav-icon" title="Yêu thích" style="background: white; border-radius: 50%; width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: ${isFav ? '#ef4444' : '#1e293b'}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <i class="${isFav ? 'fa-solid' : 'fa-solid'} fa-heart"></i>
        </div>
      </div>
      <div class="f-avatar" style="font-size: 60px;">${companion.avatar || getAvatarEmoji(companion.id)}</div>
    </div>
    <div class="f-card-body" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2);">
      <h3 class="f-name">${companion.name || companion.id}</h3>
      <div class="f-location" style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;"><i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ${location}</div>
      <div class="f-footer" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0;">
        <div class="f-rating"><i class="fa-solid fa-star" style="color: #fbbf24;"></i> ${companion.rating ?? "4.9"} (128)</div>
        <div class="f-price" style="color: #60a5fa;">${formatPrice(companion.pricePerHour || 500000)}</div>
      </div>
    </div>
  `;

  const favIcon = card.querySelector('.f-fav-icon');
  favIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggle(companion.id);
  });

  return card;
}

async function load() {
  const status = document.getElementById("featuredStatus");
  const grid = document.getElementById("featuredGrid");
  if (!status || !grid) return;

  status.textContent = "Đang tải...";
  grid.innerHTML = "";

  try {
    const [featured, favorites] = await Promise.all([window.api.homeFeatured(), window.api.favoritesList()]);
    const favoritesSet = new Set((favorites.favorites || []).map((f) => f.companionId));

    async function toggle(companionId) {
      try {
        if (favoritesSet.has(companionId)) {
          await window.api.favoritesRemove(companionId);
          favoritesSet.delete(companionId);
        } else {
          await window.api.favoritesAdd(companionId);
          favoritesSet.add(companionId);
        }
        await load();
      } catch (e) {
        alert(e.message || String(e));
      }
    }

    for (const c of featured.companions || []) {
      grid.appendChild(createCard(c, favoritesSet, toggle));
    }
    status.style.display = 'none';
  } catch (e) {
    status.textContent = e.message || "Lỗi tải dữ liệu";
  }
}

load();
