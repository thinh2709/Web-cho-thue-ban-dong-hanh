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
    btnWithdraw: document.getElementById('btn-withdraw'),
    linkSeeAll: document.getElementById('link-see-all'),
  };

  let chartInstance = null;

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

  function renderCards(payload) {
    const s = payload.summary || {};
    const t = payload.trends || {};
    const rating = s.averageRating != null ? String(s.averageRating) : '—';
    const hours = s.totalWorkingHours != null ? `${s.totalWorkingHours}h` : '—';

    const trendRev =
      t.revenuePct != null
        ? `↑ ${Math.abs(t.revenuePct)}% so với kỳ trước`
        : '— so với kỳ trước';
    const trendBook =
      t.bookingsDelta != null
        ? `↑ ${t.bookingsDelta} so với kỳ trước`
        : '— so với kỳ trước';
    const trendRate =
      t.ratingDelta != null ? `↑ ${Math.abs(t.ratingDelta)}` : '— so với kỳ trước';
    const trendHours =
      t.hoursDelta != null ? `↑ ${Math.abs(t.hoursDelta)}h` : '— so với kỳ trước';

    els.cards.innerHTML = `
      <article class="card">
        <div class="card-icon mint" aria-hidden="true">💵</div>
        <p class="card-value">${formatMoney(s.totalRevenue)}</p>
        <p class="card-label">Tổng thu nhập</p>
        <p class="card-trend">${trendRev}</p>
      </article>
      <article class="card">
        <div class="card-icon blue" aria-hidden="true">📅</div>
        <p class="card-value">${s.completedBookings ?? 0}</p>
        <p class="card-label">Cuộc hẹn hoàn thành</p>
        <p class="card-trend">${trendBook}</p>
      </article>
      <article class="card">
        <div class="card-icon amber" aria-hidden="true">⭐</div>
        <p class="card-value">${rating}</p>
        <p class="card-label">Đánh giá trung bình</p>
        <p class="card-trend">${trendRate}</p>
      </article>
      <article class="card">
        <div class="card-icon rose" aria-hidden="true">⏱️</div>
        <p class="card-value">${hours}</p>
        <p class="card-label">Tổng giờ làm việc</p>
        <p class="card-trend">${trendHours}</p>
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

  function buildChartGradient(ctx, chartArea) {
    const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    g.addColorStop(0, 'rgba(244, 114, 182, 0.35)');
    g.addColorStop(0.5, 'rgba(251, 146, 60, 0.85)');
    g.addColorStop(1, 'rgba(244, 114, 182, 0.95)');
    return g;
  }

  function renderChart(series) {
    if (typeof Chart === 'undefined') {
      return;
    }
    const labels = (series || []).map((x) => x.period);
    const values = (series || []).map((x) => x.revenue || 0);
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
              if (!chartArea) return 'rgba(244, 114, 182, 0.7)';
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
                return `${Number(v) / 1_000_000}tr`;
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
    } catch (e) {
      showError(e.message || 'Lỗi không xác định');
      els.cards.innerHTML = '';
      els.txList.innerHTML = '';
      els.withdraw.textContent = '—';
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
    refresh();
  });
  els.fromDate.addEventListener('change', refresh);
  els.toDate.addEventListener('change', refresh);

  els.btnWithdraw.addEventListener('click', () => {
    window.alert('Chức năng rút tiền sẽ được kết nối backend thanh toán sau.');
  });
  els.linkSeeAll.addEventListener('click', (e) => {
    e.preventDefault();
    window.alert('Danh sách đầy đủ có thể mở rộng từ module giao dịch.');
  });

  const today = new Date();
  els.toDate.value = today.toISOString().slice(0, 10);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  els.fromDate.value = weekAgo.toISOString().slice(0, 10);
  toggleCustomInputs();
  refresh();
})();
