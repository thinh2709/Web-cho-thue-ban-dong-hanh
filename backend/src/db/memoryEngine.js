import { randomBytes } from "node:crypto";

export function newObjectId() {
  return randomBytes(12).toString("hex");
}

export function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-f]{24}$/i.test(id);
}

const users = [];
const bookings = [];
const pricing = [];
const categories = [];
const favorites = [];
const companionProfiles = [];
const partnerApplications = [];

function cmpDate(a, b) {
  return new Date(a).getTime() - new Date(b).getTime();
}

function getField(doc, key) {
  if (key === "date" && doc.date == null) return doc.end;
  return doc[key];
}

function match(doc, filter) {
  if (!filter || typeof filter !== "object") return true;
  for (const [key, cond] of Object.entries(filter)) {
    if (key === "$or") {
      if (!Array.isArray(cond) || !cond.some((sub) => match(doc, sub))) return false;
      continue;
    }
    const val = getField(doc, key);
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date) && !Array.isArray(cond)) {
      if ("$gte" in cond) {
        const c = new Date(cond.$gte);
        const v = new Date(val);
        if (Number.isNaN(v.getTime()) || v < c) return false;
      }
      if ("$lte" in cond) {
        const c = new Date(cond.$lte);
        const v = new Date(val);
        if (Number.isNaN(v.getTime()) || v > c) return false;
      }
      continue;
    }
    if (String(val) !== String(cond) && val !== cond) return false;
  }
  return true;
}

function filterBookings(f) {
  return bookings.filter((b) => match(b, f));
}

class BookingCursor {
  constructor(items) {
    this._items = [...items];
    this._fields = null;
  }
  sort(spec) {
    const k = Object.keys(spec)[0];
    const dir = spec[k] === -1 ? -1 : 1;
    this._items.sort((a, b) => cmpDate(a[k], b[k]) * dir);
    return this;
  }
  limit(n) {
    this._items = this._items.slice(0, n);
    return this;
  }
  select(fields) {
    this._fields = fields;
    return this;
  }
  lean() {
    const rows = this._items.map((b) => {
      if (!this._fields) return { ...b };
      const o = {};
      for (const [k, v] of Object.entries(this._fields)) {
        if (v) o[k] = b[k];
      }
      return o;
    });
    return Promise.resolve(rows);
  }
  then(res, rej) {
    return this.lean().then(res, rej);
  }
}

function ensureUserSave(u) {
  if (u.__mem) return u;
  u.__mem = true;
  u.save = async () => {
    u.updatedAt = new Date();
    return u;
  };
  u.toObject = () => {
    const { save, toObject, __mem, ...rest } = u;
    return rest;
  };
  return u;
}

function ensureBookingSave(b) {
  if (b.__mem) return;
  b.__mem = true;
  b.save = async () => {
    b.updatedAt = new Date();
    return b;
  };
  b.toObject = () => {
    const { save, toObject, __mem, ...rest } = b;
    return rest;
  };
}

function fmtDateVN(d, mongoFmt) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const utc = x.getTime() + x.getTimezoneOffset() * 60000;
  const vn = new Date(utc + 7 * 3600000);
  const y = vn.getFullYear();
  const m = String(vn.getMonth() + 1).padStart(2, "0");
  const day = String(vn.getDate()).padStart(2, "0");
  if (mongoFmt === "%Y-%m") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

