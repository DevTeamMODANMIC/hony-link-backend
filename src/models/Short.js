const mongoose = require('mongoose');

const shortSchema = new mongoose.Schema({
  uploader:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl:  { type: String, required: true },
  caption:   { type: String, maxlength: 300 },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Short', shortSchema);
