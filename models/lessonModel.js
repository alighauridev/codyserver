const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "A lesson must belong to a topic"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "A lesson must have a title"],
      trim: true,
      maxlength: [100, "A lesson title must be less than 100 characters"],
    },
    duration: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: [true, "A lesson must have content"],
    },
    quiz: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LessonQuiz",
      },
    ],
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ topic: 1 });
module.exports = mongoose.model("Lesson", lessonSchema);
