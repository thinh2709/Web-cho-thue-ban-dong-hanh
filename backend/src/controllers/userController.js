import { User } from "../models/User.js";

function sanitizeUser(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: o._id,
    fullName: o.fullName,
    phone: o.phone,
    avatar: o.avatar,
    birthDate: o.birthDate ?? "",
    address: o.address ?? "",
    bio: o.bio ?? "",
    hobbies: Array.isArray(o.hobbies) ? o.hobbies : [],
    gallery: Array.isArray(o.gallery) ? o.gallery : [],
    isDemo: Boolean(o.isDemo),
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

  const { fullName, phone, avatar, birthDate, address, bio, hobbies, gallery } = req.body ?? {};
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
  if (birthDate !== undefined) {
    if (typeof birthDate !== "string" || birthDate.length > 32) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    }
    user.birthDate = birthDate.trim();
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
    if (!Array.isArray(hobbies)) {
      return res.status(400).json({ message: "Sở thích không hợp lệ" });
    }
    const cleaned = hobbies
      .filter((h) => typeof h === "string")
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 24);
    if (cleaned.some((h) => h.length > 80)) {
      return res.status(400).json({ message: "Một sở thích quá dài" });
    }
    user.hobbies = cleaned;
  }
  if (gallery !== undefined) {
    if (!Array.isArray(gallery)) {
      return res.status(400).json({ message: "Thư viện ảnh không hợp lệ" });
    }
    const cleaned = gallery
      .filter((u) => typeof u === "string")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (cleaned.some((u) => u.length > 2000)) {
      return res.status(400).json({ message: "URL ảnh không hợp lệ" });
    }
    user.gallery = cleaned;
  }

  await user.save();
  return res.json(sanitizeUser(user));
}
