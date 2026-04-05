import { Booking } from "../models/Booking.js";
import { companions } from "../data/companions.js";
import { bookingDurationHours, bookingRevenue } from "../utils/bookingMoney.js";

const STATIC_AVG_RATING =
  companions.length > 0
    ? companions.reduce((s, c) => s + (Number(c.rating) || 0), 0) / companions.length
    : 4.8;

function parseDateQuery(v, fallback) {
  if (v == null || v === "") return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function prevPeriodRange(from, to) {
  const len = Math.max(0, to.getTime() - from.getTime());
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - len);
  return { prevFrom, prevTo };
}

function pctDelta(curr, prev) {
  if (prev == null || prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function sumCompletedMetrics(bookings) {
  let totalRevenue = 0;
  let totalHours = 0;
  for (const b of bookings) {
    totalRevenue += bookingRevenue(b);
    totalHours += bookingDurationHours(b);
  }
  const totalWorkingHours = Math.round(totalHours * 10) / 10;
  return { totalRevenue, totalWorkingHours, completedBookings: bookings.length };
}

function bucketKeyForEnd(endDate, granularity) {
  const d = new Date(endDate);
  if (granularity === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatPeriodLabel(key, granularity) {
  if (granularity === "month") {
    const [y, m] = key.split("-");
    return `T${m}/${y}`;
  }
  const [y, mo, da] = key.split("-");
  const d = new Date(Number(y), Number(mo) - 1, Number(da));
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function buildSeries(bookings, from, to, granularity) {
  const map = new Map();
  const end = new Date(to);
  let cursor =
    granularity === "month"
      ? new Date(from.getFullYear(), from.getMonth(), 1)
      : new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const endCap = new Date(end);
  if (granularity === "month") {
    endCap.setHours(23, 59, 59, 999);
  }
  while (cursor <= endCap) {
    const k = bucketKeyForEnd(cursor, granularity);
    if (!map.has(k)) {
      map.set(k, { period: formatPeriodLabel(k, granularity), revenue: 0, _sort: k });
    }
    if (granularity === "month") {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    } else {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
  }

  for (const b of bookings) {
    const k = bucketKeyForEnd(b.end, granularity);
    if (!map.has(k)) {
      map.set(k, { period: formatPeriodLabel(k, granularity), revenue: 0, _sort: k });
    }
    const row = map.get(k);
    row.revenue += bookingRevenue(b);
  }

  return [...map.values()]
    .sort((a, b) => a._sort.localeCompare(b._sort))
    .map(({ period, revenue }) => ({ period, revenue }));
}

/**
 * GET /api/reports/summary — khớp `frontend/js/reports.js`
 * Query: from, to (ISO), granularity (day | month)
 */
export async function getReportSummary(req, res) {
  try {
    const now = new Date();
    const toDate = parseDateQuery(req.query.to, now);
    let fromDate = parseDateQuery(req.query.from, new Date(now.getTime() - 7 * 86400000));
    if (fromDate > toDate) {
      const t = fromDate;
      fromDate = toDate;
      toDate = t;
    }

    const granularity = req.query.granularity === "month" ? "month" : "day";

    const matchCurrent = {
      status: "completed",
      end: { $gte: fromDate, $lte: toDate },
    };

    const { prevFrom, prevTo } = prevPeriodRange(fromDate, toDate);
    const matchPrev = {
      status: "completed",
      end: { $gte: prevFrom, $lte: prevTo },
    };

    const [currRaw, prevRaw] = await Promise.all([
      Booking.find(matchCurrent).sort({ end: -1 }).lean(),
      Booking.find(matchPrev).sort({ end: -1 }).lean(),
    ]);

    const curr = sumCompletedMetrics(currRaw);
    const prev = sumCompletedMetrics(prevRaw);

    const withdrawableBalance = Math.max(0, Math.floor(curr.totalRevenue * 0.85));

    const trends = {
      revenuePct: pctDelta(curr.totalRevenue, prev.totalRevenue),
      bookingsDelta: curr.completedBookings - prev.completedBookings,
      ratingDelta:
        curr.completedBookings !== prev.completedBookings
          ? Math.round((STATIC_AVG_RATING * (curr.completedBookings - prev.completedBookings)) / 1000)
          : null,
      hoursDelta: Math.round((curr.totalWorkingHours - prev.totalWorkingHours) * 10) / 10,
    };

    const recentTransactions = currRaw.slice(0, 8).map((b) => ({
      name: b.companionName || "Bạn đồng hành",
      date: b.end,
      amount: bookingRevenue(b),
    }));

    return res.status(200).json({
      summary: {
        totalRevenue: curr.totalRevenue,
        completedBookings: curr.completedBookings,
        averageRating: Math.round(STATIC_AVG_RATING * 100) / 100,
        totalWorkingHours: curr.totalWorkingHours,
        withdrawableBalance,
      },
      trends,
      series: buildSeries(currRaw, fromDate, toDate, granularity),
      recentTransactions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi báo cáo: " + error.message });
  }
}
