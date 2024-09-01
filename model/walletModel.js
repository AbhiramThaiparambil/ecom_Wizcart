const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user_id: {
    required: true,
    type: mongoose.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [{
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model("Wallet", walletSchema);
