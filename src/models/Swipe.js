const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, enum: ['LEFT', 'RIGHT'], required: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate swipes
swipeSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Swipe', swipeSchema);
