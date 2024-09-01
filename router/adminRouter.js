const express = require("express");
const adminRoute = express();
const adminController = require("../controller/adminController");
const { upload } = require("../config/imageResizing");
const { isLogin, isLogout } = require("../auth/adminAuth");
const session = require("express-session");
const nocache = require("nocache");
// const productAddRoute  = require("../controller/productAdding");
adminRoute.use(nocache());

adminRoute.get("/admin", isLogout, adminController.adminLogin);
adminRoute.post("/adminLoginData", isLogout, adminController.adminLogindata);

// HOME PAGE
adminRoute.get("/dashboard", adminController.dashBord);

// USER MANAGEMENT
adminRoute.get("/userList", isLogin, adminController.userList);
adminRoute.post("/blockUser", isLogin, adminController.blockUser);

// PRODUCT MANAGEMENT
adminRoute.get("/Products", isLogin, adminController.products);
adminRoute.get("/addProduct", isLogin, adminController.addProduct);
// adminRoute.post("/productAdded",upload.array("image", 3),adminController.productAdded);
adminRoute.post("/editProduct", isLogin, adminController.editProduct);
adminRoute.get("/editProductForm", isLogin, adminController.editProductForm);
adminRoute.post("/deleteImg", isLogin, adminController.deleteImg);
adminRoute.post("/HideProduct", adminController.hideProduct);
adminRoute.post("/UnhideProduct", isLogin, adminController.unHide);
adminRoute.post("/deleteProduct", isLogin, adminController.deleteProduct);

// CATEGORY MANAGEMENT
adminRoute.get("/category", isLogin, adminController.category);
adminRoute.post("/addCategory", isLogin, adminController.addCategory);
adminRoute.post("/catDelete", isLogin, adminController.deleteCategory);
adminRoute.post("/catHide", isLogin, adminController.hideCategory);
adminRoute.post("/catShow", isLogin, adminController.showCategory);
adminRoute.post("/editcategory", isLogin, adminController.editCategory);
adminRoute.get("/logout", isLogin, adminController.logout);

//orderMangement
adminRoute.get("/orderMangement", adminController.orderMangement);
adminRoute.post("/update-status", adminController.updateStatus);
adminRoute.get('/returnOrders',adminController.returnOrders)
adminRoute.put('/acceptReturn', adminController.acceptAndRefund);
adminRoute.put('/reject', adminController.rejectReturn);


// COUPON MANGEMENT

adminRoute.get("/couponMangement", isLogin, adminController.couponMangemnt);
adminRoute.post("/createCoupon", isLogin, adminController.createCoupon);
adminRoute.delete("/delete-coupon", adminController.deleteCoupon);
adminRoute.patch("/show-coupon", isLogin, adminController.unhideCoupon);
adminRoute.patch("/hide-coupon", isLogin, adminController.hideCoupon);
adminRoute.post("/updateCoupon", isLogin, adminController.updateCoupon);

// SalesReoport

adminRoute.get("/salesReport", isLogin, adminController.saleReport);
adminRoute.get(
  "/offerManagemanent",
  isLogin,
  adminController.offerManagemanent1
);
adminRoute.post("/new-offer", isLogin, adminController.newOffer);
adminRoute.post("/remove-offer", isLogin, adminController.removeOffer);

adminRoute.get("/download/excel", isLogin, adminController.downloadExcel);
adminRoute.get("/download/pdf", isLogin, adminController.downloadPdf);

adminRoute.get('/ledger',adminController.ledger)


module.exports = {
  adminRoute,
};
