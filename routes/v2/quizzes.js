const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const { Quiz, Question } = require("../../models/quizModel");
const ErrorHandler = require("../../utils/ErrorHandler");
const isAuthenticated = require("../../middlewares/auth");
const QuizProgress = require("../../models/quizProgress");
const User = require("../../models/userModel");
const router = express.Router();

const calculateQuizTime = (questions) => {
  const baseTimePerQuestion = 2;
  const additionalTimePerOption = 0.5;

  let totalTime = questions.reduce((acc, question) => {
    return (
      acc +
      baseTimePerQuestion +
      question.options.length * additionalTimePerOption
    );
  }, 0);

  return Math.ceil(totalTime);
};

router.post(
  "/quizzes/start-quiz/:quizId",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return next(new ErrorHandler("Quiz not found", 404));
    }

    // Find any existing progress for this quiz
    let quizProgress = await QuizProgress.findOne({
      user: userId,
      quiz: quizId,
    });

    if (!quizProgress) {
      // Create a new progress entry if none exists or if the previous one was completed
      quizProgress = await QuizProgress.create({
        user: userId,
        quiz: quizId,
        status: "In Progress",
        startDate: new Date(),
        lastAttemptDate: new Date(),
        score: 0,
        progress: 0,
        nextQuestionId: quiz.questions[0]._id,
      });

      await User.findByIdAndUpdate(userId, {
        $addToSet: { quizProgress: quizProgress._id },
      });
    } else {
      // Update the lastAttemptDate for an existing in-progress quiz
      quizProgress.lastAttemptDate = new Date();
      await quizProgress.save();
    }

    res.status(200).json({
      success: true,
      quizProgress,
    });
  })
);

router.post(
  "/quizzes/reset-progress/:quizId",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { quizId } = req.params;
    const userId = req.user._id;

    // Delete existing progress
    await QuizProgress.findOneAndDelete({ user: userId, quiz: quizId });

    res.status(200).json({
      success: true,
      message: "Quiz progress reset successfully",
    });
  })
);

router.post(
  "/quizzes/submit-answer/:quizProgressId",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { quizProgressId } = req.params;
    const { questionId, selectedOptionIndex, isCorrect } = req.body;
    const userId = req.user._id;

    const quizProgress = await QuizProgress.findById(quizProgressId).populate({
      path: "quiz",
      populate: { path: "questions" },
    });

    if (!quizProgress) {
      return next(new ErrorHandler("Quiz progress not found", 404));
    }

    if (quizProgress.user.toString() !== userId.toString()) {
      return next(new ErrorHandler("Unauthorized", 403));
    }

    const questionIndex = quizProgress.quiz.questions.findIndex(
      (q) => q._id.toString() === questionId
    );
    if (questionIndex === -1) {
      return next(new ErrorHandler("Question not found", 404));
    }

    if (isCorrect) {
      quizProgress.score += 1;
    }

    quizProgress.progress =
      ((questionIndex + 1) / quizProgress.quiz.questions.length) * 100;

    if (questionIndex + 1 === quizProgress.quiz.questions.length) {
      quizProgress.status = "Completed";
      quizProgress.completionDate = new Date();
    }

    quizProgress.lastAttemptDate = new Date();
    await quizProgress.save();

    res.status(200).json({
      success: true,
      quizProgress,
    });
  })
);

router.get(
  "/quizzes/user-progress",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const userProgress = await QuizProgress.find({ user: userId })
      .populate({
        path: "quiz",
        select: "title icon info difficulty questions",
        populate: {
          path: "questions",
          select: "_id",
        },
      })
      .select("-user")
      .sort({ lastAttemptDate: -1 });

    // Group progress by quiz and get the most recent attempt
    const progressByQuiz = userProgress.reduce((acc, progress) => {
      const quizId = progress.quiz._id.toString();
      if (
        !acc[quizId] ||
        progress.lastAttemptDate > acc[quizId].lastAttemptDate
      ) {
        acc[quizId] = progress;
      }
      return acc;
    }, {});

    const formatQuizProgress = (progress) => {
      const answeredQuestionsCount = Math.floor(
        (progress.progress / 100) * progress.quiz.questions.length
      );
      const nextQuestionId =
        progress.status === "In Progress" &&
        answeredQuestionsCount < progress.quiz.questions.length
          ? progress.quiz.questions[answeredQuestionsCount]._id
          : null;

      return {
        _id: progress._id,
        quiz: {
          _id: progress.quiz._id,
          title: progress.quiz.title,
          icon: progress.quiz.icon,
          info: progress.quiz.info,
          difficulty: progress.quiz.difficulty,
        },
        status: progress.status,
        score: progress.score,
        progress: progress.progress,
        startDate: progress.startDate,
        completionDate: progress.completionDate,
        lastAttemptDate: progress.lastAttemptDate,
        nextQuestionId: nextQuestionId,
      };
    };

    const inProgressQuizzes = Object.values(progressByQuiz)
      .filter((progress) => progress.status === "In Progress")
      .map(formatQuizProgress);

    const completedQuizzes = Object.values(progressByQuiz)
      .filter((progress) => progress.status === "Completed")
      .map(formatQuizProgress);

    res.status(200).json({
      success: true,
      inProgressQuizzes,
      completedQuizzes,
    });
  })
);

