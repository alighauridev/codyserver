const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Lesson = require("../../models/lessonModel");
const ErrorHandler = require("../../utils/ErrorHandler");
const Topic = require("../../models/topic");
const {
  optimizedEstimateReadingTime,
} = require("../../utils/calculateDuration");
const Course = require("../../models/courseModel");
const router = express.Router();

router.get(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }
    res.status(200).json({
      success: true,
      lesson,
    });
  })
);

router.post(
  "/lessons/:topicId",
  asyncHandler(async (req, res, next) => {
    const { topicId } = req.params;
    const { title, content } = req.body;
    if (!topicId) {
      return next(new ErrorHandler("Please provide a topic id"));
    }
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }
    const course = await Course.findById(topic.courseId)
      .populate({
        path: "topics",
        select: "duration",
      })
      .select("duration lessonsCount");
    console.log({ course: JSON.stringify(course, null, 3) });

    const duration = optimizedEstimateReadingTime(content);

    const lesson = await Lesson.create({
      title,
      content,
      topic: topic._id,
      duration,
    });

    topic.lessons.push(lesson._id);
    topic.duration += Number(duration);

    const totalCourseDuration = course.topics.reduce(
      (total, t) => total + t.duration,
      0
    );

    course.duration = totalCourseDuration;
    course.lessonsCount += 1;

    await Promise.all([
      topic.save({ validateBeforeSave: false }),
      course.save({ validateBeforeSave: false }),
    ]);
    res.status(200).json({
      success: true,
      message: "Lesson create successfully",
    });
  })
);

router.put(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const lessonId = req.params.id;
    const { title, content } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new ErrorHandler("Lesson not found", 404);
    }

    const oldDuration = lesson.duration;
    let newDuration = oldDuration;

    if (content) {
      newDuration = optimizedEstimateReadingTime(content);

      lesson.content = content;
      lesson.duration = newDuration;
    }

    if (title) {
      lesson.title = title;
    }

    await lesson.save({ validateBeforeSave: false });

    if (newDuration !== oldDuration && content) {
      const [topic, course] = await Promise.all([
        Topic.findById(lesson.topic),
        Course.findOne({ topics: lesson.topic }),
      ]);

      if (!topic || !course) {
        throw new ErrorHandler("Associated topic or course not found", 404);
      }

      topic.duration = topic.duration - oldDuration + newDuration;
      course.duration = course.duration - oldDuration + newDuration;

      await Promise.all([
        topic.save({ validateBeforeSave: false }),
        course.save({ validateBeforeSave: false }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
    });
  })
);
router.delete(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }

    await lesson.remove();

    // Remove lesson from topic and update duration
    await Topic.findByIdAndUpdate(lesson.topic, {
      $pull: { lessons: lesson._id },
      //   $inc: { duration: -lesson.duration },
    });

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  })
);
module.exports = router;