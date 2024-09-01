const User = require("../model/userModer");
const bcrypt = require("bcryptjs");
const { resizeImages } = require("../config/imageResizing");
const Product = require("../model/productModel");
const Order = require("../model/orders.model");
const Category = require("../model/categoryModel");
const path = require("path");
const fs = require("fs");
const { log, error } = require("console");
const Coupons = require("../model/couponModel");
const Wallet = require("../model/walletModel");
require("passport");
const mongoose = require("mongoose");

// ADMIN LOGIN  //GET

const adminLogin = async (req, res) => {
  try {
    const toast = ["Admin Login"];
    res.render("admin/adminLogin", { toast });
  } catch (error) {
    console.error("Error rendering admin login page:", error);
    res.status(500).send("Internal Server Error");
  }
};

const adminLogindata = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email: email });

    if (!admin) {
      const toast = ["Invalid email or password"];
      return res.render("admin/adminLogin", { toast });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      const toast = ["Wrong password"];
      return res.render("admin/adminLogin", { toast });
    }

    if (admin.is_admin === 1) {
      req.session.admin_id = admin._id;
      console.log(req.session.admin_id);
      req.flash("info", "✅ login successful");
      return res.redirect("/dashboard");
    } else {
      const toast = ["You are not an admin"];
      return res.render("admin/adminLogin", { toast });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .render("admin/adminLogin", { toast: ["Server error"] });
  }
};

// DASHBORD // GET