async function bookingAggregate(pipeline) {
  const m0 = pipeline[0];
  if (!m0?.$match) return [];
  const matched = filterBookings(m0.$match);
  const m1 = pipeline[1];

  if (m1?.$group && m1.$group._id === null && m1.$group.total != null) {
    const total = matched.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
    return [{ _id: null, total }];
  }

  if (m1?.$group && m1.$group._id === null) {
    let bookingCount = 0;
    let totalRevenue = 0;
    let ratingSum = 0;
    let ratingN = 0;
    let totalWorkingHours = 0;
    for (const b of matched) {
      bookingCount += 1;
      totalRevenue += Number(b.amount) || 0;
      if (b.rating != null) {
        ratingSum += Number(b.rating);
        ratingN += 1;
      }
      totalWorkingHours += Number(b.durationHours) || 0;
    }
    return [
      {
        _id: null,
        bookingCount,
        totalRevenue,
        averageRating: ratingN ? ratingSum / ratingN : null,
        totalWorkingHours,
      },
    ];
  }

  if (
    m1?.$group &&
    m1.$group._id &&
    typeof m1.$group._id === "object" &&
    m1.$group._id.$dateToString
  ) {
    const fmt = m1.$group._id.$dateToString.format;
    const field = m1.$group._id.$dateToString.date.replace(/^\$/, "");
    const buckets = new Map();
    for (const b of matched) {
      const key = fmtDateVN(b[field], fmt);
      const prev = buckets.get(key) || { bookings: 0, revenue: 0 };
      prev.bookings += 1;
      prev.revenue += Number(b.amount) || 0;
      buckets.set(key, prev);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ _id: k, bookings: v.bookings, revenue: v.revenue }));
  }

  return [];
}

class PricingCursor {
  constructor(items) {
    this._items = [...items];
  }
  sort(spec) {
    const keys = Object.keys(spec);
    this._items.sort((a, b) => {
      for (const k of keys) {
        const dir = spec[k] === -1 ? -1 : 1;
        const va = String(a[k] ?? "");
        const vb = String(b[k] ?? "");
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
      }
      return 0;
    });
    return this;
  }
  lean() {
    return Promise.resolve(this._items.map((p) => ({ ...p })));
  }
  then(res, rej) {
    return this.lean().then(res, rej);
  }
}

function filterPricing(f) {
  return pricing.filter((p) => match(p, f));
}

function wrapCategory(raw) {
  if (!raw) return null;
  if (raw.__wrap) return raw;
  raw.__wrap = true;
  raw.save = async () => {
    raw.updatedAt = new Date();
    return raw;
  };
  raw.deleteOne = async () => {
    const i = categories.findIndex((c) => String(c._id) === String(raw._id));
    if (i >= 0) categories.splice(i, 1);
  };
  return raw;
}

class CompanionProfileCursor {
  constructor(items) {
    this._items = items;
    this._populate = null;
    this._limitN = null;
  }
  populate(path, select) {
    this._populate = { path, select };
    return this;
  }
  limit(n) {
    this._limitN = n;
    return this;
  }
  async lean() {
    let rows = this._items.map((p) => ({ ...p }));
    if (this._populate?.path === "userId") {
      const fields = (this._populate.select || "").split(/\s+/).filter(Boolean);
      rows = rows.map((p) => {
        const u = users.find((x) => String(x._id) === String(p.userId));
        const userId =
          u && fields.length
            ? Object.fromEntries(
                ["_id", ...fields].map((k) => [k, u[k] ?? (k === "_id" ? u._id : undefined)])
              )
            : u
              ? { _id: u._id, fullName: u.fullName, avatar: u.avatar }
              : p.userId;
        return { ...p, userId };
      });
    }
    if (this._limitN != null) rows = rows.slice(0, this._limitN);
    return rows;
  }
  then(res, rej) {
    return this.lean().then(res, rej);
  }
}

class FavoriteCursor {
  constructor(items) {
    this._items = items;
    this._pop = null;
  }
  populate(path) {
    this._pop = path;
    return this;
  }
  async lean() {
    let rows = this._items.map((f) => ({ ...f }));
    if (this._pop === "companionId") {
      rows = rows.map((f) => {
        const u = users.find((x) => String(x._id) === String(f.companionId));
        return { ...f, companionId: u ? { ...u } : f.companionId };
      });
    }
    return rows;
  }
  then(res, rej) {
    return this.lean().then(res, rej);
  }
}

