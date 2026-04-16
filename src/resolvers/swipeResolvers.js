const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const { requireAuth } = require('../middleware/auth');

const swipeResolvers = {
  Mutation: {
    // ── Swipe ──────────────────────────────────────────────────────
    swipe: async (_, { toUserId, direction }, context) => {
      const authUser = requireAuth(context);
      const dir = direction.toUpperCase();

      if (!['LEFT', 'RIGHT'].includes(dir)) {
        throw new Error('direction must be LEFT or RIGHT.');
      }
      if (toUserId === String(authUser._id)) {
        throw new Error('Cannot swipe on yourself.');
      }

      // Upsert the swipe (allow re-swipe to change direction)
      await Swipe.findOneAndUpdate(
        { from: authUser._id, to: toUserId },
        { direction: dir },
        { upsert: true, new: true },
      );

      // Check for mutual RIGHT swipe → create match
      if (dir === 'RIGHT') {
        const theirSwipe = await Swipe.findOne({
          from: toUserId,
          to:   authUser._id,
          direction: 'RIGHT',
        });

        if (theirSwipe) {
          // Avoid duplicate matches
          const existing = await Match.findOne({
            users: { $all: [authUser._id, toUserId] },
          });

          if (!existing) {
            const match = await Match.create({
              users: [authUser._id, toUserId],
            });
            return { direction: dir, matched: true, match };
          }
        }
      }

      return { direction: dir, matched: false, match: null };
    },
  },

  Query: {
    // ── My matches ─────────────────────────────────────────────────
    myMatches: async (_, __, context) => {
      const authUser = requireAuth(context);
      return Match.find({ users: authUser._id })
        .populate('users')
        .sort({ createdAt: -1 });
    },
  },

  SwipeResult: {
    match: (parent) => parent.match,
  },

  Match: {
    users: (parent) => {
      if (parent.users?.[0]?.username) return parent.users; // already populated
      const User = require('../models/User');
      return User.find({ _id: { $in: parent.users } });
    },
  },
};

module.exports = swipeResolvers;