const dashBord = async (req, res) => {
  try {
    let { startDate, endDate, filter } = req.query;

    let filterOption = filter || 'today';

    if (startDate && endDate) {
      startDate = new Date(`${startDate}T00:00:00.000Z`);
      endDate = new Date(`${endDate}T23:59:59.999Z`);
      filterOption = `${startDate}to${endDate}`;
    } else {
      const now = new Date();
      if (filterOption === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
      } else if (filterOption === "week") {
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        endDate.setHours(23, 59, 59, 999);
      } else if (filterOption === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (filterOption === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      }
    }

    const groupedOrders = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $match: {
          paymentMethod: { $ne: "razorpay" },
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$_id",
          orderDate: { $first: "$orderDate" },
          totalPrice: { $first: "$totalPrice" },
          finalPrice: { $first: "$finalPrice" },
          discount: { $first: "$discount" },
          paymentMethod: { $first: "$paymentMethod" },
          products: {
            $push: {
              Mrp: "$productDetails.Maximum_Retail_Price",
              productName: "$productDetails.product_name",
              quantity: "$product.quantity",
              productPrice: "$product.productPrice",
              status: "$product.status",
            },
          },
          productCount: { $sum: "$product.quantity" },
        },
      },
    ]);

    const paymentMethodCount = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lt: endDate },
        },
        $match: {
          paymentMethod: { $ne: "razorpay" },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          paymentMethod: "$_id",
          count: 1,
        },
      },
    ]);

    const paymentMethodsData = {
      labels: paymentMethodCount.map(item => item.paymentMethod),
      values: paymentMethodCount.map(item => item.count),
    };

    const topProducts = await Order.aggregate([
      { $match: { orderDate: { $gte: startDate, $lt: endDate } } },
      {
        $match: {
          paymentMethod: { $ne: "razorpay" },
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.productId",
          count: { $sum: "$product.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          count: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] }
        }
      }
    ]);

    const topCategories = await Order.aggregate([
      { $match: { orderDate: { $gte: startDate, $lt: endDate } } },
      {
        $match: {
          paymentMethod: { $ne: "razorpay" },
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category_name",
          count: { $sum: "$product.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topBrands = await Order.aggregate([
      { $match: { orderDate: { $gte: startDate, $lt: endDate } } },
      {
        $match: {
          paymentMethod: { $ne: "razorpay" },
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.brands",
          count: { $sum: "$product.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalSales = groupedOrders
      .reduce((sum, order) => {
        if (order.paymentMethod !== 'razorpay') {
          return (
            sum +
            order.products.reduce((productSum, product) => {
              return productSum + product.Mrp * product.quantity;
            }, 0)
          );
        }
        return sum;
      }, 0)
      .toFixed(2);

    const totalProductDiscount = groupedOrders
      .reduce((sum, order) => {
        if (order.paymentMethod !== 'razorpay') {
          return (
            sum +
            order.products.reduce((productSum, product) => {
              const discount =
                (product.Mrp - product.productPrice) * product.quantity;
              return productSum + discount;
            }, 0)
          );
        }
        return sum;
      }, 0)
      .toFixed(2);

    const totalDiscount = groupedOrders
      .reduce((sum, order) => {
        if (order.paymentMethod !== 'razorpay') {
          return sum + order.discount;
        }
        return sum;
      }, 0)
      .toFixed(2);


    const totalOrderedProductCount = groupedOrders.reduce((sum, order) => {

      if (order.paymentMethod !== 'razorpay') {
        return (
          sum +
          order.products.reduce(
            (productSum, product) => productSum + product.quantity,
            0
          )
        );
      }
      return sum;
    }, 0);

    const totalProfit = groupedOrders
      .reduce((sum, order) => {
        if (order.paymentMethod !== 'razorpay') {
          return sum + order.finalPrice;
        }
        return sum;
      }, 0)
      .toFixed(2);

    console.log('--- Debugging Data ---');
    console.log('Top Products:', JSON.stringify(topProducts, null, 2));
    console.log('Top Categories:', JSON.stringify(topCategories, null, 2));
    console.log('Top Brands:', JSON.stringify(topBrands, null, 2));
    console.log('Payment Methods Data:', JSON.stringify(paymentMethodsData, null, 2));
    console.log('Total Sales:', totalSales);
    console.log('Total Product Discount:', totalProductDiscount);
    console.log('Total Discount:', totalDiscount);
    console.log('Total Profit:', totalProfit);
    console.log('Total Ordered Product Count:', totalOrderedProductCount);
    console.log('--- End of Debugging Data ---');

    let toast = [];
    res.render("admin/adminDashbord", {
      toast,
      topProducts,
      topCategories,
      topBrands,
      paymentMethodsData,
      totalSales,
      totalDiscount,
      totalProfit,
      totalOrderedProductCount,
      salesData: { labels: ["Total Sales"], sales: [parseFloat(totalProfit)] },
      totalPages: 0,
      currentPage: 0,
      startDate,
      endDate,
      filterOption,
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

























// USERMANGMENT:  ALL USER LIST // GET

const userList = async (req, res) => {
  try {
    const allUser = await User.find({});
    const toast = req.flash("info");
    res.render("admin/userList", { users: allUser, toast });
  } catch (error) {
    console.error(error);
    res.status(500).render("admin/userList", { message: "Server error" });
  }
};

// USERMANGMENT:  BLOCK // POST

const blockUser = async (req, res) => {
  try {
    const { userId, newStatus } = req.body;

    const result = await User.updateOne(
      { _id: userId },
      { $set: { is_ban: newStatus } }
    );
    if (result) {
      if (newStatus == 1) {
        req.flash("info", "✅ User has been Blocked successfully");
      } else if (newStatus == 0) {
        req.flash("info", "✅ User has been Unblocked successfully");
      }

      res.redirect("/userList");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// PRODUCTSMANGMENT :ALL PRODUCTS LIST //GET

const products = async (req, res) => {
  try {
    const productData = await Product.find({});
    if (productData) {
      const toast = req.flash("info");
      res.render("admin/allProduct", { Product: productData, toast });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// PRODUCTSMANGMENT :ADD PRODUCTS  //GET

const addProduct = async (req, res) => {
  try {
    const category = await Category.find({});

    res.render("admin/addProduct", { category: category });
  } catch (error) {
    console.log(error.message);
  }
};

// PRODUCTSMANGMENT :NEW PRODUCTS  //POST

// = async (req, res) => {
//   try {
//     const {
//       productName,
//       productCategory,
//       ProductDescription,
//       productPrice,
//       Stock,
//       Brand,
//     } = req.body;
//     const files = req.files;
//     const resizedPaths = await resizeImages(files);

//     const response = resizedPaths.map((path, index) => ({
//       original: files[index].path,
//       resized: path,
//     }));

//     const relativePaths = resizedPaths.map((path) =>
//       path.replace(
//         "C:\\Users\\Abhiram\\Desktop\\WIZCART - Copy (2)\\public\\resizeImg\\",
//         ""
//       )
//     );

//     const bdImg = relativePaths.map((relativePath) =>
//       path.join("resizeImg", relativePath)
//     );

//     const productDetails = new Product({
//       product_name: productName,
//       product_description: ProductDescription,
//       category_name: productCategory,
//       brands: Brand,
//       price: productPrice,
//       in_stock: Stock,
//       product_img: bdImg,
//       Hide_product: 0,
//     });

//     const singupdataSucess = await productDetails.save();

//     res.redirect("/Products");
//   } catch (err) {
//     console.error("Error processing images:", err);
//   }
// };

// // PRODUCTSMANGMENT :EDIT PRODUCTS  //POST

let id;
const editProduct = async (req, res) => {
  try {
    id = req.body.id;

    res.redirect("/editProductForm");
  } catch (error) {
    console.log(error.message);
  }
};

// PRODUCTSMANGMENT :EDIT PRODUCTS  //GET

const editProductForm = async (req, res) => {
  try {
    const productData = await Product.findById({ _id: id });
    if (productData) {
      res.render("admin/editProduct", { product: productData, id: id });
      id = null;
    }
  } catch (error) {}
};

// PRODUCTSMANGMENT :EDITED DATA // POST

// PRODUCTSMANGEMENT:  DELETE IMAGE IN EDITING PAGE  //POST

const deleteImg = async (req, res) => {
  try {
    const { imageIndex, productId } = req.body;
    console.log(imageIndex, productId);

    let productKey = `product_img.${imageIndex}`;

    const unsetResult = await Product.updateOne(
      { _id: productId },
      { $unset: { [productKey]: 1 } }
    );

    if (unsetResult.modifiedCount === 0) {
      return res.status(404).send("Image not found");
    }

    const pullResult = await Product.updateOne(
      { _id: productId },
      { $pull: { product_img: null } }
    );

    if (pullResult.modifiedCount > 0) {
      // // Delete the file from the file system

      //  const uploadsDir = path.join(__dirname, '..', 'public', productKey);

      // fs.unlink(uploadsDir, (err) => {
      //   if (err) {
      //     console.error(`Error deleting ${uploadsDir} file:`, err);
      //   } else {
      //     console.log(`${uploadsDir} was deleted successfully`);
      //   }
      // });
      req.flash("info", " 🗑️ image delete successfully ");
      res.redirect("/Products");
    } else {
      res.status(404).send("Image not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred");
  }
};

// PRODUCTSMANGEMENT: HIDE (SOFTDELETE)  //POST

const hideProduct = async (req, res) => {
  try {
    const id = req.body._id;
    const a = await Product.findById(id);
    console.log(`this is ${a}`);
    const hidden = await Product.findByIdAndUpdate(
      id,
      { $set: { Hide_product: 1 } },
      { new: true }
    );
    if (hidden) {
      req.flash("info", "Product was Hide  successfully ✔️ ");
      res.redirect("/Products");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// PRODUCTSMANGEMENT: UNHIDE (REMOVE SOFTDELETE)  //POST

const unHide = async (req, res) => {
  try {
    const id = req.body._id;
    console.log("hello");
    const unhidden = await Product.findByIdAndUpdate(
      id,
      { $set: { Hide_product: 0 } },
      { new: true }
    );
    if (unhidden) {
      req.flash("info", "Product was unhide  successfully ✔️ ");
      res.redirect("/Products");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// PRODUCTSMANGEMENT: UNHIDE (REMOVE SOFTDELETE)  //POST

const deleteProduct = async (req, res) => {
  try {
    let id = req.body._id;
    let productData = await Product.deleteOne({ _id: id });

    if (productData) {
      req.flash("info", " 🗑️ Product was Delete succesfully ");
      res.redirect("/Products");
    }
  } catch (error) {}
};

// CATEGORYMANGEMENT :SHOW CATEGORY //GET

const category = async (req, res) => {
  try {
    const categories = await Category.find({});
    if (categories) {
      const toast = req.flash("info");
      res.render("admin/category", { categories, toast });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// CATEGORYMANGEMENT :DELETE CATEGORY //GET

const deleteCategory = async (req, res) => {
  try {
    const id = req.body.id;

    const status = await Category.deleteOne({ _id: id });
    if (status.deletedCount > 0) {
      req.flash("info", " 🗑️  Category Delete succesfully ");
      res.redirect("/category");
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

// CATEGORYMANGEMENT :ADD NEW CATEGORY //POST
const addCategory = async (req, res) => {
  try {
    const { newCategory } = req.body;

    // Create a regular expression for case-insensitive match
    const regex = new RegExp(`^${newCategory}$`, "i");

    const is_exist = await Category.findOne({ category_name: regex });
    if (is_exist) {
      req.flash(
        "info",
        `${newCategory} ❗The Category name already exists. Please enter a different name.`
      );
      return res.redirect("/category");
    }

    const newCategoryDetails = new Category({
      category_name: newCategory,
      Hide_category: 0,
    });

    const status = await newCategoryDetails.save();

    if (status) {
      req.flash("info", `${newCategory} was added successfully ✅`);
      res.redirect("/category");
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

// CATEGORYMANGEMENT :HIDE CATEGORY (SOFT DELETE) //POST

const hideCategory = async (req, res) => {
  try {
    const id = req.body.id;

    const status = await Category.updateOne(
      { _id: id },
      { $set: { Hide_category: 1 } }
    );
    if (status) {
      req.flash("info", ` Category was hide  succesfully ✅`);

      res.redirect("/category");
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

// CATEGORYMANGEMENT :UNHIDE CATEGORY (REMOVE SOFT DELETE) //POST

const showCategory = async (req, res) => {
  try {
    const id = req.body.id;

    const status = await Category.updateOne(
      { _id: id },
      { $set: { Hide_category: 0 } }
    );
    if (status) {
      req.flash("info", ` Category was Unhide  succesfully ✅`);
      res.redirect("/category");
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

// categoryEdit

const editCategory = async (req, res) => {
  try {
    const { editCategoryName, edit_id } = req.body;

    console.log(editCategoryName);
    console.log(edit_id);

    const status = await Category.updateOne(
      { _id: edit_id },
      { $set: { category_name: editCategoryName } }
    );

    if (status.nModified > 0) {
      req.flash("info", "Category name was successfully changed ✅");
      res.redirect("/category");
    } else {
      req.flash("error", "No changes were made or category not found.");
      res.redirect("/category");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred while updating the category.");
    res.redirect("/category");
  }
};

// LOGOUT

const logout = async (req, res) => {
  try {
    console.log(req.session.admin_id);
    req.session.destroy();
    req.flash("info", ` LogOut succesfully ✅`);
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const orderMangement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "newone",
        },
      },
      { $sort: { orderDate: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.render("admin/oderMangement", {
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit: limit,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { product_id, object_id, status } = req.body;
    console.log(object_id);

    console.log("hello");
    const order = await Order.findOne({ _id: object_id });

    const productIndex = order.product.findIndex(
      (p) => p._id.toString() === product_id
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    const quantity = order.product[productIndex].quantity;

    order.product[productIndex].status = status;

    const product = await Product.findOne({
      _id: order.product[productIndex].productId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.in_stock += quantity;

    await order.save();
    await product.save();

    res.redirect("/orderMangement");
  } catch (error) {
    console.log(error.message);
  }
};

const singelOderhistory = async (req, res) => {
  try {
    const oderId = req.query.oderId;
    const productIndex = req.query.productIndex;
    console.log(
      `this is my order id ${oderId}/n this is my productIndex ${productIndex}`
    );
  } catch (error) {
    console.log(error.message);
  }
};

const couponMangemnt = async (req, res) => {
  try {
    const coupon = await Coupons.find({});
    let toast = req.flash("info") || [];

    res.render("admin/Coupons", { coupons: coupon, toast });
  } catch (error) {
    console.log(error.message);
  }
};

const createCoupon = async (req, res) => {
  try {
    const { couponCode, discount, expiryDate, description, minPurchaseAmount } =
      req.body;

    const newcoupon = new Coupons({
      Coupon_Code: couponCode,
      discount_Price: discount,
      expiry_Date: expiryDate,
      Description: description,
      minPurchaseAmount: minPurchaseAmount,
      is_active: true,
    });

    const result = await newcoupon.save();
    if (result) {
      res.status(200).json({ message: "Coupon created successfully!" });
    }
    console.log(result);
  } catch (error) {
    console.log(error.message);
  }
};

const returnOrders = async (req, res) => {
  try {
    const returnRequests = await Order.aggregate([
      {
        $unwind: "$product", // Unwind the product array
      },
      {
        $match: { "product.status": "return pending" }, // Match only delivered products
      },
      {
        $lookup: {
          from: "products", // Ensure this matches your actual collection name
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true, // Keeps documents where no match is found
        },
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          name: 1,
          email: 1,
          status: 1,
          shipment_address: 1,
          "product.productId": 1,
          "product.quantity": 1,
          "product.productPrice": 1,
          "product.status": 1,
          totalPrice: 1,
          discount: 1,
          coupon: 1,
          finalPrice: 1,
          orderDate: 1,
          productDetails: 1, // Include product details from the lookup
        },
      },
    ]);

    if (returnRequests) {
      res.render("admin/returnOrder", { returnRequests: returnRequests });
    }
  } catch (error) {
    console.error("Error fetching return orders:", error); // Detailed error logging
    res.status(500).send("Server error");
  }
};

// refund
const acceptAndRefund = async (req, res) => {
  try {
    console.log(
      "_________________________________________________________________________________"
    );
    console.log(req.body);

    const { orderId, productId, productPrice, productName, user_id } = req.body;

    console.log(orderId);

    const price = parseFloat(productPrice);
    if (isNaN(price)) {
      return res.status(400).json({ message: "Invalid product price" });
    }

    const order = await Order.findOne({ _id: orderId });
    console.log(order);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Order found:", order);

    const productIndex = order.product.findIndex(
      (p) => p.productId.toString() === productId
    );
    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }
    console.log("Product Index:", productIndex);

    const quantity = order.product[productIndex].quantity;
    order.product[productIndex].status = "Returned";

    const product = await Product.findOne({
      _id: order.product[productIndex].productId,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.log("Product found:", product);

    product.in_stock += quantity;
    await product.save(); // Ensure product is saved

    await order.save(); // Ensure order is saved
    console.log("Order and product updated");

    let wallet = await Wallet.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
    });
    console.log("Wallet found:", wallet);

    if (!wallet) {
      wallet = new Wallet({
        user_id: new mongoose.Types.ObjectId(user_id),
        balance: price,
        transactions: [
          {
            amount: price,
            type: order.paymentMethod,
            description: `${productName || "Product"} amount credited`,
          },
        ],
      });
      await wallet.save(); // Save new wallet
    } else {
      const updatedBalance = wallet.balance + price;
      await Wallet.updateOne(
        { user_id: new mongoose.Types.ObjectId(user_id) },
        {
          $set: { balance: updatedBalance },
          $push: {
            transactions: {
              amount: price,
              type: order.paymentMethod,
              description: `${productName || "Product"} amount credited`,
            },
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "The return request has been accepted and the payment refunded.",
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rejectReturn = async (req, res) => {
  try {
    const { orderId, productId } = req.body;
    console.log(
      "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"
    );

    console.log(orderId);

    const order = await Order.findOne({ _id: orderId });
    console.log(order);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Order found:", order);

    const productIndex = order.product.findIndex(
      (p) => p.productId.toString() === productId
    );
    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }
    console.log("Product Index:", productIndex);

    const quantity = order.product[productIndex].quantity;
    order.product[productIndex].status = "return rejected";

    await order.save(); // Ensure order is saved
    console.log("Order and product updated");

    res.status(200).json({
      success: true,
      message: "The return request has been reject.",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const id = req.body.id;

    const isDelete = await Coupons.findByIdAndDelete(id);

    if (isDelete) {
      res.status(200).json({ message: "Coupon deleted successfully" });
    } else {
      res.status(500).json({ error: "Coupon deleted successfully" });
    }
  } catch (error) {
    console.log(error);
  }
};
const unhideCoupon = async (req, res) => {
  try {
    console.log("This is unhide coupon controller");
    const id = req.body.Unhide_id;
    console.log(id);

    const isShow = await Coupons.updateOne(
      { _id: id },
      { $set: { is_active: true } }
    );

    if (isShow) {
      res.status(200).json({ message: "Coupon unhidden successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while unhiding the coupon" });
  }
};

const hideCoupon = async (req, res) => {
  try {
    console.log("This is hide coupon controller");
    const id = req.body.hide_id;
    console.log(id);

    const isShow = await Coupons.updateOne(
      { _id: id },
      { $set: { is_active: false } }
    );

    if (isShow) {
      res.status(200).json({ message: "Coupon hidden successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while hiding the coupon" });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const {
      edit_id,
      Edit_couponCode,
      Edit_discount,
      Edit_expiryDate,
      Edit_minPurchaseAmount,
      Edit_description,
    } = req.body;

    const edit = await Coupons.updateOne(
      { _id: edit_id },
      {
        $set: {
          Coupon_Code: Edit_couponCode,
          discount_Price: Edit_discount,
          expiry_Date: Edit_expiryDate,
          minPurchaseAmount: Edit_minPurchaseAmount,
          Description: Edit_description,
        },
      }
    );
    if (edit) {
      req.flash("info", "Coupon edited successfully ✅");
      res.redirect("/couponMangement");
    }
  } catch (error) {}
};

const saleReport = async (req, res) => {
  try {
    let { startDate, endDate, filter } = req.query;

    if (startDate && endDate) {
      startDate = new Date(`${startDate}T00:00:00.000Z`);
      endDate = new Date(`${endDate}T23:59:59.999Z`);
    }

    // Set date range based on filter
    if (filter === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (filter === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(endDate.getDate() - endDate.getDay() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (filter === "month") {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Aggregation to group orders and lookup product details excluding razorpay
    const groupedOrders = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lt: endDate },
          paymentMethod: { $ne: "razorpay" }
        },
      },
      {
        $unwind: "$product",
      },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$_id",
          orderDate: { $first: "$orderDate" },
          totalPrice: { $first: "$totalPrice" },
          finalPrice: { $first: "$finalPrice" },
          discount: { $first: "$discount" },
          products: {
            $push: {
              Mrp: "$productDetails.Maximum_Retail_Price",
              productName: "$productDetails.product_name",
              quantity: "$product.quantity",
              productPrice: "$product.productPrice",
              status: "$product.status",
            },
          },
          productCount: { $sum: "$product.quantity" },
        },
      },
    ]);

    // Aggregation to count valid coupons excluding razorpay
    const couponCounts = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lt: endDate },
          paymentMethod: { $ne: "razorpay" },
          coupon: { $ne: null, $ne: "" }, // Filter out null or empty coupons
        },
      },
      {
        $group: {
          _id: "$coupon",
          count: { $sum: 1 }, // Count occurrences of each coupon
        },
      },
      {
        $project: {
          _id: 0,
          coupon: "$_id",
          count: 1,
        },
      },
    ]);

    // Format coupon counts to the desired output
    const formattedCouponCounts = couponCounts.map((entry) => ({
      [entry.coupon]: entry.count,
    }));

    // Calculate total product MRP excluding razorpay
    const totalSales = groupedOrders
      .reduce((sum, order) => {
        return (
          sum +
          order.products.reduce((productSum, product) => {
            return productSum + product.Mrp * product.quantity;
          }, 0)
        );
      }, 0)
      .toFixed(2);

    // Calculate total product discount excluding razorpay
    const totalProductDiscount = groupedOrders
      .reduce((sum, order) => {
        return (
          sum +
          order.products.reduce((productSum, product) => {
            const discount =
              (product.Mrp - product.productPrice) * product.quantity;
            return productSum + discount;
          }, 0)
        );
      }, 0)
      .toFixed(2);

    // Calculate total discount excluding razorpay
    const totalDiscount = groupedOrders
      .reduce((sum, order) => sum + order.discount, 0)
      .toFixed(2);

    // Calculate total ordered product count excluding razorpay
    const totalOrderedProductCount = groupedOrders.reduce((sum, order) => {
      return (
        sum +
        order.products.reduce(
          (productSum, product) => productSum + product.quantity,
          0
        )
      );
    }, 0);

    // Flatten the orders to create a list of transactions with all products excluding razorpay
    const transactions = groupedOrders.flatMap((order) =>
      order.products.map((product) => ({
        date: order.orderDate
          ? new Date(order.orderDate).toISOString().split("T")[0]
          : "N/A",
        productName: product.productName || "N/A",
        quantity: product.quantity || 0,
        price: product.productPrice.toFixed(2) || "0.00",
        Product_discount: (
          (product.Mrp - product.productPrice) *
          product.quantity
        ).toFixed(2),
        originalPrice: product.Mrp.toFixed(2),
      }))
    );

    // Compute total profit excluding razorpay
    const totalProfit = groupedOrders
      .reduce((sum, order) => {
        return sum + order.finalPrice;
      }, 0)
      .toFixed(2);

    // Pagination logic (if applicable)
    const totalPages = 0; // Update based on your pagination logic
    const currentPage = 0; // Update based on your pagination logic

  console.log("jkgrhyuilearhuyikgyh________________________________________"+totalProductDiscount);
  

    // Render the sales report with computed values
    res.render("admin/salesReport", {
      Coupons: formattedCouponCounts,
      filterOption: filter,
      todaySales: groupedOrders,
      totalSales: totalSales,
      totalDiscount: totalDiscount,
      totalProfit: totalProfit,
      totalOrderedProductCount: totalOrderedProductCount,
      totalProductDiscount: totalProductDiscount, // Include the total product discount
      transactions: transactions,
      totalPages: totalPages,
      currentPage: currentPage,
      startDate: startDate,
      endDate: endDate,
    });
  } catch (error) {
    console.error("Error fetching sales report:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// http://localhost:3200/salesReport?startDate=2024-08-12&endDate=2024-08-14

const offerManagemanent1 = async (req, res) => {
  const products = await Product.find({});
  res.render("admin/offerManagement", { products });
};

const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// offerProduct_id ,offerProduct_mrp,discount

const newOffer = async (req, res) => {
  try {
    const offerProduct_id = req.body.offerProduct_id;
    console.log(offerProduct_id);

    const offerProduct_mrp = parseInt(req.body.offerProduct_mrp, 10);
    const discount = parseInt(req.body.discount, 10);
    const lastPrice = offerProduct_mrp - discount;

    console.log(lastPrice);
    const updateResult = await Product.updateOne(
      { _id: offerProduct_id },
      {
        $set: {
          price: lastPrice,
        },
      }
    );

    if (updateResult.modifiedCount) {
      res.redirect("/offerManagemanent");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeOffer = async (req, res) => {
  try {
    const removeID = req.body.removeID;
    const mrp = parseInt(req.body.removeMrp, 10);

    const updateResult = await Product.updateOne(
      { _id: removeID },
      {
        $set: {
          price: mrp,
        },
      }
    );

    if (updateResult.modifiedCount) {
      res.redirect("/offerManagemanent");
    }
  } catch (error) {}
};
// =======================================================

const generateReportData = async (startDate, endDate, filter) => {
  try {
    const groupedOrders = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lt: endDate },
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "products",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$_id",
          orderDate: { $first: "$orderDate" },
          totalPrice: { $first: "$totalPrice" },
          finalPrice: { $first: "$finalPrice" },
          discount: { $first: "$discount" },
          products: {
            $push: {
              Mrp: "$productDetails.Maximum_Retail_Price",
              productName: "$productDetails.product_name",
              quantity: "$product.quantity",
              productPrice: "$product.productPrice",
              status: "$product.status",
            },
          },
          productCount: { $sum: "$product.quantity" },
        },
      },
    ]);

    const couponCounts = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate, $lt: endDate },
          coupon: { $ne: null, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$coupon",
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, coupon: "$_id", count: 1 } },
    ]);

    const formattedCouponCounts = couponCounts.map((entry) => ({
      [entry.coupon]: entry.count,
    }));

    const totalSales = groupedOrders
      .reduce(
        (sum, order) =>
          sum +
          order.products.reduce(
            (productSum, product) =>
              productSum + product.Mrp * product.quantity,
            0
          ),
        0
      )
      .toFixed(2);

    const totalProductDiscount = groupedOrders
      .reduce(
        (sum, order) =>
          sum +
          order.products.reduce(
            (productSum, product) =>
              productSum +
              (product.Mrp - product.productPrice) * product.quantity,
            0
          ),
        0
      )
      .toFixed(2);

    const totalDiscount = groupedOrders
      .reduce((sum, order) => sum + order.discount, 0)
      .toFixed(2);

    const totalOrderedProductCount = groupedOrders.reduce(
      (sum, order) =>
        sum +
        order.products.reduce(
          (productSum, product) => productSum + product.quantity,
          0
        ),
      0
    );

    const transactions = groupedOrders.flatMap((order) =>
      order.products.map((product) => ({
        date: order.orderDate
          ? new Date(order.orderDate).toISOString().split("T")[0]
          : "N/A",
        productName: product.productName || "N/A",
        quantity: product.quantity || 0,
        price: product.productPrice.toFixed(2) || "0.00",
        Product_discount: (
          (product.Mrp - product.productPrice) *
          product.quantity
        ).toFixed(2),
        originalPrice: product.Mrp.toFixed(2),
      }))
    );

    const totalProfit = groupedOrders
      .reduce((sum, order) => sum + order.finalPrice, 0)
      .toFixed(2);

    return {
      groupedOrders,
      formattedCouponCounts,
      totalSales,
      totalDiscount,
      totalProfit,
      totalOrderedProductCount,
      totalProductDiscount,
      transactions,
    };
  } catch (error) {
    console.error("Error generating report data:", error.message);
    throw error;
  }
};

const downloadExcel = async (req, res) => {
  try {
    const { startDate, endDate, filter } = req.query;

    const reportData = await generateReportData(
      new Date(startDate),
      new Date(endDate),
      filter
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Product Discount", key: "productDiscount", width: 20 },
      { header: "Original Price", key: "originalPrice", width: 20 },
      { header: "Price", key: "price", width: 20 },
    ];

    reportData.transactions.forEach((transaction) => {
      worksheet.addRow({
        date: transaction.date,
        productName: transaction.productName,
        quantity: transaction.quantity,
        productDiscount: transaction.Product_discount,
        originalPrice: transaction.originalPrice,
        price: transaction.price,
      });
    });

    res.setHeader(
      "Content-Disposition",
      `attachment;filename= ${filter} Wizcart sales_report.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).send("Error generating Excel");
  }
};

const downloadPdf = async (req, res) => {
  try {
    const { startDate, endDate, filter } = req.query;

    const reportData = await generateReportData(
      new Date(startDate),
      new Date(endDate),
      filter
    );

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Add report data to PDF
    doc.fontSize(16).text("Sales Report", { align: "center" });
    doc.fontSize(12).text(`Filter: ${filter || "All Time"}`);
    doc.fontSize(12).text(`Total Sales: ₹${reportData.totalSales}`);
    doc.fontSize(12).text(`Total Discounts: ₹${reportData.totalDiscount}`);
    doc
      .fontSize(12)
      .text(`Total Product Discount: ₹${reportData.totalProductDiscount}`);
    doc.fontSize(12).text(`Total Profit: ₹${reportData.totalProfit}`);
    doc
      .fontSize(12)
      .text(
        `Total Ordered Product Count: ${reportData.totalOrderedProductCount}`
      );

    doc.text("\nRecent Transactions:");
    reportData.transactions.forEach((transaction) => {
      doc.text(
        `Date: ${transaction.date} | Product: ${transaction.productName} | Quantity: ${transaction.quantity} | Price: ₹${transaction.price}`
      );
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};

const ledger=async (req,res)=>{
  try {
    
    const orders = await Order.find({
      paymentMethod: { $ne: "razorpay" },
    });
    
    
    console.log(orders);
    
 
    res.render('admin/ledger', { orders });
 
 
  } catch (error) {
   console.log(error.message);
   
  }
 }

module.exports = {
  adminLogin,
  adminLogindata,
  dashBord,
  userList,
  blockUser,
  addProduct,
  products,
  deleteImg,
  editProduct,
  editProductForm,
  deleteProduct,
  hideProduct,
  unHide,
  category,
  deleteCategory,
  addCategory,
  hideCategory,
  showCategory,
  editCategory,
  orderMangement,
  returnOrders,
  acceptAndRefund,
  rejectReturn,
  updateStatus,
  singelOderhistory,
  createCoupon,
  couponMangemnt,
  deleteCoupon,
  unhideCoupon,
  hideCoupon,
  updateCoupon,
  logout,
  saleReport,
  offerManagemanent1,
  newOffer,
  removeOffer,
  downloadExcel,
  downloadPdf,
  ledger
};