class PartnerApplicationCursor {
  constructor(items) {
    this._items = [...items];
  }
  sort(spec) {
    const k = Object.keys(spec)[0];
    const dir = spec[k] === -1 ? -1 : 1;
    this._items.sort((a, b) => cmpDate(a[k], b[k]) * dir);
    return this;
  }
  then(res, rej) {
    return Promise.resolve(this._items).then(res, rej);
  }
}

class CompanionProfileOneQuery {
  constructor(doc) {
    this._doc = doc;
    this._pop = null;
  }
  populate(path, select) {
    this._pop = { path, select };
    return this;
  }
  async lean() {
    if (!this._doc) return null;
    const p = { ...this._doc };
    if (this._pop?.path === "userId") {
      const u = users.find((x) => String(x._id) === String(p.userId));
      if (u) {
        const fields = (this._pop.select || "").split(/\s+/).filter(Boolean);
        p.userId = Object.fromEntries(
          ["_id", ...fields].map((key) => [key, u[key] ?? (key === "_id" ? u._id : undefined)])
        );
      }
    }
    return p;
  }
  then(res, rej) {
    return this.lean().then(res, rej);
  }
}

function bootstrap() {
  const t = new Date();
  const demoRenter = newObjectId();
  users.push({
    _id: demoRenter,
    isDemo: true,
    fullName: "Người thuê (demo)",
    phone: "",
    avatar: "",
    birthDate: "",
    address: "",
    bio: "",
    hobbies: [],
    gallery: [],
    createdAt: t,
    updatedAt: t,
  });

  const companionUserId = newObjectId();
  users.push({
    _id: companionUserId,
    fullName: "Nguyễn Thị Lan",
    phone: "",
    avatar: "",
    birthDate: "",
    address: "",
    bio: "",
    hobbies: [],
    gallery: [],
    isDemo: false,
    createdAt: t,
    updatedAt: t,
  });

  const pkgs = [
    {
      packageName: "Đi cafe",
      price: 400_000,
      maxPrice: 800_000,
      unit: "buổi",
      category: "basic",
      isPublic: true,
      description: "Dịch vụ đồng hành đi cafe, trò chuyện thư giãn.",
    },
    {
      packageName: "Đi ăn uống",
      price: 500_000,
      maxPrice: 1_000_000,
      unit: "buổi",
      category: "basic",
      isPublic: true,
      description: "Đồng hành bữa ăn tại nhà hàng hoặc quán.",
    },
    {
      packageName: "Dạo phố",
      price: 450_000,
      maxPrice: 900_000,
      unit: "buổi",
      category: "basic",
      isPublic: true,
      description: "Dạo phố, shopping hoặc tham quan trong thành phố.",
    },
    {
      packageName: "Tham gia sự kiện",
      price: 1_000_000,
      maxPrice: 3_000_000,
      unit: "buổi",
      category: "premium",
      isPublic: true,
      description: "Đồng hành sự kiện, tiệc hoặc hội nghị.",
    },
  ];
  for (const p of pkgs) {
    pricing.push({ _id: newObjectId(), ...p, createdAt: t, updatedAt: t });
  }

  categories.push({
    _id: newObjectId(),
    name: "Ăn uống",
    description: "",
    icon: "",
    isActive: true,
    createdAt: t,
    updatedAt: t,
  });
  categories.push({
    _id: newObjectId(),
    name: "Du lịch",
    description: "",
    icon: "",
    isActive: true,
    createdAt: t,
    updatedAt: t,
  });

  const now = new Date();
  for (let i = 0; i < 18; i += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - (i % 14));
    const end = new Date(day);
    end.setHours(18, 0, 0, 0);
    const start = new Date(end.getTime() - 2 * 3600000);
    const amt = 500_000 + i * 12_000;
    bookings.push({
      _id: newObjectId(),
      userId: demoRenter,
      companionId: i % 3 === 0 ? companionUserId : undefined,
      companionName: `Đồng hành ${i}`,
      start,
      end,
      completedAt: end,
      status: "completed",
      amount: amt,
      totalPrice: amt,
      customerName: `Khách ${i}`,
      rating: 4 + (i % 10) / 10,
      durationHours: 2 + (i % 3) * 0.5,
      note: "",
      createdAt: t,
      updatedAt: t,
    });
  }

  companionProfiles.push({
    _id: newObjectId(),
    userId: companionUserId,
    bio: "Đồng hành thân thiện.",
    skills: ["Trò chuyện", "Cafe"],
    hourlyRate: 250_000,
    location: "TP.HCM",
    rating: 4.9,
    reviewCount: 12,
    availability: ["T2", "T4"],
    images: [],
    categories: [],
    createdAt: t,
    updatedAt: t,
  });
}

