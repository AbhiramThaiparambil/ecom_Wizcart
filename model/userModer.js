const { Module } = require("module");
const mongoose = require("mongoose");
const { type } = require("os");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    required: true,
    type: String,
  },
  googleId:{
    type: String,
    required: true,
    
  },
  password: {
    type: String,
  },
  is_admin: {
    type: Number,
    required: true,
  },
  is_ban: {
    type: Number,
    required: true,
  },
  address:{
    type:Array
  }
});

module.exports = mongoose.model("User", userSchema);
