import mongoose from "mongoose";
import { Booking, bookingStatuses } from "../models/Booking.js";
import { User } from "../models/User.js";
import { getCompanionById } from "../data/companions.js";

function sanitizeBooking(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: o._id,
    userId: o.userId,
    companionId: o.companionId,
    companionName: o.companionName,
    start: o.start,
    end: o.end,
    status: o.status,
    note: o.note,
    totalPrice: o.totalPrice,
    service: o.service,
    staticCompanionKey: o.staticCompanionKey,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function ensureSampleBookings(userId) {
  const count = await Booking.countDocuments({ userId });
  if (count > 0) return;

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  await Booking.insertMany([
    {
      userId,
      companionName: "Bạn đồng hành A",
      start: new Date(now.getTime() + day),
      end: new Date(now.getTime() + day + 2 * 60 * 60 * 1000),
      status: "confirmed",
      note: "Đi dạo phố cuối tuần",
    },
    {
      userId,
      companionName: "Bạn đồng hành B",
      start: new Date(now.getTime() + 3 * day),
      end: new Date(now.getTime() + 3 * day + 3 * 60 * 60 * 1000),
      status: "pending",
      note: "",
    },
    {
      userId,
      companionName: "Nguyễn Thị Lan",
      staticCompanionKey: "c1",
      start: new Date(now.getTime() - 2 * day),
      end: new Date(now.getTime() - 2 * day + 2 * 60 * 60 * 1000),
      status: "completed",
      note: "Demo doanh thu",
      totalPrice: 1_000_000,
      service: "Đi cafe",
    },
  ]);
}

export async function createBooking(req, res) {
  const userId = req.get("X-User-Id");
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: "Thiếu hoặc sai X-User-Id" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const { companionName, start, end, note, companionId, totalPrice, service, staticCompanionKey } =
    req.body ?? {};
  const name =
    typeof companionName === "string" && companionName.trim()
      ? companionName.trim().slice(0, 120)
      : "Bạn đồng hành";
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
    return res.status(400).json({ message: "Khung giờ không hợp lệ" });
  }

  const n = typeof note === "string" && note.length <= 2000 ? note.trim() : "";
  const svc = typeof service === "string" ? service.trim().slice(0, 200) : "";

  let staticKey =
    typeof staticCompanionKey === "string" && staticCompanionKey.trim()
      ? staticCompanionKey.trim().slice(0, 32)
      : "";
  if (!staticKey && companionId && typeof companionId === "string" && !mongoose.isValidObjectId(companionId)) {
    if (getCompanionById(companionId)) staticKey = companionId;
  }

  const doc = {
    userId,
    companionName: name,
    start: s,
    end: e,
    note: n,
    status: "pending",
  };
  if (companionId && mongoose.isValidObjectId(companionId)) {
    doc.companionId = companionId;
  }
  if (staticKey) doc.staticCompanionKey = staticKey;
  if (svc) doc.service = svc;

  const tp = totalPrice != null ? Number(totalPrice) : NaN;
  if (Number.isFinite(tp) && tp >= 0) {
    doc.totalPrice = Math.round(tp);
  }

  const booking = await Booking.create(doc);
  return res.status(201).json(sanitizeBooking(booking));
}

export async function getMyBookings(req, res) {
  const userId = req.get("X-User-Id");
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: "Thiếu hoặc sai X-User-Id" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  if (user.isDemo) {
    await ensureSampleBookings(user._id);
  }

  const list = await Booking.find({ userId }).sort({ start: -1 }).lean();
  return res.json(list.map(sanitizeBooking));
}

export async function patchBooking(req, res) {
  const userId = req.get("X-User-Id");
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: "Thiếu hoặc sai X-User-Id" });
  }

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Id booking không hợp lệ" });
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return res.status(404).json({ message: "Không tìm thấy booking" });
  }
  if (String(booking.userId) !== userId) {
    return res.status(403).json({ message: "Không có quyền với booking này" });
  }

  const { status, note, start, end } = req.body ?? {};

  if (status !== undefined) {
    if (!bookingStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    if (status === "cancelled") {
      if (booking.status === "completed" || booking.status === "cancelled") {
        return res.status(409).json({ message: "Không thể hủy booking ở trạng thái này" });
      }
      booking.status = "cancelled";
    } else {
      return res
        .status(400)
        .json({ message: "Người thuê chỉ được gửi trạng thái cancelled qua API này" });
    }
  }

  if (note !== undefined) {
    if (booking.status !== "pending") {
      return res.status(409).json({ message: "Chỉ sửa ghi chú khi booking đang chờ xác nhận" });
    }
    if (typeof note !== "string" || note.length > 2000) {
      return res.status(400).json({ message: "Ghi chú không hợp lệ" });
    }
    booking.note = note.trim();
  }

  if (start !== undefined || end !== undefined) {
    if (booking.status !== "pending") {
      return res
        .status(409)
        .json({ message: "Chỉ đổi khung giờ khi booking đang chờ xác nhận" });
    }
    const nextStart = start !== undefined ? new Date(start) : booking.start;
    const nextEnd = end !== undefined ? new Date(end) : booking.end;
    if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) {
      return res.status(400).json({ message: "Thời gian không hợp lệ" });
    }
    if (nextEnd <= nextStart) {
      return res.status(400).json({ message: "Giờ kết thúc phải sau giờ bắt đầu" });
    }
    booking.start = nextStart;
    booking.end = nextEnd;
  }

  await booking.save();
  return res.json(sanitizeBooking(booking));
}
