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
require("dotenv").config();
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(cors()); // Use CORS with default options - allows all origins
app.use(bodyParser.json());

mongoose
  .connect(
    "mongodb+srv://gali76682:xTgBeqc2Bs2Wdvkf@serverlessinstance0.dlbyqem.mongodb.net/?retryWrites=true&w=majority&appName=ServerlessInstance0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));
// Courses
// Add a new course
app.get("/", async (req, res) => {
  res.status(201).send("Api is Live 🔥");
});
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
  challenges
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
  const courseId = "66d4480beb49f0c20f0bcde6";

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
