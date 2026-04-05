import { apiGet, apiPatch, getStoredUserId, setStoredUserId } from "./api.js";

const form = document.getElementById("profile-form");
const msg = document.getElementById("profile-message");
const avatarPreview = document.getElementById("avatar-preview");
const avatarFallback = document.getElementById("avatar-fallback");
const displayName = document.getElementById("profile-display-name");
const demoBadge = document.getElementById("profile-demo-badge");
const chipsEl = document.getElementById("hobbies-chips");
const hobbyNew = document.getElementById("hobby-new");
const hobbyAddBtn = document.getElementById("hobby-add-btn");
const cameraBtn = document.getElementById("avatar-camera-btn");
const editBtn = document.getElementById("profile-edit-btn");

let hobbiesList = [];

function showMessage(text, isError) {
  msg.textContent = text;
  msg.className = `form-message profile-form-message${isError ? " form-message--error" : ""}`;
}

function setPreview(url) {
  if (!avatarPreview || !avatarFallback) return;
  if (url) {
    avatarPreview.src = url;
    avatarPreview.hidden = false;
    avatarFallback.hidden = true;
  } else {
    avatarPreview.removeAttribute("src");
    avatarPreview.hidden = true;
    avatarFallback.hidden = false;
  }
}

function renderHobbies() {
  if (!chipsEl) return;
  chipsEl.innerHTML = "";
  hobbiesList.forEach((h) => {
    const chip = document.createElement("span");
    chip.className = "profile-chip";
    const text = document.createElement("span");
    text.className = "profile-chip__text";
    text.textContent = h;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "profile-chip__remove";
    rm.setAttribute("aria-label", `Xóa ${h}`);
    rm.textContent = "×";
    rm.addEventListener("click", () => {
      hobbiesList = hobbiesList.filter((x) => x !== h);
      renderHobbies();
    });
    chip.append(text, rm);
    chipsEl.appendChild(chip);
  });
}

function addHobby() {
  if (!hobbyNew) return;
  const v = hobbyNew.value.trim();
  if (!v || hobbiesList.includes(v) || hobbiesList.length >= 24) return;
  hobbiesList.push(v);
  hobbyNew.value = "";
  renderHobbies();
}

function normalizeBirthForInput(v) {
  if (!v || typeof v !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  return "";
}

cameraBtn?.addEventListener("click", () => form.avatar?.focus());
editBtn?.addEventListener("click", () => form.fullName?.focus());

form.avatar?.addEventListener("input", () => setPreview(form.avatar.value.trim()));

hobbyAddBtn?.addEventListener("click", addHobby);
hobbyNew?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addHobby();
  }
});

async function bootstrapUser() {
  if (getStoredUserId()) return;
  const me = await apiGet("/api/users/me");
  setStoredUserId(me._id);
}

async function load() {
  await bootstrapUser();
  const me = await apiGet("/api/users/me");
  form.fullName.value = me.fullName ?? "";
  form.phone.value = me.phone ?? "";
  form.avatar.value = me.avatar ?? "";
  form.birthDate.value = normalizeBirthForInput(me.birthDate ?? "");
  form.address.value = me.address ?? "";
  form.bio.value = me.bio ?? "";
  hobbiesList = Array.isArray(me.hobbies) ? [...me.hobbies] : [];
  renderHobbies();
  setPreview(form.avatar.value.trim());
  if (displayName) displayName.textContent = (me.fullName && me.fullName.trim()) || "—";
  if (demoBadge) demoBadge.hidden = !me.isDemo;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");
  try {
    await bootstrapUser();
    const current = await apiGet("/api/users/me");
    await apiPatch("/api/users/me", {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      avatar: form.avatar.value.trim(),
      birthDate: form.birthDate.value.trim(),
      address: form.address.value.trim(),
      bio: form.bio.value.trim(),
      hobbies: hobbiesList,
      gallery: Array.isArray(current.gallery) ? current.gallery : [],
    });
    if (displayName) displayName.textContent = form.fullName.value.trim() || "—";
    showMessage("Đã lưu hồ sơ.");
  } catch (err) {
    showMessage(err.message || "Có lỗi xảy ra", true);
  }
});

load().catch((err) => showMessage(err.message || "Không tải được hồ sơ", true));
