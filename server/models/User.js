const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['teacher', 'student']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required']
  },
  countryCode: {
    type: String,
    required: [true, 'Country code is required']
  },
  instituteId: {
    type: String,
    required: [true, 'Institute ID is required']
  },
  institute: {
    type: String,
    required: [true, 'Institute is required']
  }
}, { 
  timestamps: true,
  strict: true,
  strictQuery: true
});

// Debug middleware
userSchema.pre('save', function(next) {
  console.log('Data to be saved:', this.toObject());
  next();
});

userSchema.post('save', function(doc) {
  console.log('Saved document:', doc.toObject());
});

// Clean up indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

// Verify schema
console.log('User schema paths:', Object.keys(User.schema.paths));

module.exports = User;