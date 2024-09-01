const express = require("express");
const app = express();
const userRoute = require("./router/userRouter");
const adminRoute = require("./router/adminRouter");
const path = require("path");

const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const nocache = require("nocache");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const productAddRoute = require("./controller/productAdding");
const methodOverride = require("method-override");
const cors = require('cors');

require('dotenv').config()

const port = process.env.port

mongoose.connect(process.env.mongodbConnect);


app.use(productAddRoute.productAddRoute);
app.use(nocache());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
const googleAuth = require("./auth/google");

app.use(cookieParser("keyboard cat"));
app.use(flash());
app.use(cors());


app.use(
  session({
    secret:process.env.wizcartSecret,
    resave: true,
    saveUninitialized: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(userRoute.userRoute);
app.use(adminRoute.adminRoute);

app.listen(port, () => console.log(`http://localhost:${port}`));
app.use(googleAuth.authRoute);
