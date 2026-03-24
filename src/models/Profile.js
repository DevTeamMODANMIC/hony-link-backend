const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio:      { type: String, maxlength: 500 },
  age:      { type: Number, min: 18, max: 100 },
  gender:   { type: String, enum: ['male', 'female', 'non-binary', 'other'] },
  interests: [{ type: String, trim: true }],
  photos:   [{ type: String }],         // array of image URLs
  city:     { type: String, trim: true },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  lookingFor: { type: String, enum: ['male', 'female', 'non-binary', 'other', 'any'], default: 'any' },
  minAge:     { type: Number, default: 18 },
  maxAge:     { type: Number, default: 99 },
  updatedAt:  { type: Date, default: Date.now },
});

// 2dsphere index for geo-based search
profileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Profile', profileSchema);
