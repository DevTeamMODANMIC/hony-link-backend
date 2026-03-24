const Short        = require('../models/Short');
const Subscription = require('../models/Subscription');
const { requireAuth } = require('../middleware/auth');

const shortResolvers = {
  Query: {
    // ── Shorts feed (subscribers only) ────────────────────────────
    shortsFeed: async (_, { limit = 20 }, context) => {
      const authUser = requireAuth(context);

      const sub = await Subscription.findOne({ user: authUser._id });
      const isPaid = sub && sub.plan !== 'free' && sub.status === 'active';

      if (!isPaid) {
        throw new Error('Shorts are available to subscribers only. Upgrade your plan to watch videos.');
      }

      return Short.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('uploader');
    },
  },

  Mutation: {
    // ── Upload short ───────────────────────────────────────────────
    uploadShort: async (_, { videoUrl, caption }, context) => {
      const authUser = requireAuth(context);

      if (!videoUrl?.trim()) throw new Error('videoUrl is required.');

      const short = await Short.create({
        uploader: authUser._id,
        videoUrl:  videoUrl.trim(),
        caption:   caption?.trim() || '',
      });

      return short.populate('uploader');
    },

    // ── Subscribe ──────────────────────────────────────────────────
    subscribe: async (_, { plan }, context) => {
      const authUser = requireAuth(context);

      const validPlans = ['free', 'basic', 'premium'];
      if (!validPlans.includes(plan)) {
        throw new Error(`Invalid plan. Choose from: ${validPlans.join(', ')}`);
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1-month subscription

      return Subscription.findOneAndUpdate(
        { user: authUser._id },
        { plan, status: 'active', startDate: new Date(), endDate },
        { upsert: true, new: true },
      );
    },
  },

  Short: {
    uploader:   (parent) => {
      if (parent.uploader?.username) return parent.uploader;
      const User = require('../models/User');
      return User.findById(parent.uploader);
    },
    likesCount: (parent) => (parent.likes || []).length,
  },

  Subscription: {
    user: (parent) => {
      const User = require('../models/User');
      return User.findById(parent.user);
    },
  },
};

module.exports = shortResolvers;
