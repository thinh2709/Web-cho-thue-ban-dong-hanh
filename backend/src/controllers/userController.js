import { User } from "../models/User.js";

function sanitizeUser(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: o._id,
    fullName: o.fullName,
    phone: o.phone,
    avatar: o.avatar,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export async function getMe(req, res) {
  const userId = req.get("X-User-Id");
  if (userId) {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.json(sanitizeUser(user));
  }

  let demo = await User.findOne({ isDemo: true });
  if (!demo) {
    demo = await User.create({
      isDemo: true,
      fullName: "Người thuê (demo)",
      phone: "",
      avatar: "",
    });
  }
  return res.json(sanitizeUser(demo));
}

export async function patchMe(req, res) {
  const userId = req.get("X-User-Id");
  if (!userId) {
    return res.status(401).json({ message: "Thiếu X-User-Id (đăng nhập tạm)" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const { fullName, phone, avatar } = req.body ?? {};
  if (fullName !== undefined) {
    if (typeof fullName !== "string" || fullName.length > 120) {
      return res.status(400).json({ message: "Họ tên không hợp lệ" });
    }
    user.fullName = fullName.trim();
  }
  if (phone !== undefined) {
    if (typeof phone !== "string" || phone.length > 20) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    user.phone = phone.trim();
  }
  if (avatar !== undefined) {
    if (typeof avatar !== "string" || avatar.length > 2000) {
      return res.status(400).json({ message: "Ảnh đại diện (URL) không hợp lệ" });
    }
    user.avatar = avatar.trim();
  }

  await user.save();
  return res.json(sanitizeUser(user));
}
