const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed' ,'return',"paymentPending"],
    default: 'pending'
  },
  shipment_address: {
    type: {
      name: {
        type: String,
        required: true
      },
      mobile: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true
      },
      locality: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      landmark: {
        type: String
      },
      altmobile: {
        type: String
      },
      addresstype: {
        type: String
      }
    },
    required: true
  },
  product: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    productPrice:{
       type:Number,
      
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled',"return pending",'Returned',"return rejected","paymentPending"],
      default: 'pending'
    },
    refund: {
      type: String,
      
    },

  }],
  orderDate: {
    type: Date,
    default: Date.now
  },
  paymentSource:{
    type: String,
  },
  paymentMethod: {
    type: String,
    required: true
  },
  payment:{
    type:String
   },
   totalPrice: {
    type: Number,
   
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
    
  },



});

module.exports = mongoose.model('Order', OrderSchema);
