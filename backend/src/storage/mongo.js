import Booking from "../models/Booking.js";
import Companion from "../models/Companion.js";

async function getOrCreateCompanionByUserId(userId) {
  const existing = await Companion.findOne({ userId }).lean();
  if (existing) return existing;

  const created = await Companion.create({
    userId,
    fullName: "Nguyễn Thị Lan",
    isVerified: true,
    rating: 4.9,
    reviewCount: 128,
    completedAppointments: 89,
    bio: "",
    hobbies: [],
    galleryUrls: [],
  });

  return created.toObject();
}

export function createMongoStorage() {
  return {
    async getMyProfile(userId) {
      return getOrCreateCompanionByUserId(userId);
    },
    async updateMyProfile(userId, update) {
      const companion = await Companion.findOneAndUpdate({ userId }, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }).lean();
      return companion;
    },
    async getMyEarnings(userId, { from, to }) {
      const companion = await getOrCreateCompanionByUserId(userId);

      const match = {
        companionId: companion._id,
        status: "completed",
      };

      if (from || to) {
        match.completedAt = {};
        if (from) match.completedAt.$gte = from;
        if (to) match.completedAt.$lte = to;
      }

      const byDay = await Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$completedAt",
              },
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalAmount: 1,
            count: 1,
          },
        },
      ]);

      const summary = await Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalAmount: 1,
            count: 1,
          },
        },
      ]);

      return {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
        totalAmount: summary[0]?.totalAmount ?? 0,
        completedCount: summary[0]?.count ?? 0,
        byDay,
      };
    },
  };
}

