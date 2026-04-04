import Booking from '../models/Booking.js';

function parseDate(value, endOfDay = false) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

function msRange(from, to) {
  return Math.max(0, to.getTime() - from.getTime());
}

function defaultGranularity(from, to, requested) {
  if (requested === 'day' || requested === 'month') return requested;
  const days = msRange(from, to) / (24 * 60 * 60 * 1000);
  return days > 62 ? 'month' : 'day';
}

function buildDateFormat(granularity) {
  return granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';
}

async function aggregatePeriod(match) {
  const [row] = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        bookingCount: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        averageRating: { $avg: '$rating' },
        totalWorkingHours: { $sum: { $ifNull: ['$durationHours', 0] } },
      },
    },
  ]);
  return (
    row || {
      bookingCount: 0,
      totalRevenue: 0,
      averageRating: null,
      totalWorkingHours: 0,
    }
  );
}

export async function getSummary(req, res) {
  try {
    const { from, to, granularity: granRaw } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Tham số from và to là bắt buộc (ISO 8601)' });
    }
    const dFrom = parseDate(from, false);
    const dTo = parseDate(to, true);
    if (!dFrom || !dTo || dFrom > dTo) {
      return res.status(400).json({ message: 'Khoảng thời gian không hợp lệ' });
    }

    const granularity = defaultGranularity(dFrom, dTo, granRaw);
    const dateFormat = buildDateFormat(granularity);

    const matchCurrent = {
      status: 'completed',
      completedAt: { $gte: dFrom, $lte: dTo },
    };

    const rangeMs = msRange(dFrom, dTo);
    const prevTo = new Date(dFrom.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - rangeMs);
    const matchPrev = {
      status: 'completed',
      completedAt: { $gte: prevFrom, $lte: prevTo },
    };

    const [current, previous, series, recentRaw] = await Promise.all([
      aggregatePeriod(matchCurrent),
      aggregatePeriod(matchPrev),
      Booking.aggregate([
        { $match: matchCurrent },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$completedAt', timezone: 'Asia/Ho_Chi_Minh' },
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.find(matchCurrent)
        .sort({ completedAt: -1 })
        .limit(8)
        .select({ customerName: 1, amount: 1, completedAt: 1 })
        .lean(),
    ]);

    const totalRevenue = current.totalRevenue || 0;
    const withdrawableBalance = Math.round(totalRevenue * 0.85);

    const pct = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const delta = (curr, prev) => Math.round((curr - prev) * 10) / 10;

    const trends = {
      revenuePct: pct(current.totalRevenue, previous.totalRevenue),
      bookingsDelta: (current.bookingCount || 0) - (previous.bookingCount || 0),
      ratingDelta:
        current.averageRating != null && previous.averageRating != null
          ? Math.round((current.averageRating - previous.averageRating) * 10) / 10
          : null,
      hoursDelta: (current.totalWorkingHours || 0) - (previous.totalWorkingHours || 0),
    };

    const recentTransactions = recentRaw.map((b) => ({
      name: b.customerName || 'Khách hàng',
      amount: b.amount,
      date: b.completedAt,
    }));

    res.json({
      granularity,
      from: dFrom.toISOString(),
      to: dTo.toISOString(),
      summary: {
        totalRevenue,
        completedBookings: current.bookingCount || 0,
        averageRating:
          current.averageRating != null ? Math.round(current.averageRating * 10) / 10 : null,
        totalWorkingHours: Math.round((current.totalWorkingHours || 0) * 10) / 10,
        withdrawableBalance,
      },
      trends,
      series: series.map((s) => ({
        period: s._id,
        bookings: s.bookings,
        revenue: s.revenue,
      })),
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
  }
}
