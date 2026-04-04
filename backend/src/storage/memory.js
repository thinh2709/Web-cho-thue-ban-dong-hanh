function formatDayKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function createMemoryStorage() {
  const companionsByUserId = new Map();
  const bookings = [];

  function getOrCreateCompanionByUserId(userId) {
    const existing = companionsByUserId.get(userId);
    if (existing) return existing;
    const created = {
      _id: `companion_${userId}`,
      userId,
      fullName: "Nguyễn Thị Lan",
      isVerified: true,
      rating: 4.9,
      reviewCount: 128,
      completedAppointments: 89,
      bio: "",
      hobbies: [],
      galleryUrls: [],
      avatarUrl: "",
      birthDate: null,
      phoneNumber: "",
      address: "",
    };
    companionsByUserId.set(userId, created);
    return created;
  }

  function seedDemoBookings(userId) {
    const companion = getOrCreateCompanionByUserId(userId);
    if (bookings.some((b) => b.companionId === companion._id)) return;

    const now = new Date();
    const day1 = new Date(now.getFullYear(), now.getMonth(), 3, 18, 0, 0);
    const day2 = new Date(now.getFullYear(), now.getMonth(), 7, 20, 0, 0);
    const day3 = new Date(now.getFullYear(), now.getMonth(), 12, 15, 0, 0);

    bookings.push(
      {
        id: "b1",
        userId,
        companionId: companion._id,
        status: "completed",
        amount: 350000,
        completedAt: day1,
      },
      {
        id: "b2",
        userId,
        companionId: companion._id,
        status: "completed",
        amount: 450000,
        completedAt: day2,
      },
      {
        id: "b3",
        userId,
        companionId: companion._id,
        status: "completed",
        amount: 550000,
        completedAt: day3,
      },
    );
  }

  return {
    getMyProfile(userId) {
      seedDemoBookings(userId);
      return getOrCreateCompanionByUserId(userId);
    },
    updateMyProfile(userId, update) {
      const companion = getOrCreateCompanionByUserId(userId);
      const next = { ...companion, ...update };
      companionsByUserId.set(userId, next);
      return next;
    },
    getMyEarnings(userId, { from, to }) {
      seedDemoBookings(userId);
      const companion = getOrCreateCompanionByUserId(userId);
      const filtered = bookings.filter((b) => {
        if (b.companionId !== companion._id) return false;
        if (b.status !== "completed") return false;
        if (from && b.completedAt < from) return false;
        if (to && b.completedAt > to) return false;
        return true;
      });

      const totalsByDay = new Map();
      for (const b of filtered) {
        const key = formatDayKey(b.completedAt);
        const existing = totalsByDay.get(key) || { date: key, totalAmount: 0, count: 0 };
        existing.totalAmount += b.amount || 0;
        existing.count += 1;
        totalsByDay.set(key, existing);
      }

      const byDay = [...totalsByDay.values()].sort((a, b) => a.date.localeCompare(b.date));
      const totalAmount = filtered.reduce((s, b) => s + (b.amount || 0), 0);

      return {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
        totalAmount,
        completedCount: filtered.length,
        byDay,
      };
    },
  };
}

