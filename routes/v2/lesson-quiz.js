const express = require("express");
const isAuthenticated = require("../../middlewares/auth");
const LessonQuiz = require("../../models/LessonQuiz");
const ErrorHandler = require("../../utils/ErrorHandler");
const lessonModel = require("../../models/lessonModel");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const EnrolledCourse = require("../../models/enrolledCourse");
const { default: mongoose } = require("mongoose");
const router = express.Router();

// Create a new quiz
router.post(
  "/lesson-quizzes",
  asyncHandler(async (req, res, next) => {
    const { lessonId, questions } = req.body;

    // Validate lesson existence
    const lessonExists = await lessonModel.exists({ _id: lessonId });
    if (!lessonExists) {
      return next(new ErrorHandler("Lesson not found", 404));
    }

    // Validate quiz array
    if (!Array.isArray(questions) || questions.length === 0) {
      return next(
        new ErrorHandler("Please provide an array of questions", 400)
      );
    }

    // Validate each quiz
    for (const quiz of questions) {
      if (!quiz.question) {
        return next(
          new ErrorHandler("Question is required for all questions", 400)
        );
      }
      if (!Array.isArray(quiz.options) || quiz.options.length !== 4) {
        return next(
          new ErrorHandler("Each quiz must have exactly 4 options", 400)
        );
      }
      // Ensure at least one correct option
      const hasCorrectOption = quiz.options.some((option) => option.isCorrect);
      if (!hasCorrectOption) {
        return next(
          new ErrorHandler(
            "Each quiz must have at least one correct option",
            400
          )
        );
      }
    }

    // Create all quizzes
    const createdQuizzes = await LessonQuiz.create(
      questions.map((quiz) => ({
        lesson: lessonId,
        question: quiz.question,
        options: quiz.options,
      }))
    );

    // Update lesson with all quiz IDs
    await lessonModel.findByIdAndUpdate(lessonId, {
      $push: {
        quiz: {
          $each: createdQuizzes.map((quiz) => quiz._id),
        },
      },
    });

    res.status(201).json({
      success: true,
      count: createdQuizzes.length,
      quizzes: createdQuizzes,
    });
  })
);

router.put(
  "/lesson-quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const { question, options } = req.body;

    // Find the quiz
    const quiz = await LessonQuiz.findById(req.params.id);
    if (!quiz) {
      return next(new ErrorHandler("LessonQuiz not found", 404));
    }

    // Validate question
    if (!question || typeof question !== "string" || question.trim() === "") {
      return next(new ErrorHandler("Question is required", 400));
    }

    // Validate options array
    if (!Array.isArray(options) || options.length !== 4) {
      return next(new ErrorHandler("Must provide exactly 4 options", 400));
    }

    // Validate option structure
    for (const option of options) {
      if (
        !option.optionText ||
        typeof option.optionText !== "string" ||
        option.optionText.trim() === ""
      ) {
        return next(new ErrorHandler("Each option must have text", 400));
      }
      if (typeof option.isCorrect !== "boolean") {
        return next(
          new ErrorHandler("Each option must specify if it's correct", 400)
        );
      }
    }

    // Ensure at least one correct option
    const hasCorrectOption = options.some((option) => option.isCorrect);
    if (!hasCorrectOption) {
      return next(
        new ErrorHandler("Must have at least one correct option", 400)
      );
    }

    // Ensure not more than one correct option
    const correctOptionsCount = options.filter(
      (option) => option.isCorrect
    ).length;
    if (correctOptionsCount > 1) {
      return next(
        new ErrorHandler("Cannot have more than one correct option", 400)
      );
    }

    // Update the quiz
    const updatedQuiz = await LessonQuiz.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          question: question.trim(),
          options: options.map((opt) => ({
            optionText: opt.optionText.trim(),
            isCorrect: opt.isCorrect,
          })),
        },
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run model validators
      }
    );

    res.status(200).json({
      success: true,
      quiz: updatedQuiz,
    });
  })
);

// Get all quizzes for a lesson
router.get(
  "/lessons/:lessonId/quizzes",
  asyncHandler(async (req, res, next) => {
    const { lessonId } = req.params;

    const quizzes = await LessonQuiz.find({ lesson: lessonId });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  })
);

// Get a single quiz
router.get(
  "/lesson-quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await LessonQuiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("LessonQuiz not found", 404));
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  })
);

// Delete a quiz
router.delete(
  "/lesson-quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await LessonQuiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("LessonQuiz not found", 404));
    }

    await lessonModel.findByIdAndUpdate(quiz.lesson, {
      $pull: { quiz: quiz._id },
    });

    await quiz.remove();

    res.status(200).json({
      success: true,
      message: "LessonQuiz deleted successfully",
    });
  })
);

router.patch(
  "/lesson-quizzes/:courseId/:lessonId/complete",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    // Validate input
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(lessonId)
    ) {
      return next(new ErrorHandler("Invalid course or lesson ID", 400));
    }

    // Find the enrolled course
    const enrolledCourse = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrolledCourse) {
      return next(new ErrorHandler("You are not enrolled in this course", 404));
    }

    // Find the lesson in the enrolled course
    const lessonIndex = enrolledCourse.lessonsCompleted.findIndex(
      (lesson) => lesson.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      return next(
        new ErrorHandler("Lesson not found in the enrolled course", 404)
      );
    }

    // Update the quiz completion status
    enrolledCourse.lessonsCompleted[lessonIndex].quizCompleted = true;

    await enrolledCourse.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      success: true,
      message: "LessonQuiz completed successfully",
    });
  })
);

module.exports = router;
