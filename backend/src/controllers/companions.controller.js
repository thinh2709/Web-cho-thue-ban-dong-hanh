function parseISODate(dateValue) {
  if (!dateValue || typeof dateValue !== "string") return undefined;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function getStorage(req) {
  const storage = req.app?.locals?.storage;
  if (!storage) {
    throw new Error("Storage not configured");
  }
  return storage;
}

export async function getMyCompanionProfile(req, res) {
  const storage = getStorage(req);
  const companion = await storage.getMyProfile(req.actorUserId);
  res.json({ data: companion });
}

export async function patchMyCompanionProfile(req, res) {
  const storage = getStorage(req);
  const userId = req.actorUserId;
  const allowed = [
    "fullName",
    "birthDate",
    "phoneNumber",
    "address",
    "bio",
    "hobbies",
    "galleryUrls",
    "avatarUrl",
  ];

  const update = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      update[key] = req.body[key];
    }
  }

  if (update.birthDate && typeof update.birthDate === "string") {
    const d = parseISODate(update.birthDate);
    if (!d) return res.status(400).json({ message: "Invalid birthDate" });
    update.birthDate = d;
  }

  const companion = await storage.updateMyProfile(userId, update);

  res.json({ data: companion });
}

export async function getMyEarnings(req, res) {
  const storage = getStorage(req);
  const from = parseISODate(req.query.from);
  const to = parseISODate(req.query.to);
  const data = await storage.getMyEarnings(req.actorUserId, { from, to });
  res.json({ data });
}
