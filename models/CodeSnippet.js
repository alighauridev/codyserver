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
      public_id: String,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
snippetSchema.index({ tags: 1 });
snippetSchema.index({ publishedAt: -1 });

const CodeSnippet = mongoose.model("CodeSnippet", snippetSchema);

module.exports = CodeSnippet;
