const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const CodeSnippet = require("../../models/CodeSnippet");
const ErrorHandler = require("../../utils/ErrorHandler");
const router = express.Router();

// Get all snippets with filters
router.get(
  "/snippets",
  asyncHandler(async (req, res) => {
    console.log("Snippets", req.query);

    const {
      level,
      tags,
      search,
      status = "published",
      sort = "-publishedAt",
      page = 1,
      limit = 10,
      all = "true",
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

    const snippetsQuery = CodeSnippet.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    if (all !== "true") {
      snippetsQuery.limit(Number(limit));
      snippetsQuery.skip(Number(skip));
    }

    const [snippets, snippetsCount] = await Promise.all([
      snippetsQuery.exec(),
      await CodeSnippet.countDocuments(query),
    ]);
    console.log({ snippets });

    res.status(200).json({
      success: true,
      snippets,
      totalSnippets: snippetsCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(snippetsCount / limit),
    });
  })
);

router.get(
  "/snippets/:id",
  asyncHandler(async (req, res, next) => {
    const id = req.params.id;

    if (!id) {
      return next(new ErrorHandler("Id not found"));
    }
    const snippet = await CodeSnippet.findOne({ _id: id });

    if (!snippet) {
      return next(new ErrorHandler("Snippet not found", 404));
    }

    res.status(200).json({
      success: true,
      snippet,
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
  "/snippets/:id",
  asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    let snippet = await CodeSnippet.findOne({ _id: id });

    if (!snippet) {
      return next(new ErrorHandler("Snippet not found", 404));
    }

    // If status is changing to published, set publishedAt
    if (req.body.status === "published" && snippet.status === "draft") {
      req.body.publishedAt = new Date();
    }

    snippet = await CodeSnippet.findByIdAndUpdate({ _id: id }, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Update Code Snippets Successfully",
    });
  })
);

// Delete snippet
router.delete(
  "/snippets/:id",
  asyncHandler(async (req, res, next) => {
    const snippet = await CodeSnippet.findOne({ _id: req.params.id });

    if (!snippet) {
      return next(new ErrorHandler("Snippet not found", 404));
    }

    await snippet.remove();

    res.status(200).json({
      success: true,
      message: "Delete Code Snippets Succcessfully",
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
