const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['heading', 'paragraph', 'list', 'code', 'subHeading', 'subHeadingText', 'headingFlex', 'headingFlexText'],
        required: true
    },
    text: String,
    item: String,
    language: String,
    code: String
}, { _id: false });

const lessonSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: String,
    duration: String,
    content: [contentBlockSchema]
});

module.exports = mongoose.model('Lesson', lessonSchema);