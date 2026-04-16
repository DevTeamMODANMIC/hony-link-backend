const User         = require('../models/User');
const Profile      = require('../models/Profile');
const Subscription = require('../models/Subscription');
const { signToken } = require('../middleware/auth');

const authResolvers = {
  Mutation: {
    // ── Signup ─────────────────────────────────────────────────────
    signup: async (_, { email, password, username }) => {
      const exists = await User.findOne({ $or: [{ email }, { username }] });
      if (exists) throw new Error('Email or username already in use.');

      const user = await User.create({ email, password, username });

      // Create blank profile and free subscription
      await Profile.create({ user: user._id });
      await Subscription.create({ user: user._id, plan: 'free' });

      const token = signToken(user._id);

      // Return a plain object so GraphQL field resolvers (User.profile,
      // User.subscription) can issue fresh Mongoose queries without hitting
      // the "Query was already executed" error.
      return { token, user: user.toObject() };
    },

    // ── Login ──────────────────────────────────────────────────────
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw new Error('Invalid email or password.');

      const valid = await user.comparePassword(password);
      if (!valid) throw new Error('Invalid email or password.');

      const token = signToken(user._id);
      // Return plain object for consistency
      return { token, user: user.toObject() };
    },
  },
};

module.exports = authResolvers;
