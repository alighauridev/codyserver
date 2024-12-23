const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const CodeSnippet = require("../../models/CodeSnippet");
const ErrorHandler = require("../../utils/ErrorHandler");
const router = express.Router();

// Get all snippets with filters
router.get(
  "/snippets",
  asyncHandler(async (req, res) => {
    const {
      level,
      tags,
      search,
      status = "published",
      sort = "-publishedAt",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { status };

    // Apply filters
    if (level) query.level = level;
    if (tags) query.tags = { $in: tags.split(",") };

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    const snippets = await CodeSnippet.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CodeSnippet.countDocuments(query);

    res.status(200).json({
      success: true,
      data: snippets,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Get single snippet by slug
router.get(
  "/snippets/:slug",
  asyncHandler(async (req, res, next) => {
    const snippet = await CodeSnippet.findOne({ slug: req.params.slug });

    if (!snippet) {
      return next(new ErrorHandler("Snippet not found", 404));
    }

    res.status(200).json({
      success: true,
      data: snippet,
    });
  })
);

// Create new snippet
router.post(
  "/snippets",
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      level,
      tags,
      codeBlocks,
      status,
      featuredImage,
    } = req.body;

    const snippet = await CodeSnippet.create({
      title,
      description,
      level,
      tags,
      codeBlocks,
      status,
      featuredImage,
      publishedAt: status === "published" ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      data: snippet,
    });
  })
);

// Update snippet
router.put(
  "/snippets/:slug",
  asyncHandler(async (req, res, next) => {
    let snippet = await CodeSnippet.findOne({ slug: req.params.slug });

    if (!snippet) {
      return next(new ErrorHandler("Snippet not found", 404));
    }

    // If status is changing to published, set publishedAt
    if (req.body.status === "published" && snippet.status === "draft") {
      req.body.publishedAt = new Date();
    }

    snippet = await CodeSnippet.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: snippet,
    });
  })
);

// Delete snippet
router.delete(
  "/snippets/:slug",
  asyncHandler(async (req, res, next) => {
    const snippet = await CodeSnippet.findOne({ slug: req.params.slug });

    if (!snippet) {
      return next(new ErrorHandler("Snippet not found", 404));
    }

    await snippet.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  })
);

// Get snippets by tag
router.get(
  "/snippets/tags/:tag",
  asyncHandler(async (req, res) => {
    const snippets = await CodeSnippet.find({
      tags: req.params.tag,
      status: "published",
    }).sort("-publishedAt");

    res.status(200).json({
      success: true,
      count: snippets.length,
      data: snippets,
    });
  })
);

// Get snippets by level
router.get(
  "/snippets/level/:level",
  asyncHandler(async (req, res) => {
    const snippets = await CodeSnippet.find({
      level: req.params.level,
      status: "published",
    }).sort("-publishedAt");

    res.status(200).json({
      success: true,
      count: snippets.length,
      data: snippets,
    });
  })
);

module.exports = router;
