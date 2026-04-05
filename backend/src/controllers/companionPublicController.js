import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { bookingRevenue } from "../utils/bookingMoney.js";

function toProfileDoc(user) {
  if (!user) return null;
  const o = user.toObject ? user.toObject() : user;
  return {
    fullName: o.fullName ?? "",
    birthDate: o.birthDate ?? "",
    phoneNumber: o.phone ?? "",
    address: o.address ?? "",
    bio: o.bio ?? "",
    hobbies: Array.isArray(o.hobbies) ? o.hobbies : [],
    reviewCount: 0,
    rating: 0,
    completedAppointments: 0,
    isVerified: true,
  };
}

export async function getCompanionMe(req, res) {
  const userId = req.get("X-User-Id");
  if (userId && mongoose.isValidObjectId(userId)) {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json({ data: toProfileDoc(user) });
  }

  let demo = await User.findOne({ isDemo: true });
  if (!demo) {
    demo = await User.create({ isDemo: true, fullName: "Bạn đồng hành (demo)" });
  }
  return res.json({ data: toProfileDoc(demo) });
}

export async function patchCompanionMe(req, res) {
  const userId = req.get("X-User-Id");
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: "Thiếu X-User-Id (đăng nhập tạm)" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

  const { fullName, birthDate, phoneNumber, address, bio, hobbies } = req.body ?? {};
  if (fullName !== undefined) {
    if (typeof fullName !== "string" || fullName.length > 120) {
      return res.status(400).json({ message: "Họ tên không hợp lệ" });
    }
    user.fullName = fullName.trim();
  }
  if (birthDate !== undefined && birthDate !== null) {
    const d = new Date(birthDate);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    user.birthDate = `${yyyy}-${mm}-${dd}`;
  }
  if (phoneNumber !== undefined) {
    if (typeof phoneNumber !== "string" || phoneNumber.length > 20) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    user.phone = phoneNumber.trim();
  }
  if (address !== undefined) {
    if (typeof address !== "string" || address.length > 300) {
      return res.status(400).json({ message: "Địa chỉ không hợp lệ" });
    }
    user.address = address.trim();
  }
  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > 2000) {
      return res.status(400).json({ message: "Giới thiệu không hợp lệ" });
    }
    user.bio = bio.trim();
  }
  if (hobbies !== undefined) {
    if (!Array.isArray(hobbies) || hobbies.some((h) => typeof h !== "string")) {
      return res.status(400).json({ message: "Sở thích không hợp lệ" });
    }
    user.hobbies = hobbies.map((h) => h.trim()).filter(Boolean).slice(0, 24);
  }

  await user.save();
  return res.json({ data: toProfileDoc(user) });
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/companions/me/earnings — khớp `frontend/pages/earnings.html`
 * Booking completed: theo companionId (User) hoặc khớp companionName với fullName (demo tĩnh).
 */
export async function getCompanionEarnings(req, res) {
  const userId = req.get("X-User-Id");
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: "Thiếu hoặc sai X-User-Id" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

  const fromQ = req.query.from;
  const toQ = req.query.to;
  const fromDate = fromQ ? new Date(fromQ) : new Date(0);
  const toDate = toQ ? new Date(toQ) : new Date(8640000000000000);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return res.status(400).json({ message: "from/to không hợp lệ" });
  }

  const name = (user.fullName || "").trim();
  const or = [{ companionId: user._id }];
  if (name) {
    or.push({ companionName: new RegExp(`^${escapeRegex(name)}$`, "i") });
  }

  const list = await Booking.find({
    status: "completed",
    start: { $gte: fromDate, $lte: toDate },
    $or: or,
  })
    .sort({ start: 1 })
    .lean();

  let totalAmount = 0;
  const dayMap = new Map();
  for (const b of list) {
    const amt = bookingRevenue(b);
    totalAmount += amt;
    const d = new Date(b.start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const cur = dayMap.get(key) || { count: 0, totalAmount: 0 };
    cur.count += 1;
    cur.totalAmount += amt;
    dayMap.set(key, cur);
  }

  const byDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      count: v.count,
      totalAmount: v.totalAmount,
    }));

  return res.json({
    data: {
      totalAmount,
      completedCount: list.length,
      byDay,
    },
  });
}
