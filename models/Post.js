const mongoose = require('mongoose');

const PostSchema = mongoose.Schema(
  {
    image: String,
    likes: Array,
    content: String,
    timestamp: String,
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('Post', PostSchema);
