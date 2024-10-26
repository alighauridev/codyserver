const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question text is required"],
    trim: true,
    maxlength: [500, "Question text cannot exceed 500 characters"],
  },
  options: [
    {
      _id: false,
      optionText: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, "Option text cannot exceed 200 characters"],
      },
      isCorrect: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
  ],
});

questionSchema.pre("save", function (next) {
  const correctOptions = this.options.filter((option) => option.isCorrect);
  if (correctOptions.length !== 1) {
    next(new Error("Each question must have exactly one correct option"));
  }
  next();
});

// Quiz Schema
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: [100, "Quiz title cannot exceed 100 characters"],
    },
    icon: {
      type: String,
      required: [true, "Quiz icon is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "A quiz must belong to a category"],
    },
    info: {
      type: String,
      required: [true, "Quiz info is required"],
    },
    difficulty: {
      type: String,
      required: [true, "Quiz difficulty is required"],
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: [true, "Quiz description is required"],
      trim: true,
      maxlength: [500, "Quiz description cannot exceed 500 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);
const Question = mongoose.model("Question", questionSchema);

module.exports = {
  Question,
  Quiz,
};
