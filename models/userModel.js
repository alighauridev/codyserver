const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  AvailableLoginProviders,
  LoginProviders,
  AvailableUserRoles,
  UserRoles,
  AvailableOtpPurposes,
} = require("../constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    bio: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
      minLength: [8, "Password should have at least 8 chars"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
      },
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRoles.USER,
    },
    provider: {
      type: String,
      enum: AvailableLoginProviders,
      default: LoginProviders.EMAIL_PASSWORD,
      index: true,
    },
    providerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    enrolledCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "EnrolledCourse" },
    ],
    otp: {
      code: { type: String, select: false },
      expiry: { type: Date, select: false },
    },
    otpPurpose: {
      type: String,
      enum: AvailableOtpPurposes,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    quizProgress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizProgress",
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);
userSchema.index({ email: 1, provider: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.generateOTPToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "10m", // OTP token expires in 10 minutes
  });
};
// Generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("Password is not set");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate Reset Password Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.methods.generateOTP = function (purpose) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: crypto.createHash("sha256").update(otp).digest("hex"),
    expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
  this.otpPurpose = purpose;
  return otp;
};

userSchema.methods.verifyOTP = function (otp, purpose) {
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  return (
    this.otp.code === hashedOTP &&
    this.otp.expiry > Date.now() &&
    this.otpPurpose === purpose
  );
};

userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpPurpose = undefined;
};

module.exports = mongoose.model("User", userSchema);
