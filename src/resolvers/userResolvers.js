const User = require('../models/User');
const Profile = require('../models/Profile');
const Subscription = require('../models/Subscription');
const { requireAuth } = require('../middleware/auth');
const { computeMatchScore } = require('../utils/matching');

const userResolvers = {
  Query: {
    // ── me ─────────────────────────────────────────────────────────
    me: async (_, __, context) => {
      const authUser = requireAuth(context);
      return await User.findById(authUser._id).lean();
    },

    // ── allUsers — Admin: list all users ───────────────────────────
    allUsers: async (_, { limit = 20, offset = 0 }, context) => {
      requireAuth(context);
      return await User.find().skip(offset).limit(limit).lean();
    },

    // ── Swipe feed with smart matching ─────────────────────────────
    swipeFeed: async (_, { limit = 20 }, context) => {
      const authUser = requireAuth(context);
      const Swipe = require('../models/Swipe');

      const myProfile = await Profile.findOne({ user: authUser._id }).lean();

      // IDs already swiped + self
      const swiped = await Swipe.find({ from: authUser._id }).distinct('to');
      swiped.push(authUser._id);

      // Candidate pool (fetch more than needed for scoring)
      const pool = await User.find({ _id: { $nin: swiped } })
        .limit(limit * 3)
        .lean();

      if (!myProfile || pool.length === 0) return pool.slice(0, limit);

      // Score each candidate, sort descending
      const profileMap = await Profile.find({
        user: { $in: pool.map((u) => u._id) },
      }).lean();

      const byUserId = Object.fromEntries(
        profileMap.map((p) => [String(p.user), p])
      );

      const scored = pool.map((u) => ({
        user: u,
        score: computeMatchScore(myProfile, byUserId[String(u._id)] || {}),
      }));

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, limit).map((s) => s.user);
    },

    // ── Search users ───────────────────────────────────────────────
    searchUsers: async (_, { q, limit = 20, city, minAge, maxAge }, context) => {
      requireAuth(context);

      const userIds = await User.find({
        username: { $regex: q, $options: 'i' },
      }).distinct('_id');

      const profileFilter = { user: { $in: userIds } };
      if (city) profileFilter.city = { $regex: city, $options: 'i' };
      if (minAge) profileFilter.age = { ...profileFilter.age, $gte: minAge };
      if (maxAge) profileFilter.age = { ...profileFilter.age, $lte: maxAge };

      const profiles = await Profile.find(profileFilter).limit(limit).lean();

      return await User.find({
        _id: { $in: profiles.map((p) => p.user) },
      }).lean();
    },
  },

  // ── Field resolvers ───────────────────────────────────────────────
  User: {
    id: (parent) => {
      return parent._id?.toString() || parent.id;
    },

    profile: async (parent) => {
      const userId = parent._id || parent.id;
      return await Profile.findOne({ user: userId }).lean();
    },

    subscription: async (parent) => {
      const userId = parent._id || parent.id;
      return await Subscription.findOne({ user: userId }).lean();
    },
  },

  Mutation: {
    // ── Update profile ─────────────────────────────────────────────
    updateProfile: async (_, { input }, context) => {
      const authUser = requireAuth(context);
      const { latitude, longitude, ...rest } = input;

      const update = { ...rest, updatedAt: new Date() };

      if (latitude !== undefined && longitude !== undefined) {
        update.location = {
          type: 'Point',
          coordinates: [longitude, latitude],
        };
      }

      return await Profile.findOneAndUpdate(
        { user: authUser._id },
        { $set: update },
        { new: true, upsert: true }
      ).lean();
    },
  },
};

module.exports = userResolvers;