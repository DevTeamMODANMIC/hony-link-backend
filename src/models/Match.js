const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

matchSchema.index({ users: 1 });

module.exports = mongoose.model('Match', matchSchema);
