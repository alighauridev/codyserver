const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Bookmark = require("../../models/bookmark");
const isAuthenticated = require("../../middlewares/auth");
const ErrorHandler = require("../../utils/ErrorHandler");

const router = express.Router();

router.use(isAuthenticated);
// Create a new bookmark
router.post(
  "/bookmarks",
  asyncHandler(async (req, res, next) => {
    const { lessonId, courseId } = req.body;
    const userId = req.user._id;

    const newBookmark = await Bookmark.create({
      user: userId,
      lesson: lessonId,
      course: courseId,
    });

    res.status(201).json({
      success: true,
      data: {
        bookmark: newBookmark,
      },
    });
  })
);

// Delete a bookmark
router.delete(
  "/bookmarks/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOneAndDelete({ _id: id, user: userId });

    if (!bookmark) {
      return next(new ErrorHandler("No bookmark found with that ID", 404));
    }

    res.status(204).json({
      success: true,
      data: null,
    });
  })
);

// Get all bookmarks for a user with pagination, filtering, and searching
router.get(
  "/bookmarks",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, course, search } = req.query;
    const skip = (page - 1) * limit;
    const filter = { user: req.user._id };

    if (course) filter.course = course;
    if (search) {
      filter.$or = [
        { "lesson.title": { $regex: search, $options: "i" } },
        { "course.title": { $regex: search, $options: "i" } },
      ];
    }

    const [totalBookmarks, bookmarks] = await Promise.all([
      Bookmark.countDocuments(filter).lean(),
      Bookmark.find(filter)
        .populate("lesson", "title duration")
        .populate("course", "title coverImage")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      results: bookmarks.length,
      totalPages: Math.ceil(totalBookmarks / limit),
      totalBookmarks,
      currentPage: Number(page),
      bookmarks,
    });
  })
);

router.get(
  "/bookmarks/grouped",
  asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, search = "", courseId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build the filter
    const filter = { user: userId };
    if (courseId) filter.course = courseId;

    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { "lessonDetails.title": { $regex: search, $options: "i" } },
          { "courseDetails.title": { $regex: search, $options: "i" } },
        ],
      };
    }

    // Pipeline to get all matching bookmarks
    const bookmarksPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lessonDetails",
        },
      },
      { $unwind: "$lessonDetails" },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      { $unwind: "$courseDetails" },
      { $match: searchFilter },
      { $sort: { createdAt: -1 } },
    ];

    // Get total count of matching bookmarks
    const totalBookmarks = await Bookmark.aggregate([
      ...bookmarksPipeline,
      { $count: "total" },
    ]);

    // Get paginated and grouped bookmarks
    const groupedBookmarks = await Bookmark.aggregate([
      ...bookmarksPipeline,
      {
        $group: {
          _id: "$course",
          courseTitle: { $first: "$courseDetails.title" },
          courseCoverImage: { $first: "$courseDetails.coverImage" },
          bookmarks: {
            $push: {
              _id: "$_id",
              lessonId: "$lesson",
              lessonTitle: "$lessonDetails.title",
              lessonDuration: "$lessonDetails.duration",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: "$courseTitle",
          coverImage: "$courseCoverImage",
          bookmarks: 1,
          bookmarksCount: { $size: "$bookmarks" },
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const totalCount = totalBookmarks[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.status(200).json({
      success: true,
      results: groupedBookmarks.length,
      totalPages,
      totalBookmarks: totalCount,
      currentPage: Number(page),
      bookmarks: groupedBookmarks,
      hasNextPage: Number(page) < totalPages,
    });
  })
);
// Bookmark check
router.get(
  "/bookmarks/check/:lessonId",
  asyncHandler(async (req, res) => {
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      lesson: req.params.lessonId,
    })
      .select("_id")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        bookmarkId: bookmark?._id || null,
      },
    });
  })
);
module.exports = router;
