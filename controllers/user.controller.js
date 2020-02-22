const User = require('../models/User');

exports.addFriend = async (req, res, next) => {
  if (!req.body.friend_name) {
    return res.status(400).send({
      message: 'friend name missing',
      status: false
    });
  } else {
    try {
      let result = await User.findOneAndUpdate(
        //condition
        { username: { $in: [req.body.username, val.friend_name] } },
        //update:
        { $addToSet: { friends: [req.body.friend_name] } }
      );
      if (!result)
        return res.status(400).send({
          message: 'add friend failed',
          status: false
        });
    } catch (err) {
      return res.status(500).send({
        message: 'internal server error'
      });
    }

    res.status(200).send({
      message: 'add friend successfully',
      status: true
    });
  }
};
exports.removeFriend = async (req, res, next) => {};
exports.updateUser = async (req, res, next) => {};
exports.createRoom = async (req, res, next) => {};
exports.leaveRoom = async (req, res, next) => {};
