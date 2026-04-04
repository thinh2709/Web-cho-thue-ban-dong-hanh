import { apiGet, apiPatch, getStoredUserId, setStoredUserId } from "./api.js";

const form = document.getElementById("profile-form");
const msg = document.getElementById("profile-message");
const avatarPreview = document.getElementById("avatar-preview");

function showMessage(text, isError) {
  msg.textContent = text;
  msg.className = `form-message${isError ? " form-message--error" : ""}`;
}

async function bootstrapUser() {
  if (getStoredUserId()) return;
  const me = await apiGet("/api/users/me");
  setStoredUserId(me._id);
}

function setPreview(url) {
  if (!avatarPreview) return;
  if (url) {
    avatarPreview.src = url;
    avatarPreview.hidden = false;
  } else {
    avatarPreview.removeAttribute("src");
    avatarPreview.hidden = true;
  }
}

async function load() {
  await bootstrapUser();
  const me = await apiGet("/api/users/me");
  form.fullName.value = me.fullName ?? "";
  form.phone.value = me.phone ?? "";
  form.avatar.value = me.avatar ?? "";
  setPreview(me.avatar);
}

form.avatar.addEventListener("input", () => {
  setPreview(form.avatar.value.trim());
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");
  try {
    await bootstrapUser();
    await apiPatch("/api/users/me", {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      avatar: form.avatar.value.trim(),
    });
    showMessage("Đã lưu hồ sơ.");
  } catch (err) {
    showMessage(err.message || "Có lỗi xảy ra", true);
  }
});

load().catch((err) => showMessage(err.message || "Không tải được hồ sơ", true));