router.get(
  "/quizzes/quiz-progress/:quizProgressId",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { quizProgressId } = req.params;
    const userId = req.user._id;

    const quizProgress = await QuizProgress.findById(quizProgressId)
      .populate({
        path: "quiz",
        select: "title icon info difficulty",
        populate: {
          path: "questions",
          select: "question options.optionText",
        },
      })
      .select("-user");

    if (!quizProgress) {
      return next(new ErrorHandler("Quiz progress not found", 404));
    }

    if (quizProgress.user.toString() !== userId.toString()) {
      return next(new ErrorHandler("Unauthorized", 403));
    }

    res.status(200).json({
      success: true,
      quizProgress,
    });
  })
);

router.get(
  "/quizzes",
  asyncHandler(async (req, res) => {
    const { category, difficulty, search, limit = 10, viewAll } = req.query;
    let query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let quizQuery = Quiz.find(query)
      .select("title icon info difficulty attempts description tags")
      .sort({ createdAt: -1 });

    if (viewAll !== "true") {
      quizQuery = quizQuery.limit(parseInt(limit));
    }

    const quizzes = await quizQuery;

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  })
);

router.get(
  "/quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id).populate("questions");

    if (!quiz) {
      return next(new ErrorHandler("No quiz found with that ID", 404));
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  })
);

router.post(
  "/quizzes",
  asyncHandler(async (req, res) => {
    const { title, icon, category, difficulty, description, tags, questions } =
      req.body;

    // Create questions
    questions.forEach((question) => {
      const correctOptions = question.options.filter((opt) => opt.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error(
          `Question "${question.question}" must have exactly one correct option`
        );
      }
    });

    // Create questions
    const createdQuestions = await Question.insertMany(questions);

    // Calculate the number of questions and estimated time
    const totalQuestions = createdQuestions.length;
    const estimatedTime = calculateQuizTime(createdQuestions);

    // Create the info string
    const info = `${totalQuestions} questions • ${estimatedTime} min`;

    // Create the new quiz
    const newQuiz = await Quiz.create({
      title,
      icon,
      category,
      difficulty,
      description,
      tags,
      info,
      questions: createdQuestions.map((q) => q._id),
    });

    res.status(201).json({
      success: true,
      message: "Quizzes Add Successfully",
    });
  })
);

router.patch(
  "/quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const { questions, ...quizData } = req.body;

    if (questions) {
      // Update or create questions
      const updatedQuestions = await Promise.all(
        questions.map(async (q) => {
          if (q._id) {
            return await Question.findByIdAndUpdate(q._id, q, { new: true });
          } else {
            return await Question.create(q);
          }
        })
      );

      quizData.questions = updatedQuestions.map((q) => q._id);

      // Recalculate info
      const totalQuestions = updatedQuestions.length;
      const estimatedTime = calculateQuizTime(updatedQuestions);
      quizData.info = `${totalQuestions} questions • ${estimatedTime} min`;
    }

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, quizData, {
      new: true,
      runValidators: true,
    }).populate("questions");

    if (!quiz) {
      return next(new ErrorHandler("No quiz found with that ID", 404));
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  })
);

router.delete(
  "/quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("No quiz found with that ID", 404));
    }

    // Delete associated questions
    await Question.deleteMany({ _id: { $in: quiz.questions } });

    // Delete the quiz
    await quiz.remove();

    res.status(204).json({
      success: true,
      data: null,
    });
  })
);

module.exports = router;
