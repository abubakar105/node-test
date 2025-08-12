const express = require("express");
const Router = new express.Router();
const Products = require("../Models/ProductSchema");
const USER = require("../Models/UserSchema.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Access_Token_Key = process.env.Access_Token_Key;
const Refresh_Token_Key = process.env.Refresh_Token_Key;
const Authentication = require("../Middleware/Authentication");
const crypto = require("crypto");
const sendEmail = require("../utils/SendEmail");

const blackListToken = [];

Router.get("/getProducts", async (req, res) => {
  try {
    const AllProducts = await Products.find();
    res.status(200).json(AllProducts);
  } catch (error) {
    res.status(400).json("error to get product" + error.message);
  }
});

Router.get("/getSingleProduct/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getSingleProduct = await Products.findOne({ id: id });
    res.status(200).json(getSingleProduct);
  } catch (error) {
    res.status(400).json("error to get data" + error.message);
  }
});

Router.post("/Register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name) {
    return res.status(500).json({ message: "some name are missing" });
  } else if (!email) {
    return res.status(500).json({ message: "some email are missing" });
  } else if (!password) {
    return res.status(500).json({ message: "some password are missing" });
  }

  try {
    const RegisterCredentials = await USER.findOne({ email });
    if (RegisterCredentials) {
      return res.status(500).json({ message: "user already exist" });
    } else {
      const registerUser = new USER({ name, email, password });
      const saveUser = await registerUser.save();
      return res.status(200).json({ saveUser });
    }
  } catch (error) {
    return res.status(500).json({ message: "failed to register user" });
  }
});

Router.post("/Login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const LoginCredentials = await USER.findOne({ email });
    if (!LoginCredentials) {
      return res.status(400).json({ message: "User not found" });
    } else {
      const checkPassword = await bcrypt.compare(
        password,
        LoginCredentials.password
      );
      if (!checkPassword) {
        return res.status(400).json({ message: "Invalid Password" });
      } else {
        const accessToken = jwt.sign(
          { id : LoginCredentials._id },
          Access_Token_Key,
          { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
          { id: LoginCredentials._id },
          Refresh_Token_Key,
          { expiresIn: "7d" }
        );
        return res
          .status(200)
          .json({ message: "login success", accessToken, refreshToken });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: "failed to login" });
  }
});

Router.post("/Refresh", async (res, req) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(500).json({ message: "refreshToken required" });

  jwt.verify(refreshToken, Refresh_Token_Key, (err, user) => {
    if (err) return res.status(500).json({ error: "invalid refresh token" });

    const accessToken = jwt.sign({ id: user._id }, Access_Token_Key, {
      expiresIn: "15m",
    });
    res.status(200).json({ accessToken });
  });
});

Router.get("/AddCart/:id", Authentication, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Products.findOne({ id });
    if (!product) return res.status(500).json({ message: "Product not found" });

    const fullUser = await USER.findById(req.user.id);
    if (fullUser) {
      const cartData = await fullUser.addCart(product);
      await fullUser.save();
      res.status(200).json(fullUser);
    } else {
      res.status(500).json({ message: "invalid user" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

Router.get("/Validate", Authentication, async (req, res) => {
  try {
    const buyer = await USER.findOne({ _id: req.user.id });
    if (buyer) {
      return res.status(200).json(buyer);
    } else {
      res.status(501).json({ message: "Buyer not found" });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

Router.post("/Logout", Authentication, async (req, res) => {
  try {
    const Token = req.token;
    if (!Token)
      return res.status(401).json({ message: "token is not provided" });
    blackListToken.push(Token);
    res.status(200).json({ message: "Logout Successful" });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

Router.post("/ForgetPassword", async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(501).json({ message: "email required" });
    const user = await USER.findOne({ email });
    if (!user) return res.status(404).json({ message: "user not found" });

    const token = crypto.randomBytes(20).toString("hex");
    const expire = Date.now() + 3600000;
    user.forgetPasswordToken = token;
    user.forgetTokenExpire = expire;
    await user.save();
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: "reset password request",
      text: `click here to reset password ${resetURL}`,
    });
    res.status(200).json({ message: "reset link send", resetURL });
  } catch (error) {
    res.status(501).json(error.message);
  }
});

Router.post("/ResetPassword/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await USER.findOne({ forgetPasswordToken: token });
    if (!user) return res.status(401).json({ message: "user not found" });
    user.password = await bcrypt.hash(password, 12);
    await user.save();
    res.status(200).json({ message: "reset password successful" });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

Router.delete("/Remove/:id", Authentication, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const user = await USER.findById({ _id: userId });
    if (!user) return res.status(401).json({ message: "user not found" });
    user.cart = user.cart.filter((item) => item.id.toString() !== id);
    await user.save();
    res.status(200).json({ message: "item remove from cart", cart: user.cart });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = Router;
