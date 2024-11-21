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

const processContent = (content) => {
  // If content is already a string, return it directly
  if (typeof content === "string") {
    // Only try to parse and stringify if it looks like JSON
    if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch (e) {
        // If parsing fails, it's probably markdown text, return as-is
        return content;
      }
    }
    return content;
  }

  // If content is an object, stringify it
  if (typeof content === "object" && content !== null) {
    return JSON.stringify(content, null, 2);
  }

  // For any other type, convert to string
  return String(content);
};

router.get(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const lesson = await Lesson.findById(id).lean();
    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }
    if (typeof lesson.content === "string" && lesson.content.startsWith('"')) {
      try {
        console.log("THis is json");

        lesson.content = JSON.parse(lesson.content);
      } catch (e) {
        // If parsing fails, keep the original content
      }
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
    let { title, content } = req.body;

    if (!topicId) {
      return next(new ErrorHandler("Please provide a topic id"));
    }

    // Fetch topic and course in parallel
    const [topic, course] = await Promise.all([
      Topic.findById(topicId),
      Topic.findById(topicId)
        .select("courseId")
        .then((t) => (t ? Course.findById(t.courseId) : null)),
    ]);

    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Process content
    content = processContent(content);
    const duration = optimizedEstimateReadingTime(content);

    // Create lesson and fetch all topics in parallel
    const [lesson, allTopics] = await Promise.all([
      Lesson.create({
        title,
        content,
        topic: topic._id,
        duration,
      }),
      Topic.find({ courseId: course._id }, "duration"),
    ]);

    // Calculate new durations
    const updatedTopicDuration = topic.duration + Number(duration);
    const totalCourseDuration = allTopics.reduce((total, currentTopic) => {
      if (currentTopic._id.toString() === topicId) {
        return total + updatedTopicDuration;
      }
      return total + (currentTopic.duration || 0);
    }, 0);

    // Update topic and course in parallel
    await Promise.all([
      Topic.findByIdAndUpdate(
        topicId,
        {
          $push: { lessons: lesson._id },
          $set: { duration: updatedTopicDuration },
        },
        {
          new: true,
          runValidators: false,
        }
      ),
      Course.findByIdAndUpdate(
        course._id,
        {
          $set: {
            duration: totalCourseDuration,
            lessonsCount: course.lessonsCount + 1,
          },
        },
        {
          new: true,
          runValidators: false,
        }
      ),
    ]);

    res.status(200).json({
      success: true,
      message: "Lesson created successfully",
      lessonId: lesson._id, // Added for convenience
    });
  })
);

router.put(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const lessonId = req.params.id;
    let { title, content } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new ErrorHandler("Lesson not found", 404);
    }

    const oldDuration = lesson.duration;
    let newDuration = oldDuration;

    if (content) {
      // Process content to ensure it's stored as text
      content = processContent(content);
      newDuration = optimizedEstimateReadingTime(content);

      lesson.content = content;
      lesson.duration = newDuration;
    }

    if (title) {
      lesson.title = title;
    }

    await lesson.save({ validateBeforeSave: false });

    if (newDuration !== oldDuration) {
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

    // Get the associated topic and course before deleting the lesson
    const [topic, course] = await Promise.all([
      Topic.findById(lesson.topic),
      Course.findOne({ topics: lesson.topic }),
    ]);

    if (!topic || !course) {
      return next(
        new ErrorHandler("Associated topic or course not found", 404)
      );
    }

    // Calculate new durations
    const newTopicDuration = Math.max(0, topic.duration - lesson.duration);
    const newCourseDuration = Math.max(0, course.duration - lesson.duration);

    // Update the topic and course
    await Promise.all([
      Topic.findByIdAndUpdate(
        lesson.topic,
        {
          $pull: { lessons: lesson._id },
          $set: { duration: newTopicDuration },
        },
        { new: true }
      ),
      Course.findByIdAndUpdate(
        course._id,
        {
          $set: {
            duration: newCourseDuration,
            lessonsCount: Math.max(0, course.lessonsCount - 1),
          },
        },
        { new: true }
      ),
      lesson.remove(),
    ]);

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  })
);
module.exports = router;
