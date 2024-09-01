const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    Coupon_Code: {
        type: String,
        unique: true,
        required: true
    },
    discount_Price: {
        type: Number,
        required: true
    },
    expiry_Date: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    minPurchaseAmount:{
        type:Number
    },
    is_active:{
       type:Boolean,
       required:true
    }

});

module.exports = mongoose.model('Coupon', couponSchema);
