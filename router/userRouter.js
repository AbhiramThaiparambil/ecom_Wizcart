const express = require("express");
const userRoute = express();
const path = require("path");
const passport = require("passport");
const userController = require("../controller/userController");
const { isLogin, isLogout } = require("../auth/userAuth");
const nocache = require("nocache");
const { log } = require("console");
const { db, updateSearchIndex } = require("../model/userModer");
const { block } = require("sharp");
require("../auth/google");

userRoute.use(nocache());
userRoute.get("/", (req, res) => {
  res.redirect("/wizcart");
});

// paymentController
const paymentController=require('../controller/paymentController');
const wishlistModel = require("../model/wishlistModel");



// LOGIN ------------------------ 
userRoute.get("/login", isLogout, userController.login);
userRoute.post("/loginData", isLogout, userController.loginData);

// SIGNUP ----------------------
userRoute.get("/signup", isLogout, userController.signup);
userRoute.post("/signupData", isLogout, userController.signupData);
userRoute.get("/signupOtp", isLogout, userController.otpSending);
userRoute.post("/otpData", isLogout, userController.otpData);

// BLOCKED-USER ------------------
userRoute.get("/user-block", userController.userBlocked);

// HOME ---------------------------
userRoute.get("/wizcart", isLogout, userController.home);
userRoute.get("/home", isLogin, userController.homeLogin);

// SHOP MORE --------------------
userRoute.get("/shopmore",userController.shopmore);

// SINGLE PRODUCT ---------------
userRoute.get("/singleProduct:id", userController.singleProduct);

// PROFILE-EDIT ------------------
userRoute.get("/profile", isLogin, userController.profile);
userRoute.post("/updatename", isLogin, userController.ProfileNameUpdate);
userRoute.post("/updateemail", isLogin, userController.ProfileUpdateEmail);
userRoute.post("/otpemailupdate", isLogin, userController.profileOtpsumbit);
userRoute.post("/ProfilUpdatePass", isLogin, userController.profilenewPass);


// FORGOT PASSWORD AND RESET PASSWORD--
userRoute.get("/forgetpassword",isLogin,userController.forgotPassword);
userRoute.post("/forgotEmail",isLogin,userController.forgotEmail);
userRoute.post("/resetPassword",isLogin,userController.forgetRestpassword);
userRoute.post("/loadforgetpass",isLogin,userController.loadforgetpassword);

// LOGOUT ------------------------
userRoute.get("/logout", userController.logout);

// MANAGE-ADDRESS ---------------
userRoute.get("/manageaddress",isLogin,userController.manageaddress);
userRoute.post("/newaddress",isLogin,userController.newaddress);
userRoute.post("/editAddress",isLogin,userController.editAddress);
userRoute.get("/addressdelete/:id",isLogin,userController.addressDelete);

// CART --------------------------
userRoute.get("/addTocart",isLogin,userController.addTocart);
userRoute.get("/cart",isLogin,userController.cart);

// CHECKOUT ----------------------
userRoute.get("/checkOut",isLogin,userController.checkOut);

// ORDER ------------------------
userRoute.post("/confirmOrder",isLogin,paymentController.createOrder);
userRoute.get("/orderSuccess",isLogin,userController.orderSuccess);
userRoute.post("/ordercancellation",isLogin,userController.cancellProductStatus);
userRoute.get("/getOrderHistory",isLogin,userController.getOrderHistory);
userRoute.put("/quantityUpdate",isLogin,userController.quantityUpdate);
userRoute.delete("/removeItem/id:id",isLogin,userController.removeItem);
userRoute.post('/orderreturn',userController.orderReturn)

userRoute.get('/payment-pending',userController.paymentPending)






//coupon
userRoute.post('/coupon',userController.Coupon )
userRoute.post('/applyCoupon',userController.applyCoupon)
userRoute.delete('/removeCoupon',userController.removeCoupon)

userRoute.post('/api/payment/capture', paymentController.verifyPayment);


// wishlist
userRoute.get('/wishlist',userController.getWishlist)
userRoute.put('/wishlist/remove/:id', userController.removeWishlist)
  
userRoute.post('/complete-Payment',paymentController.completePayment)

// wallet

userRoute.get('/wallet',isLogin,userController.getWallet)

userRoute.post('/capture-payment',paymentController.captureContinuePayment)

userRoute.post('/addtowishlist',userController.addToWishlist)
userRoute.get('/invoiceDownload/:objectId/:productId', userController.invoiceDownload);
module.exports = {
  userRoute,
};



