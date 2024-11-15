const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors"); // Import CORS
const courseRoutes = require("./routes/courses");
const lessonRoutes = require("./routes/lessons");
const userRoutes = require("./routes/user");
const topicRoutes = require("./routes/topic");
const quizRoutes = require("./routes/question");
const streakRoutes = require("./routes/streak");
const certificateRoutes = require("./routes/certificate");
const coursev2 = require("./routes/v2/courses");
const categoryv2 = require("./routes/v2/category");
const topicsv2 = require("./routes/v2/topics");
const lessonsv2 = require("./routes/v2/lessons");
const reviewsv2 = require("./routes/v2/reviews");
const lessons_quizes = require("./routes/v2/lesson-quiz");
const quizes = require("./routes/v2/quizzes");
const challenges = require("./routes/v2/challenge");
const bookmarksv2 = require("./routes/v2/bookmark");
const lessonModel = require("./models/lessonModel");
const courseModel = require("./models/courseModel");
const Streak = require("./models/streak");
const User = require("./models/userModel");
const { Question, Quiz } = require("./models/quizModel");
const QuizProgress = require("./models/quizProgress");
const userModel = require("./models/userModel");
const EnrolledCourse = require("./models/enrolledCourse");
const Certificate = require("./models/certificate");
const LessonQuiz = require("./models/LessonQuiz");
const moment = require("moment");

const isProduction = process.env.NODE_ENV?.trim() === "production";
const mongodbURL = isProduction
  ? process.env.PRODUCTION_MONGODB_URL
  : process.env.DEVELOPMENT_MONGODB_URL;
require("dotenv").config();
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(cors()); // Use CORS with default options - allows all origins
app.use(bodyParser.json());

mongoose
  .connect(mongodbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));
// Courses
// Add a new course
app.get("/", async (req, res) => {
  res.status(201).send("Api is Live 🔥");
});
// const Axios = require("axios");
// app.post("/compile", (req, res) => {
//   // getting the required data from the request
//   let code = req.body.code;
//   let language = req.body.language;
//   let input = req.body.input;

//   let languageMap = {
//     c: { language: "c", version: "10.2.0" },
//     cpp: { language: "c++", version: "10.2.0" },
//     python: { language: "python", version: "3.10.0" },
//     java: { language: "java", version: "15.0.2" },
//   };

//   if (!languageMap[language]) {
//     return res.status(400).send({ error: "Unsupported language" });
//   }

//   let data = {
//     language: languageMap[language].language,
//     version: languageMap[language].version,
//     files: [
//       {
//         name: "main",
//         content: code,
//       },
//     ],
//     stdin: input,
//   };

//   let config = {
//     method: "post",
//     url: "https://emkc.org/api/v2/piston/execute",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     data: data,
//   };

//   // calling the code compilation API
//   Axios(config)
//     .then((response) => {
//       res.json(response.data.run); // Send the run object directly
//       console.log(response.data);
//     })
//     .catch((error) => {
//       console.log(error);
//       res.status(500).send({ error: "Something went wrong" });
//     });
// });

