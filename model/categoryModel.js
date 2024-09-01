const { Module } = require("module");
const mongoose = require("mongoose");
const { type } = require("os");

const category = new mongoose.Schema({
    category_name: {
    type: String,
  },
  Hide_category: {
    required: true,
    type:Number,
  }

});

module.exports = mongoose.model("category",category);
