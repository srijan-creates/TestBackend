const express = require("express");
const route = express.Router();
const {
  getUser,
  getUserId,
  DeleteUser,
  UpdateUser,
  createUser,
  userLogin,
  verifyToken,
  forgotPassword,
  resetPassword,
} = require("../controller/userController");

route.get("/users", getUser);
route.get("/users/:id", getUserId);
route.patch("/users/:id", UpdateUser);
route.delete("/users/:id", DeleteUser);

route.post("/signup", createUser);
route.post("/signin", userLogin);

route.get("/verify-email/:verificationToken", verifyToken);
route.post("/forgot-password", forgotPassword);
route.post("/reset-password/:resetToken", resetPassword);

module.exports = route;
