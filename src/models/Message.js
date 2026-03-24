const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat:      { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, trim: true },
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
