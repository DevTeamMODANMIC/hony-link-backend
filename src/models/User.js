const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
  },
  password:  { type: String, required: true, select: false },
  username:  { type: String, required: true, unique: true, trim: true },
  isVerified: { type: Boolean, default: false },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt:  { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
