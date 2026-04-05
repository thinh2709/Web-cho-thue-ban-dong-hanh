(function () {
  const STORAGE_KEY = 'pricingCommissionSettings';

  const els = {
    panels: document.getElementById('panels'),
    status: document.getElementById('status-msg'),
    error: document.getElementById('error-box'),
    toast: document.getElementById('toast'),
    btnAdd: document.getElementById('btn-add-service'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalTitle: document.getElementById('modal-title'),
    form: document.getElementById('service-form'),
    formId: document.getElementById('form-id'),
    formName: document.getElementById('form-name'),
    formDesc: document.getElementById('form-desc'),
    formCategory: document.getElementById('form-category'),
    formMin: document.getElementById('form-min'),
    formMax: document.getElementById('form-max'),
    formUnit: document.getElementById('form-unit'),
    formPublic: document.getElementById('form-public'),
    formCancel: document.getElementById('form-cancel'),
    feeCompanion: document.getElementById('fee-companion'),
    feeCustomer: document.getElementById('fee-customer'),
    feeLate: document.getElementById('fee-late'),
    btnCommissionSave: document.getElementById('btn-commission-save'),
    btnCommissionReset: document.getElementById('btn-commission-reset'),
  };

  let items = [];
  const sectionEdit = { basic: false, premium: false };

  function apiUrl(path) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${window.getApiBase()}/api${p}`;
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  function showError(msg) {
    if (!msg) {
      els.error.hidden = true;
      els.error.textContent = '';
      return;
    }
    els.error.hidden = false;
    els.error.textContent = msg;
  }

  function formatMoneyInput(n) {
    if (n == null || Number.isNaN(Number(n))) return '';
    return String(Math.round(Number(n)));
  }

  function parseMoney(str) {
    const n = Number(String(str).replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  async function fetchJson(url, options) {
    const headers = { 'Content-Type': 'application/json', ...(options && options.headers) };
    const method = (options && options.method) || 'GET';
    if (window.PRICING_ADMIN_KEY && method !== 'GET' && method !== 'HEAD') {
      headers['x-admin-key'] = window.PRICING_ADMIN_KEY;
    }
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      let msg = (data && data.message) || res.statusText || 'Lỗi mạng';
      if (typeof msg === 'string' && (msg.includes('<!DOCTYPE') || msg.includes('Cannot GET'))) {
        msg =
          'Không gọi được API bảng giá. Hãy chạy backend (cổng 3001) và frontend bằng npm run dev (đã cấu hình proxy /api → :3001).';
      }
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  async function loadPricing() {
    els.status.hidden = false;
    showError('');
    try {
      items = await fetchJson(apiUrl('/pricing'));
      renderAll();
    } catch (e) {
      showError(e.message || 'Không tải được bảng giá. Kiểm tra API và CORS.');
    } finally {
      els.status.hidden = true;
    }
  }

  function groupByCategory(list) {
    return {
      basic: list.filter((x) => x.category !== 'premium'),
      premium: list.filter((x) => x.category === 'premium'),
    };
  }

  function renderTable(category, rows, editing) {
    const isPremium = category === 'premium';
    const titleText = isPremium ? 'Dịch vụ cao cấp' : 'Dịch vụ cơ bản';
    const emoji = isPremium ? '✨' : '☕';
    const btnClass = isPremium ? 'btn-edit-section secondary' : 'btn-edit-section';

    const body = rows
      .map((row) => {
        const maxVal = row.maxPrice != null ? formatMoneyInput(row.maxPrice) : '';
        const disabledAttr = editing ? '' : 'disabled';
        return `
          <tr data-id="${row._id}">
            <td>
              <p class="svc-name"></p>
              <p class="svc-desc"></p>
            </td>
            <td>
              <input class="input-money" type="text" inputmode="numeric" data-field="min" value="${formatMoneyInput(row.price)}" ${disabledAttr} aria-label="Giá tối thiểu" />
            </td>
            <td>
              <input class="input-money" type="text" inputmode="numeric" data-field="max" value="${maxVal}" ${disabledAttr} aria-label="Giá tối đa" />
            </td>
            <td>
              <div class="status-cell">
                <button type="button" class="toggle ${row.isPublic ? 'on' : 'off'}" data-action="toggle" aria-pressed="${row.isPublic}" aria-label="Trạng thái hiển thị"><span class="toggle-knob"></span></button>
                <span class="status-label">${row.isPublic ? 'Hoạt động' : 'Tạm tắt'}</span>
              </div>
              <div class="row-actions" style="margin-top:8px">
                <button type="button" class="btn-small" data-action="edit">Sửa</button>
                <button type="button" class="btn-small danger" data-action="delete">Xóa</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <section class="glass-panel" data-category="${category}">
        <div class="panel-head">
          <h2 class="panel-title"><span class="emoji" aria-hidden="true">${emoji}</span>${titleText}</h2>
          <button type="button" class="${btnClass}" data-action="toggle-section-edit">${editing ? '✓ Xong' : '✏️ Chỉnh sửa'}</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Giá tối thiểu</th>
                <th>Giá tối đa</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>${body || '<tr><td colspan="4" style="padding:24px">Chưa có dịch vụ.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function fillRowText(root) {
    const id = root.dataset.id;
    const row = items.find((x) => x._id === id);
    if (!row) return;
    const nameEl = root.querySelector('.svc-name');
    const descEl = root.querySelector('.svc-desc');
    nameEl.textContent = row.packageName || '';
    descEl.textContent = row.description || '';
  }

  function renderAll() {
    const g = groupByCategory(items);
    els.panels.innerHTML =
      renderTable('basic', g.basic, sectionEdit.basic) + renderTable('premium', g.premium, sectionEdit.premium);
    els.panels.querySelectorAll('tbody tr[data-id]').forEach(fillRowText);
    bindPanelEvents();
  }

  async function patchRow(id, body) {
    await fetchJson(apiUrl(`/pricing/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async function deleteRow(id) {
    await fetchJson(apiUrl(`/pricing/${id}`), { method: 'DELETE' });
  }

  function bindPanelEvents() {
    els.panels.querySelectorAll('[data-action="toggle-section-edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.closest('.glass-panel').dataset.category;
        sectionEdit[cat] = !sectionEdit[cat];
        renderAll();
      });
    });

    els.panels.querySelectorAll('tbody tr[data-id]').forEach((tr) => {
      const id = tr.dataset.id;

      tr.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
        const row = items.find((x) => x._id === id);
        if (!row) return;
        const next = !row.isPublic;
        try {
          const updated = await fetchJson(apiUrl(`/pricing/${id}`), {
            method: 'PATCH',
            body: JSON.stringify({ isPublic: next }),
          });
          items = items.map((x) => (x._id === id ? updated : x));
          renderAll();
          showToast(next ? 'Đã bật hiển thị' : 'Đã tạm tắt');
        } catch (e) {
          showToast(e.message);
        }
      });

      tr.querySelector('[data-action="edit"]')?.addEventListener('click', () => openModal(id));
      tr.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
        if (!confirm('Xóa dịch vụ này?')) return;
        try {
          await deleteRow(id);
          items = items.filter((x) => x._id !== id);
          renderAll();
          showToast('Đã xóa');
        } catch (e) {
          showToast(e.message);
        }
      });

      tr.querySelectorAll('.input-money').forEach((input) => {
        input.addEventListener('blur', async () => {
          if (input.disabled) return;
          const field = input.dataset.field;
          const row = items.find((x) => x._id === id);
          if (!row) return;
          const min = parseMoney(tr.querySelector('[data-field="min"]').value);
          const maxRaw = tr.querySelector('[data-field="max"]').value;
          const max = maxRaw === '' ? null : parseMoney(maxRaw);
          try {
            const updated = await fetchJson(apiUrl(`/pricing/${id}`), {
              method: 'PATCH',
              body: JSON.stringify({
                price: min,
                maxPrice: max,
              }),
            });
            items = items.map((x) => (x._id === id ? updated : x));
            showToast('Đã cập nhật giá');
          } catch (e) {
            showToast(e.message);
            renderAll();
          }
        });
      });
    });
  }

  function openModal(editId) {
    els.modalBackdrop.classList.add('open');
    if (editId) {
      const row = items.find((x) => x._id === editId);
      if (!row) return;
      els.modalTitle.textContent = 'Chỉnh sửa dịch vụ';
      els.formId.value = row._id;
      els.formName.value = row.packageName || '';
      els.formDesc.value = row.description || '';
      els.formCategory.value = row.category === 'premium' ? 'premium' : 'basic';
      els.formMin.value = row.price ?? '';
      els.formMax.value = row.maxPrice != null ? row.maxPrice : '';
      els.formUnit.value = row.unit || 'buổi';
      els.formPublic.checked = !!row.isPublic;
    } else {
      els.modalTitle.textContent = 'Thêm dịch vụ mới';
      els.formId.value = '';
      els.form.reset();
      els.formUnit.value = 'buổi';
      els.formPublic.checked = true;
    }
    els.formName.focus();
  }

  function closeModal() {
    els.modalBackdrop.classList.remove('open');
  }

  els.btnAdd.addEventListener('click', () => openModal(null));
  els.formCancel.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = els.formId.value;
    const body = {
      packageName: els.formName.value.trim(),
      description: els.formDesc.value.trim(),
      category: els.formCategory.value,
      price: Number(els.formMin.value),
      maxPrice: els.formMax.value === '' ? null : Number(els.formMax.value),
      unit: els.formUnit.value.trim() || 'buổi',
      isPublic: els.formPublic.checked,
    };
    try {
      if (id) {
        const updated = await fetchJson(apiUrl(`/pricing/${id}`), {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        items = items.map((x) => (x._id === id ? updated : x));
        showToast('Đã cập nhật dịch vụ');
      } else {
        const created = await fetchJson(apiUrl('/pricing'), {
          method: 'POST',
          body: JSON.stringify(body),
        });
        items.push(created);
        showToast('Đã thêm dịch vụ');
      }
      closeModal();
      renderAll();
    } catch (err) {
      showToast(err.message || 'Không lưu được');
    }
  });

  function loadCommission() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const defaults = { companion: 15, customer: 5, late: 20 };
    let data = defaults;
    if (raw) {
      try {
        data = { ...defaults, ...JSON.parse(raw) };
      } catch {
        data = defaults;
      }
    }
    els.feeCompanion.value = data.companion ?? defaults.companion;
    els.feeCustomer.value = data.customer ?? defaults.customer;
    els.feeLate.value = data.late ?? defaults.late;
  }

  function saveCommission() {
    const payload = {
      companion: Number(els.feeCompanion.value),
      customer: Number(els.feeCustomer.value),
      late: Number(els.feeLate.value),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    showToast('Đã lưu cài đặt (local)');
  }

  els.btnCommissionSave.addEventListener('click', saveCommission);
  els.btnCommissionReset.addEventListener('click', () => {
    loadCommission();
    showToast('Đã hoàn tác nhập liệu');
  });

  loadCommission();
  loadPricing();
})();
