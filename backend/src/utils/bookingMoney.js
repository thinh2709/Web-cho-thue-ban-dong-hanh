import { getCompanionById } from "../data/companions.js";

export function bookingDurationHours(booking) {
  const a = new Date(booking.start);
  const b = new Date(booking.end);
  const ms = b - a;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / 3600000;
}

/** Doanh thu một booking: ưu tiên totalPrice đã lưu, không thì giờ × giá companion tĩnh / mặc định. */
export function bookingRevenue(booking) {
  const stored = booking.totalPrice;
  if (stored != null && Number.isFinite(Number(stored)) && Number(stored) >= 0) {
    return Math.round(Number(stored));
  }
  const hours = bookingDurationHours(booking);
  const key = booking.staticCompanionKey;
  const c = key ? getCompanionById(key) : null;
  const rate = c?.pricePerHour ?? 500000;
  return Math.round(hours * rate);
}