bootstrap();

export const User = {
  async findById(id) {
    const u = users.find((x) => String(x._id) === String(id));
    return u ? ensureUserSave(u) : null;
  },
  async findOne(query) {
    const u = users.find((x) => {
      for (const [k, v] of Object.entries(query)) {
        if (x[k] !== v) return false;
      }
      return true;
    });
    return u ? ensureUserSave(u) : null;
  },
  async create(data) {
    const tt = new Date();
    const u = { _id: newObjectId(), ...data, createdAt: tt, updatedAt: tt };
    users.push(u);
    return ensureUserSave(u);
  },
  async findByIdAndUpdate(id, patch, _opts) {
    const i = users.findIndex((x) => String(x._id) === String(id));
    if (i < 0) return null;
    const flat = patch && typeof patch === "object" && patch.$set ? patch.$set : patch;
    Object.assign(users[i], flat, { updatedAt: new Date() });
    return users[i];
  },
};

export const Booking = {
  find(filter) {
    return new BookingCursor(filterBookings(filter));
  },
  async findById(id) {
    const b = bookings.find((x) => String(x._id) === String(id));
    if (!b) return null;
    ensureBookingSave(b);
    return b;
  },
  async create(doc) {
    const tt = new Date();
    const b = { _id: newObjectId(), ...doc, createdAt: tt, updatedAt: tt };
    bookings.push(b);
    ensureBookingSave(b);
    return b;
  },
  async insertMany(docs) {
    const tt = new Date();
    return docs.map((d) => {
      const b = { _id: newObjectId(), ...d, createdAt: tt, updatedAt: tt };
      bookings.push(b);
      return b;
    });
  },
  async countDocuments(filter) {
    return filterBookings(filter).length;
  },
  aggregate(pipeline) {
    return Promise.resolve(bookingAggregate(pipeline));
  },
};

export const Pricing = {
  find(filter) {
    return new PricingCursor(filterPricing(filter));
  },
  async create(data) {
    const tt = new Date();
    const p = { _id: newObjectId(), ...data, createdAt: tt, updatedAt: tt };
    pricing.push(p);
    return p;
  },
  async findByIdAndUpdate(id, patch, _opts) {
    const i = pricing.findIndex((x) => String(x._id) === String(id));
    if (i < 0) return null;
    const flat = patch && typeof patch === "object" && patch.$set ? patch.$set : patch;
    const next = { ...pricing[i], ...flat, updatedAt: new Date() };
    pricing[i] = next;
    return next;
  },
  async findByIdAndDelete(id) {
    const i = pricing.findIndex((x) => String(x._id) === String(id));
    if (i < 0) return null;
    const [removed] = pricing.splice(i, 1);
    return removed;
  },
};

