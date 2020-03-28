const User = require('../models/User');
const Chat = require('../models/Chat');
const objectid = require('mongoose').Types.ObjectId;
//The objectid is indexed and save in ram so it will really fast to access it

exports.getUsers = async (req, res, next) => {
  if (isNaN(req.body.page) || typeof req.body.page !== 'number')
    return res.status(400).send({
      mess: 'Page not found or not a number',
      status: false
    });
  else if (
    typeof req.body.search_user == 'undefined' ||
    typeof req.body.search_user !== 'string'
  ) {
    return res.status(400).send({
      mess: 'search_user not found or not a string',
      status: false
    });
  }

  //console.log('req.body:', req.body);
  let result = await User.find({
    $and: [
      { username: { $regex: req.body.search_user, $options: 'i' } },
      { username: { $nin: [...req.body.except_user] } }
    ]
  })
    .limit(5)
    .skip(5 * req.body.page);

  if (result) {
    const _result = result.map(val => {
      return {
        _id: val._id,
        username: val.username,
        friends: val.friends
      };
    });

    return res.status(200).send({
      mess: 'get user successfully',
      users: _result,
      status: true
    });
  } else {
    return res.status(500).send({
      message: 'internal server error'
    });
  }
};

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

/**
 * send_user_id
 * remove_id
 */
exports.removeAddFriend = async (req, res, next) => {
  if (!req.body.send_user_id) {
    return res.status(400).send({
      message: 'send_user_id required',
      status: false
    });
  } else if (!req.body.remove_id) {
    return res.status(400).send({
      message: 'remove_id required',
      status: false
    });
  } else {
    const arrResult = await Promise.all([
      User.updateOne(
        {
          _id: req.body.send_user_id
        },
        {
          $pull: {
            friendRequestsSended: { receive_id: req.body.remove_id }
          }
        }
      ),
      User.updateOne(
        {
          _id: req.body.remove_id
        },
        {
          $pull: {
            friendRequests: { send_id: req.body.send_user_id }
          }
        }
      )
    ]);
    if (arrResult) {
      return res.status(200).send({
        mess: 'remove successfully',
        res: arrResult
      });
    }
    return res.status(500).send({
      mess: 'internal server error'
    });
  }
};

/**
 * API addFriend:
 * ------------------
 * - send_id
 * - send_user
 * - receive_id
 * - receive_user
 * - mess (optional)
 * -------------------
 */
exports.addFriend = async (req, res, next) => {
  if (!req.body.send_id) {
    return res.status(400).send({
      message: 'send_id required',
      status: false
    });
  } else if (!req.body.receive_user) {
    return res.status(400).send({
      message: 'receive_user required',
      status: false
    });
  } else if (!req.body.receive_id) {
    return res.status(400).send({
      message: 'receive_id required',
      status: false
    });
  } else if (!req.body.send_user) {
    return res.status(400).send({
      message: 'send_user required',
      status: false
    });
  } else {
    try {
      let arrResult = await Promise.all([
        User.updateOne(
          //condition:
          {
            _id: req.body.receive_id,
            'friendRequests.send_id': {
              $ne: req.body.send_id
            }
          },

          //update:
          {
            $push: {
              friendRequests: {
                send_id: req.body.send_id,
                send_user: req.body.send_user,
                mess: !req.body.mess ? 'Kết bạn nha!!!' : req.body.mess
              }
            }
          }
        ),
        User.updateOne(
          //condition:
          {
            _id: req.body.send_id,
            'friendRequestsSended.receive_id': {
              $ne: req.body.receive_id
            }
          },
          //update:
          {
            $push: {
              friendRequestsSended: {
                receive_id: req.body.receive_id,
                receive_user: req.body.receive_user,
                mess: !req.body.mess ? 'Kết bạn nha!!!' : req.body.mess
              }
            }
          }
        )
      ]);
      console.log('arrResult:');
      console.log(arrResult);
      if (arrResult) {
        return res.status(200).send({
          message: 'Add friend successfully',
          status: true
        });
      }
      return res.status(500).send({
        message: 'internal server error'
      });
    } catch (err) {
      return res.status(500).send({
        message: 'internal server error'
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
