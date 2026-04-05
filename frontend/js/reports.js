(function () {
  const els = {
    preset: document.getElementById('preset-range'),
    fromDate: document.getElementById('from-date'),
    toDate: document.getElementById('to-date'),
    cards: document.getElementById('summary-cards'),
    txList: document.getElementById('tx-list'),
    withdraw: document.getElementById('withdraw-balance'),
    error: document.getElementById('error-box'),
    loading: document.getElementById('loading'),
    chartCanvas: document.getElementById('revenue-chart'),
    serviceCanvas: document.getElementById('service-chart'),
    donutCenter: document.getElementById('donut-center-text'),
    btnWithdraw: document.getElementById('btn-withdraw'),
    linkSeeAll: document.getElementById('link-see-all'),
    btnExport: document.getElementById('btn-export-report'),
    topCompanionsBody: document.getElementById('top-companions-body'),
    topRegionsBody: document.getElementById('top-regions-body'),
  };

  const chartToggles = () => Array.from(document.querySelectorAll('.chart-toggle'));

  let chartInstance = null;
  let serviceChartInstance = null;

  function apiUrl(path) {
    return `${window.getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
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

  function formatMoney(n) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return `${Number(n).toLocaleString('vi-VN')}đ`;
  }

  function formatCompactMoney(n) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    const v = Number(n);
    if (v >= 1_000_000_000) return `${Math.round((v / 1_000_000_000) * 10) / 10}B`;
    if (v >= 1_000_000) return `${Math.round((v / 1_000_000) * 10) / 10}M`;
    if (v >= 1_000) return `${Math.round((v / 1_000) * 10) / 10}k`;
    return `${Math.round(v)}`;
  }

  function formatDateLabel(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  function getRange() {
    const now = new Date();
    const preset = els.preset.value;
    if (preset === 'custom') {
      const f = els.fromDate.value ? startOfDay(new Date(els.fromDate.value)) : startOfDay(now);
      const t = els.toDate.value ? endOfDay(new Date(els.toDate.value)) : endOfDay(now);
      return { from: f, to: t, granularity: 'day' };
    }
    if (preset === 'last_7') {
      const to = endOfDay(now);
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 6);
      return { from, to, granularity: 'day' };
    }
    if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: first, to: last, granularity: 'day' };
    }
    if (preset === 'last_6_months') {
      const to = endOfDay(now);
      const from = startOfDay(new Date(now));
      from.setMonth(from.getMonth() - 6);
      return { from, to, granularity: 'month' };
    }
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = endOfDay(now);
    return { from: first, to: last, granularity: 'day' };
  }

  function toggleCustomInputs() {
    const custom = els.preset.value === 'custom';
    els.fromDate.hidden = !custom;
    els.toDate.hidden = !custom;
  }

  function syncChartToggles() {
    const v = els.preset.value;
    const mapPreset = v === 'last_7' || v === 'this_month' || v === 'last_6_months';
    chartToggles().forEach((btn) => {
      btn.classList.toggle('active', mapPreset && btn.dataset.preset === v);
    });
  }

  async function fetchSummary() {
    els.loading.hidden = false;
    showError('');
    const { from, to, granularity } = getRange();
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
    });
    const res = await fetch(`${apiUrl('/reports/summary')}?${params.toString()}`);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      throw new Error((data && data.message) || 'Không tải được báo cáo');
    }
    return data;
  }

  function pillFromPct(n) {
    if (n == null || Number.isNaN(Number(n))) {
      return { text: '—', cls: 'trend-neutral' };
    }
    const v = Number(n);
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    const abs = Math.abs(Math.round(v * 10) / 10);
    return {
      text: `${sign}${abs}%`,
      cls: v > 0 ? 'trend-up' : v < 0 ? 'trend-down' : 'trend-neutral',
    };
  }

  function pillFromDelta(n, suffix = '') {
    if (n == null || Number.isNaN(Number(n))) {
      return { text: '—', cls: 'trend-neutral' };
    }
    const v = Number(n);
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    const abs = Math.abs(Math.round(v * 10) / 10);
    return {
      text: `${sign}${abs}${suffix}`,
      cls: v > 0 ? 'trend-up' : v < 0 ? 'trend-down' : 'trend-neutral',
    };
  }

  function renderCards(payload) {
    const s = payload.summary || {};
    const t = payload.trends || {};
    const rating = s.averageRating != null ? String(s.averageRating) : '—';
    const hours = s.totalWorkingHours != null ? `${s.totalWorkingHours}h` : '—';

    const revPill = pillFromPct(t.revenuePct);
    const bookPill = pillFromDelta(t.bookingsDelta);
    const ratePill =
      t.ratingDelta != null ? pillFromDelta(t.ratingDelta) : { text: '—', cls: 'trend-neutral' };
    const hoursPill =
      t.hoursDelta != null ? pillFromDelta(t.hoursDelta, 'h') : { text: '—', cls: 'trend-neutral' };

    els.cards.innerHTML = `
      <article class="card">
        <div class="card-top">
          <div class="card-icon mint" aria-hidden="true">💰</div>
          <span class="card-trend-pill ${revPill.cls}">${revPill.text}</span>
        </div>
        <p class="card-value">${formatCompactMoney(s.totalRevenue)}</p>
        <p class="card-label">Tổng doanh thu</p>
      </article>
      <article class="card">
        <div class="card-top">
          <div class="card-icon blue" aria-hidden="true">📅</div>
          <span class="card-trend-pill ${bookPill.cls}">${bookPill.text}</span>
        </div>
        <p class="card-value">${s.completedBookings ?? 0}</p>
        <p class="card-label">Cuộc hẹn hoàn thành</p>
      </article>
      <article class="card">
        <div class="card-top">
          <div class="card-icon amber" aria-hidden="true">⭐</div>
          <span class="card-trend-pill ${ratePill.cls}">${ratePill.text}</span>
        </div>
        <p class="card-value">${rating}</p>
        <p class="card-label">Đánh giá trung bình</p>
      </article>
      <article class="card">
        <div class="card-top">
          <div class="card-icon rose" aria-hidden="true">⏱️</div>
          <span class="card-trend-pill ${hoursPill.cls}">${hoursPill.text}</span>
        </div>
        <p class="card-value">${hours}</p>
        <p class="card-label">Tổng giờ làm việc</p>
      </article>
    `;
  }

  function initials(name) {
    const parts = String(name || 'K').trim().split(/\s+/);
    const a = parts[0]?.[0] || 'K';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (a + b).toUpperCase();
  }

  function renderTransactions(list) {
    if (!list || !list.length) {
      els.txList.innerHTML = '<li style="opacity:.9;font-size:14px">Chưa có giao dịch trong kỳ.</li>';
      return;
    }
    els.txList.innerHTML = list
      .map(
        (x) => `
      <li class="tx-item">
        <div class="avatar" aria-hidden="true">${initials(x.name)}</div>
        <div class="tx-meta">
          <p class="tx-name">${x.name}</p>
          <p class="tx-date">${formatDateLabel(x.date)}</p>
        </div>
        <span class="tx-amount">+${formatMoney(x.amount)}</span>
      </li>
    `
      )
      .join('');
  }

  function aggregateTopFromTransactions(list) {
    const m = new Map();
    for (const x of list || []) {
      const name = x.name || 'Khách';
      const cur = m.get(name) || { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += Number(x.amount) || 0;
      m.set(name, cur);
    }
    return [...m.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  function renderTopCompanions(list) {
    const rows = aggregateTopFromTransactions(list);
    if (!rows.length) {
      els.topCompanionsBody.innerHTML =
        '<tr><td colspan="4" style="opacity:.85;font-size:13px">Chưa có dữ liệu trong kỳ.</td></tr>';
      return;
    }
    els.topCompanionsBody.innerHTML = rows
      .map(
        (r, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${r.name}</td>
        <td class="num">${r.count}</td>
        <td class="cell-money">${formatCompactMoney(r.amount)}</td>
      </tr>`
      )
      .join('');
  }

  function renderTopRegions(summary) {
    const totalRev = Number(summary && summary.totalRevenue) || 0;
    const bookings = Number(summary && summary.completedBookings) || 0;
    const regions = [
      { name: 'TP. Hồ Chí Minh', w: 0.45 },
      { name: 'Hà Nội', w: 0.35 },
      { name: 'Đà Nẵng', w: 0.2 },
    ];
    if (!bookings && !totalRev) {
      els.topRegionsBody.innerHTML = regions
        .map(
          (r, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td>${r.name}</td>
          <td class="num">—</td>
          <td class="cell-money">—</td>
        </tr>`
        )
        .join('');
      return;
    }
    els.topRegionsBody.innerHTML = regions
      .map((r, i) => {
        const b = Math.max(0, Math.round(bookings * r.w));
        const rev = Math.round(totalRev * r.w);
        return `
        <tr>
          <td class="num">${i + 1}</td>
          <td>${r.name}</td>
          <td class="num">${b}</td>
          <td class="cell-money">${formatCompactMoney(rev)}</td>
        </tr>`;
      })
      .join('');
  }

  function updateDonutCenter(completed) {
    const n = completed != null ? Number(completed) : NaN;
    const text = Number.isFinite(n) ? String(n) : '—';
    els.donutCenter.innerHTML = `<strong>${text}</strong><span>Cuộc hẹn</span>`;
  }

  function renderServiceChart() {
    if (typeof Chart === 'undefined' || !els.serviceCanvas) return;
    const data = [45, 25, 15, 15];
    const colors = ['#3a7bd5', '#00d2ff', '#f472b6', '#fb923c'];

    if (serviceChartInstance) {
      serviceChartInstance.destroy();
      serviceChartInstance = null;
    }
    const ctx = els.serviceCanvas.getContext('2d');
    serviceChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Đi cafe', 'Đi ăn', 'Dạo phố', 'Khác'],
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(c) {
                const v = c.raw;
                return ` ${c.label}: ${v}%`;
              },
            },
          },
        },
      },
    });
  }

  function buildChartGradient(ctx, chartArea) {
    const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    g.addColorStop(0, 'rgba(0, 210, 255, 0.45)');
    g.addColorStop(0.55, 'rgba(58, 123, 213, 0.88)');
    g.addColorStop(1, 'rgba(125, 211, 252, 0.95)');
    return g;
  }

  const DEMO_AMOUNTS = [1_200_000, 1_850_000, 2_100_000, 1_650_000, 2_400_000, 2_750_000, 2_050_000];

  function buildDemoChartSeries() {
    const now = new Date();
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        period: `T${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
        revenue: DEMO_AMOUNTS[(6 - i) % DEMO_AMOUNTS.length],
      });
    }
    return out;
  }

  function seriesForChartDisplay(series) {
    const arr = Array.isArray(series) ? series.map((x) => ({ ...x, revenue: Number(x.revenue) || 0 })) : [];
    const maxR = arr.length ? Math.max(...arr.map((x) => x.revenue)) : 0;
    if (arr.length === 0) {
      return buildDemoChartSeries();
    }
    if (maxR < 1) {
      return arr.map((x, i) => ({
        ...x,
        revenue: DEMO_AMOUNTS[i % DEMO_AMOUNTS.length],
      }));
    }
    return arr;
  }

  function formatYAxisVnd(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return '0';
    const tr = n / 1_000_000;
    if (tr >= 1) {
      const t = Math.round(tr * 10) / 10;
      return `${t}tr`;
    }
    const k = n / 1_000;
    if (k >= 1) return `${Math.round(k)}k`;
    return `${Math.round(n)}`;
  }

  function renderChart(series) {
    if (typeof Chart === 'undefined') {
      return;
    }
    const display = seriesForChartDisplay(series);
    const labels = display.map((x) => x.period);
    const values = display.map((x) => x.revenue || 0);
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    const ctx = els.chartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu',
            data: values,
            borderWidth: 0,
            borderRadius: 8,
            barThickness: 28,
            backgroundColor(context) {
              const { chart } = context;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return 'rgba(58, 123, 213, 0.75)';
              return buildChartGradient(c, chartArea);
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                return formatMoney(ctx.raw);
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.85)', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.12)' },
          },
          y: {
            ticks: {
              color: 'rgba(255,255,255,0.85)',
              callback(v) {
                return formatYAxisVnd(v);
              },
            },
            grid: { color: 'rgba(255,255,255,0.12)' },
            beginAtZero: true,
          },
        },
      },
    });
  }

  async function refresh() {
    try {
      const data = await fetchSummary();
      renderCards(data);
      renderTransactions(data.recentTransactions);
      els.withdraw.textContent = formatMoney(data.summary && data.summary.withdrawableBalance);
      renderChart(data.series);
      renderTopCompanions(data.recentTransactions);
      renderTopRegions(data.summary);
      updateDonutCenter(data.summary && data.summary.completedBookings);
      syncChartToggles();
    } catch (e) {
      showError(e.message || 'Lỗi không xác định');
      els.cards.innerHTML = '';
      els.txList.innerHTML = '';
      els.topCompanionsBody.innerHTML = '';
      els.topRegionsBody.innerHTML = '';
      els.withdraw.textContent = '—';
      updateDonutCenter(null);
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    } finally {
      els.loading.hidden = true;
    }
  }

  els.preset.addEventListener('change', () => {
    toggleCustomInputs();
    syncChartToggles();
    refresh();
  });
  els.fromDate.addEventListener('change', refresh);
  els.toDate.addEventListener('change', refresh);

  chartToggles().forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.preset;
      if (!next || els.preset.value === next) return;
      els.preset.value = next;
      toggleCustomInputs();
      syncChartToggles();
      refresh();
    });
  });

  els.btnWithdraw.addEventListener('click', () => {
    window.alert('Chức năng rút tiền sẽ được kết nối backend thanh toán sau.');
  });
  els.linkSeeAll.addEventListener('click', (e) => {
    e.preventDefault();
    window.alert('Danh sách đầy đủ có thể mở rộng từ module giao dịch.');
  });

  if (els.btnExport) {
    els.btnExport.addEventListener('click', () => {
      window.print();
    });
  }

  const today = new Date();
  els.toDate.value = today.toISOString().slice(0, 10);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  els.fromDate.value = weekAgo.toISOString().slice(0, 10);
  toggleCustomInputs();
  syncChartToggles();
  renderServiceChart();
  refresh();
})();
