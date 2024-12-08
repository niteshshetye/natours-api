const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name should contain atleast ({VALUE}) character'],
    maxlength: [100, 'Name should not contain more than ({VALUE}) character']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Email is invalid']
  },
  photoURL: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password should atleast ({VALUE}) character'],
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      message: 'Password not match with confirm password',
      // This only work on SAVE!!
      validator: function(value) {
        return value === this.password;
      }
    },
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  if (!this.isNew) {
    // because we are checking the change password and token issue time
    // and in reset password we are issuing new token
    // so for that for safer side we saving 1 sec before time stamp of change password
    this.passwordChangedAt = Date.now() - 1000;
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPassword = function(jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return jwtTimeStamp < changeTimeStamp;
  }

  return false;
};

userSchema.methods.generateResetPasswordToken = function() {
  const resetPasswordToken = crypto.randomBytes(32).toString('hex');

  // encrypted token store in database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetPasswordToken)
    .digest('hex');

  // expires after 10 min
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetPasswordToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
