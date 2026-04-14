const User         = require('../models/User');
const Profile      = require('../models/Profile');
const Subscription = require('../models/Subscription');
const { signToken } = require('../middleware/auth');

const authResolvers = {
  Mutation: {
    // ── Signup ─────────────────────────────────────────────────────
    signup: async (_, { email, password, username }) => {
      // console.log( email, password, username)
      const exists = await User.findOne({ $or: [{ email }, { username }] });
      if (exists) throw new Error('Email or username already in use.');

      const user = await User.create({ email, password, username });

      // Create blank profile and free subscription
      await Profile.create({ user: user._id });
      await Subscription.create({ user: user._id, plan: 'free' });

      const token = signToken(user._id);
      return { token, user };
    },

    // ── Login ──────────────────────────────────────────────────────
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw new Error('Invalid email or password.');

      const valid = await user.comparePassword(password);
      if (!valid) throw new Error('Invalid email or password.');

      const token = signToken(user._id);
      return { token, user };
    },
  },
};

module.exports = authResolvers;
