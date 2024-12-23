const mongoose = require("mongoose");

const codeBlockSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    trim: true,
  },
});

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    codeBlocks: [codeBlockSchema],

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    featuredImage: {
      url: String,
      alt: String,
    },

    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
snippetSchema.index({ tags: 1 });
snippetSchema.index({ publishedAt: -1 });

// Generate slug before saving
snippetSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  next();
});
const CodeSnippet = mongoose.model("CodeSnippet", snippetSchema);

module.exports = CodeSnippet;
