const mongoose = require('mongoose');
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

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
  photoURL: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password should atleast ({VALUE}) character']
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
    }
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
