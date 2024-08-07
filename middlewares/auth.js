const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../models/userModel");

const isAuthenticated = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) {
      return next(new ErrorHandler("No token provided", 400));
    }

    const token = authToken.split(" ")[1];

    const decoded = jwt.verify(token, "ferer34");
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorHandler("Unauthorized User", 400));
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return next(new ErrorHandler(error, 400));
  }
};

module.exports = isAuthenticated;
