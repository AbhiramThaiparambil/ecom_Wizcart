const { Module } = require("module");
const mongoose = require("mongoose");


const cart = new mongoose.Schema({
    user_id: {
        required: true,
        type: mongoose.Types.ObjectId,
    },
    Product: [
        {
            productId: mongoose.Types.ObjectId,
            quantity: Number,
            totalAmount:Number
        }
    ],
    totalPrice:{
        type:Number,
        required:true
      },
        discount:{
          type:Object,
        },
        coupon:{
            type:String,
            default:''
         },
        finalPrice:{ 
          type:Number,
          required:true
        }
      
});
module.exports = mongoose.model("cart",cart);