app.use("/", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", userRoutes);
app.use("/", topicRoutes);
app.use("/", quizRoutes);
app.use("/certificate", certificateRoutes);
app.use("/", streakRoutes);
app.use(
  "/api/v2",
  quizes,
  coursev2,
  categoryv2,
  topicsv2,
  lessonsv2,
  reviewsv2,
  lessons_quizes,
  bookmarksv2,
  challenges,
  certificateRoutes
);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
const PORT = 3001;
app.listen(PORT, async () => {
  // await streak.deleteMany();
  // const users = await User.find().select("+otp.code +otp.expiry +otpPurpose");
  // console.log({ user: JSON.parse(JSON.stringify(users, null, 4)) });
  // await User.deleteMany();
  // await Category.deleteMany();
  // const course = await courseModel.find({ status: "published" });
  // console.log(course.length);
  // await courseModel.updateMany({ status: "published" });
  // await EnrolledCourse.findByIdAndUpdate("66d46fac8ae554791d76e199",{
  // await User.findOneAndDelete({
  //   email: "alighauridev@gmail.com",
  // });
  // })
  // await EnrolledCourse.deleteMany();
  const userId = "66cefb5a0629ecb1db8efca1";
  const courseId = "66dae1ca7cb2872f16214b25";
  // const certificate = await Certificate.findOne({ userId, courseId });
  // console.log({ certificate });
  await fixStreakQuery();
  // await QuizProgress.deleteMany();
  // await userModel.findByIdAndUpdate(userId, {
  //   $set: { quizProgress: [] },
  // });
  // await EnrolledCourse.deleteMany({
  //   user: userId,
  // });

  // await userModel.findByIdAndUpdate(userId, {
  //   $set: {
  //     enrolledCourses: [],
  //   },
  // });

  console.log(`Server is running on port ${PORT}`);
});
const syncQuizzesWithLessons = async (session) => {
  // Get all quizzes
  const allQuizzes = await LessonQuiz.find({}).session(session);

  // Get all lessons with their quiz arrays
  const allLessons = await lessonModel.find({}).session(session);

  // Create a map of lesson ID to its quizzes for easy lookup
  const lessonQuizMap = new Map();
  allLessons.forEach((lesson) => {
    lessonQuizMap.set(
      lesson._id.toString(),
      new Set(lesson.quiz.map((quizId) => quizId.toString()))
    );
  });

  const updates = [];

  // Check each quiz and update lesson if needed
  for (const quiz of allQuizzes) {
    const lessonId = quiz.lesson.toString();
    const quizId = quiz._id.toString();

    // Get the lesson's current quizzes
    const lessonQuizzes = lessonQuizMap.get(lessonId);

    // If lesson doesn't exist or quiz ID is not in lesson's quiz array
    if (!lessonQuizzes || !lessonQuizzes.has(quizId)) {
      updates.push({
        lessonId: quiz.lesson,
        quizId: quiz._id,
      });
    }
  }

  // Perform all updates
  for (const update of updates) {
    await lessonModel.findByIdAndUpdate(
      update.lessonId,
      { $addToSet: { quiz: update.quizId } },
      { session }
    );
  }

  return updates.length;
};

const fixStreakQuery = async () => {
  const streaks = await Streak.find({});

  for (const streak of streaks) {
    // Sort activities by date
    const sortedActivities = streak.dailyActivities.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let consecutiveDays = 0;
    let lastActivityDate = null;

    // Calculate correct streaks
    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i];
      const activityDate = moment(activity.date).startOf("day");

      if (i === 0) {
        consecutiveDays = 1;
        lastActivityDate = activity.date;
      } else {
        const prevActivity = sortedActivities[i - 1];
        const prevDate = moment(prevActivity.date).startOf("day");
        const daysDiff = activityDate.diff(prevDate, "days");

        if (daysDiff === 1) {
          consecutiveDays++;
        } else if (daysDiff === 0) {
          // Same day activity, continue streak
          continue;
        } else {
          // Break in streak, start new streak
          consecutiveDays = 1;
        }
        lastActivityDate = activity.date;
      }

      currentStreak = consecutiveDays;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    // Check if current streak is still active (no more than 1 day gap from last activity)
    const lastActivityMoment = moment(lastActivityDate).startOf("day");
    const today = moment().startOf("day");
    const daysSinceLastActivity = today.diff(lastActivityMoment, "days");

    // If more than 1 day has passed, reset current streak
    if (daysSinceLastActivity > 1) {
      currentStreak = 0;
    }

    // Update the streak document
    await Streak.findByIdAndUpdate(streak._id, {
      $set: {
        currentStreak,
        longestStreak,
        lastActivityDate,
      },
    });

    console.log(`Fixed streak for user ${streak.userId}:`, {
      currentStreak,
      longestStreak,
      lastActivityDate: lastActivityDate
        ? moment(lastActivityDate).format("YYYY-MM-DD")
        : null,
      activitiesCount: sortedActivities.length,
    });
  }
};
