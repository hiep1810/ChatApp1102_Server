const User = require('../models/User');
const Chat = require('../models/Chat');
const objectid = require('mongoose').Types.ObjectId;
//The objectid is indexed and save in ram so it will really fast to access it

exports.getAllFriend = async (req, res, next) => {
  if (!req.body.id) {
    return res.status(400).send({
      message: 'id required',
      status: false
    });
  } else {
    let result = await User.findOne({ username: req.body.id });
    if (!result) {
      return res.status(404).send({
        message: 'user not found',
        status: false
      });
    } else {
      return res.status(200).send({
        message: result,
        status: true
      });
    }
  }
};

exports.addFriend = async (req, res, next) => {
  if (!req.body.friend_name) {
    return res.status(400).send({
      message: 'friend name required',
      status: false
    });
  } else if (!req.body.id) {
    return res.status(400).send({
      message: 'user id required',
      status: false
    });
  } else if (!req.body.username) {
    return res.status(400).send({
      message: 'useername required',
      status: false
    });
  } else {
    try {
      let chat = new Chat({
        content: []
      });

      Chat.create(chat, async (err, _chat) => {
        if (err) {
          res.status(500).send({
            mess: 'internal server error',
            status: false
          });
          throw new Error(err);
        } else if (!_chat) {
          res.status(401).send({
            mess: `can not insert chats`,
            status: false
          });
        } else {
          let arrResult = await Promise.all([
            User.findOneAndUpdate(
              //condition
              { _id: new ObjectId(req.body.id) },
              //update:
              {
                $addToSet: { friends: [req.body.friend_name] },
                $addToSet: { chats: [{ [req.body.friend_name]: _chat._id }] }
              }
            ),
            User.findOneAndUpdate(
              //condition:
              { username: req.body.friend_name },
              //update:
              {
                $addToSet: { friends: [req.body.username] },
                $addToSet: { chats: [{ [req.body.friend_name]: _chat._id }] }
              }
            )
          ]);
          /*
            let result = await User.findOneAndUpdate(
              //condition
              { _id : req.body.id  },
              //update:
              { $addToSet: { friends: [req.body.friend_name] } }
            );
            let result2 = await User.findOneAndUpdate(
              //condition:
              { username : req.body.friend_name}
              //update:
              {$addToSet : {friends: [req.body.username]}}
              );
              */
          console.log(arrResult);
          if (!arrResult) {
            return res.status(400).send({
              message: 'add friend failed',
              status: false
            });
          }

          return res.status(200).send({
            message: 'add friend successfully',
            status: true
          });
        }
      });
    } catch (err) {
      return res.status(500).send({
        message: 'internal server error',
        status: false
      });
    }
  }
};

exports.removeFriend = async (req, res, next) => {
  if (!req.body.friend_name) {
    return res.status(400).send({
      message: 'friend name required',
      status: false
    });
  } else if (!req.body.id) {
    return res.status(400).send({
      message: 'user id required',
      status: false
    });
  } else if (!req.body.username) {
    return res.status(400).send({
      message: 'useername required',
      status: false
    });
  } else {
    try {
      let arrResult = await Promise.all([
        User.updateOne(
          //condition:
          { _id: new ObjectId(req.body.id) },
          //update:
          { $pull: { friends: req.body.friend_name } }
        ),
        User.updateOne(
          //condition:
          { username: req.body.friend_name },
          //update:
          { $pull: { friends: req.body.username } }
        )
      ]);

      if (!arrResult) {
        return res.status(400).send({
          message: 'remove friend failed',
          status: false
        });
      }

      return res.status(200).send({
        message: 'remove friend successfully',
        status: true
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: 'internal server error'
      });
    }
  }
};

exports.updateUserPassword = async (req, res, next) => {
  if (!req.body.id) {
    return res.status(400).send({
      message: 'id required',
      status: false
    });
  } else if (!req.body.password) {
    return res.status(400).send({
      message: 'password required',
      status: false
    });
  } else {
    try {
      let result = await User.updateOne(
        //condition:
        { _id: new ObjectId(req.body.id) },
        //update:
        { password: req.body.password }
      );
      if (!result) {
        return res.status(400).send({
          message: 'update failed',
          status: false
        });
      } else {
        return res.status(200).send({
          message: 'update successfully',
          status: true
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: 'internal server error'
      });
    }
  }
};

exports.createRoom = async (req, res, next) => {};
exports.leaveRoom = async (req, res, next) => {};
