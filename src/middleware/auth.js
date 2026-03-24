const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Attaches the decoded user to context.user.
 * Does NOT throw — resolvers call requireAuth() themselves.
 */
const buildContext = async ({ req }) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return { user: null };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    return { user: user || null };
  } catch {
    return { user: null };
  }
};

/**
 * Call inside any resolver that requires authentication.
 * Throws a clean GraphQL error if no valid user is present.
 */
const requireAuth = (context) => {
  if (!context.user) {
    throw new Error('Authentication required. Please log in.');
  }
  return context.user;
};

/**
 * Sign a JWT for a given user ID.
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = { buildContext, requireAuth, signToken };
