// C1: khong biet lam:
// Dung cach 2 cho don gian:
const mongoose = require('mongoose');

const SubChatSchema = mongoose.Schema(
  {
    timestamp: String,
    send_user: String,
    chat: String,
    image: String,
    video: String,
    file: String,
    fileType: String,
  },
  {
    _id: false,
    versionKey: false,
  }
);

const ChatGroupSchema = mongoose.Schema(
  {
    chat_name: {
      type: String,
      trim: true,
    },
    users: Array,
    creator: String,
    content: [SubChatSchema],
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('ChatGroup', ChatGroupSchema);