export const Category = {
  async find(filter = {}) {
    return categories.filter((c) => match(c, filter)).map((c) => ({ ...c }));
  },
  async findById(id) {
    const c = categories.find((x) => String(x._id) === String(id));
    return c ? wrapCategory(c) : null;
  },
  async findOne(query) {
    const c = categories.find((x) => match(x, query));
    return c ? wrapCategory(c) : null;
  },
  async create(data) {
    const tt = new Date();
    const c = {
      _id: newObjectId(),
      isActive: true,
      ...data,
      createdAt: tt,
      updatedAt: tt,
    };
    categories.push(c);
    return wrapCategory(c);
  },
  async findByIdAndUpdate(id, patch, opts) {
    const i = categories.findIndex((x) => String(x._id) === String(id));
    if (i < 0) return null;
    Object.assign(categories[i], patch, { updatedAt: new Date() });
    return opts?.new !== false ? categories[i] : null;
  },
  async findByIdAndDelete(id) {
    const i = categories.findIndex((x) => String(x._id) === String(id));
    if (i < 0) return null;
    const [removed] = categories.splice(i, 1);
    return removed;
  },
};

export class Favorite {
  constructor(data) {
    Object.assign(this, data);
  }
  async save() {
    const t = new Date();
    if (!this._id) {
      this._id = newObjectId();
      this.createdAt = t;
      this.updatedAt = t;
      favorites.push(this);
    } else {
      this.updatedAt = t;
      const i = favorites.findIndex((f) => String(f._id) === String(this._id));
      if (i >= 0) Object.assign(favorites[i], { ...this });
    }
    return this;
  }
  static find(filter) {
    const rows = favorites.filter((f) => match(f, filter));
    return new FavoriteCursor(rows);
  }
  static findOne(filter) {
    return Promise.resolve(favorites.find((f) => match(f, filter)) ?? null);
  }
  static findOneAndDelete(filter) {
    const i = favorites.findIndex((f) => match(f, filter));
    if (i < 0) return Promise.resolve(null);
    const [removed] = favorites.splice(i, 1);
    return Promise.resolve(removed);
  }
}

export const CompanionProfile = {
  find() {
    return new CompanionProfileCursor(companionProfiles.map((p) => ({ ...p })));
  },
  findOne(filter) {
    const p = companionProfiles.find((x) => match(x, filter));
    return new CompanionProfileOneQuery(p ? { ...p } : null);
  },
  async findOneAndUpdate(filter, body, opts) {
    let p = companionProfiles.find((x) => match(x, filter));
    const tt = new Date();
    if (!p && opts?.upsert) {
      p = { _id: newObjectId(), ...filter, ...body, createdAt: tt, updatedAt: tt };
      companionProfiles.push(p);
      return p;
    }
    if (!p) return null;
    Object.assign(p, body, { updatedAt: tt });
    return p;
  },
};

export class PartnerApplication {
  constructor(data = {}) {
    Object.assign(this, data);
  }
  async save() {
    const t = new Date();
    if (!this._id) {
      this._id = newObjectId();
      this.status = this.status || "pending";
      this.userId = this.userId || newObjectId();
      this.createdAt = t;
      this.updatedAt = t;
      partnerApplications.push(this);
    } else {
      this.updatedAt = t;
      const i = partnerApplications.findIndex((p) => String(p._id) === String(this._id));
      if (i >= 0) Object.assign(partnerApplications[i], { ...this });
    }
    return this;
  }
  static async create(data) {
    const p = new PartnerApplication({
      userId: data.userId || newObjectId(),
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      bio: data.bio,
      skills: data.skills || [],
      experience: data.experience,
      status: data.status || "pending",
    });
    await p.save();
    return p;
  }
  static find() {
    return new PartnerApplicationCursor([...partnerApplications]);
  }
  static async findById(id) {
    const raw = partnerApplications.find((x) => String(x._id) === String(id));
    return raw ? new PartnerApplication({ ...raw }) : null;
  }
  static async findByIdAndUpdate(id, patch, opts) {
    const i = partnerApplications.findIndex((x) => String(x._id) === String(id));
    if (i < 0) return null;
    Object.assign(partnerApplications[i], patch, { updatedAt: new Date() });
    return opts?.new !== false ? partnerApplications[i] : null;
  }
}

export { users, bookings, pricing, categories, favorites, companionProfiles, partnerApplications };
