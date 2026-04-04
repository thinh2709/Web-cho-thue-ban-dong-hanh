import { apiGet, apiPatch, getStoredUserId, setStoredUserId } from "./api.js";

const listEl = document.getElementById("bookings-list");
const msg = document.getElementById("bookings-message");

function showMessage(text, isError) {
  msg.textContent = text;
  msg.className = `form-message${isError ? " form-message--error" : ""}`;
}

async function bootstrapUser() {
  if (getStoredUserId()) return;
  const me = await apiGet("/api/users/me");
  setStoredUserId(me._id);
}

function fmtRange(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  const opt = { dateStyle: "medium", timeStyle: "short" };
  return `${a.toLocaleString("vi-VN", opt)} → ${b.toLocaleString("vi-VN", opt)}`;
}

const statusLabel = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

function card(booking) {
  const el = document.createElement("article");
  el.className = "booking-card";
  el.dataset.id = booking._id;

  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const canEdit = booking.status === "pending";

  const title = escapeHtml(booking.companionName || "Bạn đồng hành");
  el.innerHTML = `
    <header class="booking-card__head">
      <h3 class="booking-card__title">${title}</h3>
      <span class="badge badge--${booking.status}">${statusLabel[booking.status] || booking.status}</span>
    </header>
    <p class="booking-card__time">${fmtRange(booking.start, booking.end)}</p>
    <p class="booking-card__note">${booking.note ? `Ghi chú: ${escapeHtml(booking.note)}` : ""}</p>
    <div class="booking-card__actions">
      ${
        canCancel
          ? `<button type="button" class="btn btn--ghost js-cancel">Hủy lịch</button>`
          : ""
      }
    </div>
    ${
      canEdit
        ? `<form class="booking-edit">
        <label class="field">
          <span class="field__label">Ghi chú</span>
          <textarea class="input" name="note" rows="2">${escapeHtml(booking.note || "")}</textarea>
        </label>
        <label class="field">
          <span class="field__label">Bắt đầu</span>
          <input class="input" name="start" type="datetime-local" value="${toLocalInput(booking.start)}" />
        </label>
        <label class="field">
          <span class="field__label">Kết thúc</span>
          <input class="input" name="end" type="datetime-local" value="${toLocalInput(booking.end)}" />
        </label>
        <button type="submit" class="btn btn--primary">Cập nhật</button>
      </form>`
        : ""
    }
  `;

  const cancelBtn = el.querySelector(".js-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", async () => {
      if (!confirm("Bạn chắc chắn muốn hủy lịch này?")) return;
      try {
        await bootstrapUser();
        await apiPatch(`/api/bookings/${booking._id}`, { status: "cancelled" });
        await refresh();
      } catch (err) {
        showMessage(err.message || "Không hủy được", true);
      }
    });
  }

  const editForm = el.querySelector(".booking-edit");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(editForm);
      const note = String(fd.get("note") ?? "");
      const start = localInputToIso(String(fd.get("start") ?? ""));
      const end = localInputToIso(String(fd.get("end") ?? ""));
      try {
        await bootstrapUser();
        await apiPatch(`/api/bookings/${booking._id}`, { note, start, end });
        await refresh();
        showMessage("Đã cập nhật booking.");
      } catch (err) {
        showMessage(err.message || "Không cập nhật được", true);
      }
    });
  }

  return el;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function localInputToIso(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function refresh() {
  listEl.innerHTML = "";
  await bootstrapUser();
  const rows = await apiGet("/api/users/me/bookings");
  if (!rows.length) {
    listEl.innerHTML = `<p class="muted">Chưa có booking nào.</p>`;
    return;
  }
  for (const b of rows) {
    listEl.appendChild(card(b));
  }
}

refresh().catch((err) => showMessage(err.message || "Không tải được danh sách", true));
