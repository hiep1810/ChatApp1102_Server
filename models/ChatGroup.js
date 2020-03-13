// C1: khong biet lam:
// Dung cach 2 cho don gian:
const mongoose = require('mongoose');

const SubChatSchema = mongoose.Schema(
  {
    timestamp: String,
    send_user: String,
    chat: String
  },
  {
    _id: false,
    versionKey: false
  }
);

const ChatGroupSchema = mongoose.Schema(
  {
    chat_name: String,
    users: Array,
    content: [SubChatSchema]
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model('ChatGroup', ChatGroupSchema);
