import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function createToken({ userId, email, name }) {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }

  return jwt.sign({ userId, email, name }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!name) {
      res.status(400).json({ message: "Tên là bắt buộc" });
      return;
    }

    if (!email || !email.includes("@")) {
      res.status(400).json({ message: "Email không hợp lệ" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
      return;
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      res.status(409).json({ message: "Email đã được sử dụng" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = createToken({ userId: user._id.toString(), email: user.email, name: user.name });

    res.status(201).json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !email.includes("@")) {
      res.status(400).json({ message: "Email không hợp lệ" });
      return;
    }

    if (!password) {
      res.status(400).json({ message: "Mật khẩu là bắt buộc" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      return;
    }

    const token = createToken({ userId: user._id.toString(), email: user.email, name: user.name });

    res.json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
}

