const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const NodeCache = require("node-cache");
const { userCache } = require("../utils/cache");

const getUserById = async (userId) => {
  try {
    let user = userCache.get(userId);

    if (user) {
      return user;
    }

    user = await User.findById(userId)
      .select("-quizProgress -enrolledCourses")
      .lean(); // Add lean() here

    if (user) {
      userCache.set(userId, user);
    }

    return user;
  } catch (error) {
    console.error("Cache error:", error);
    return await User.findById(userId).lean();
  }
};

const isAuthenticated = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_NO_TOKEN",
          message: "Please login to access this resource",
        },
      });
    }

    // Validate token format
    const [bearer, token] = authToken.split(" ");

    if (bearer !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_INVALID_FORMAT",
          message: "Invalid authorization format",
        },
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await getUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: {
            code: "AUTH_TOKEN_EXPIRED",
            message: "Token has expired",
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_INVALID_TOKEN",
          message: "Invalid token",
        },
      });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_SERVER_ERROR",
        message: "Authentication error occurred",
      },
    });
  }
};

module.exports = isAuthenticated;
