const mongoose = require("mongoose");

const { Schema } = mongoose;

const postSchema = new Schema({
  post_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  author: {
    type: String,
    required: true,
  },
  parent_id: {
    type: String,
    required: false,
},
  link: String,
  upvotes: Number,
  downvotes: Number,
  created_utc: Number,
  created_utc_date: Date,
  submission_type: {
    type: String,
    enum: ["submission", "comment"],
  }
});

module.exports = postSchema;
