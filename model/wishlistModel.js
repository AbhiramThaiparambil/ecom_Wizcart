const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Product' 
    }
}, {
    timestamps: true 
});

wishlistSchema.index({ user_id: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("WishList", wishlistSchema);
