const mongoose = require("mongoose");
const postSchema = require("./schema/Post.js");


module.exports = mongoose.model("Post", postSchema);