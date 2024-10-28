// quizProgressModel.js
const mongoose = require("mongoose");

const quizProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    status: {
      type: String,
      enum: ["In Progress", "Completed", "Reset"],
      default: "In Progress",
    },
    score: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
    },
    lastAttemptDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
quizProgressSchema.index({ user: 1, quiz: 1, status: 1 });
const QuizProgress = mongoose.model("QuizProgress", quizProgressSchema);

module.exports = QuizProgress;
