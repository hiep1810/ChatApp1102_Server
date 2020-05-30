const User = require('../models/User');
const Chat = require('../models/Chat');
const Post = require('../models/Post');
const ChatGroup = require('../models/ChatGroup');
const objectid = require('mongoose').Types.ObjectId;
//The objectid is indexed and save in ram so it will really fast to access it

exports.getUsers = async (req, res, next) => {
  if (isNaN(req.body.page) || typeof req.body.page !== 'number')
    return res.status(400).send({
      mess: 'Page not found or not a number',
      status: false,
    });
  else if (
    typeof req.body.search_user == 'undefined' ||
    typeof req.body.search_user !== 'string'
  ) {
    return res.status(400).send({
      mess: 'search_user not found or not a string',
      status: false,
    });
  }

  //console.log('req.body:', req.body);
  let result = await User.find({
    $and: [
      { username: { $regex: req.body.search_user, $options: 'i' } },
      { username: { $nin: [...req.body.except_user] } },
    ],
  })
    .limit(5)
    .skip(5 * req.body.page);

  if (result) {
    const _result = result.map((val) => {
      return {
        _id: val._id,
        username: val.username,
        friends: val.friends,
      };
    });

    return res.status(200).send({
      mess: 'get user successfully',
      users: _result,
      status: true,
    });
  } else {
    return res.status(500).send({
      message: 'internal server error',
    });
  }
};

exports.getUserInfoFromFRS = async (req, res, next) => {
  if (!req.body.search_user_id_array) {
    return res.status(400).send({
      message: 'search_user_id_array required',
      status: false,
    });
  } else if (!(req.body.search_user_id_array instanceof Array)) {
    return res.status(400).send({
      message: 'search_user_id_array not an array',
      status: false,
    });
  } else {
    //console.log('instanceof:', req.body.search_user_id_array instanceof Array);
    const result = await User.find({
      _id: { $in: [...req.body.search_user_id_array] },
    });
    if (result) {
      return res.status(200).send({
        message: 'success',
        status: true,
        result: result,
      });
    } else {
      return res.status(500).send({
        message: 'internal server error',
        status: false,
      });
    }
  }
};

exports.getAllFriend = async (req, res, next) => {
  if (!req.body.id) {
    return res.status(400).send({
      message: 'id required',
      status: false,
    });
  } else {
    let result = await User.findOne({ username: req.body.id });
    if (!result) {
      return res.status(404).send({
        message: 'user not found',
        status: false,
      });
    } else {
      return res.status(200).send({
        message: result,
        status: true,
      });
    }
  }
};

/**
 * -----------------
 * send_user_id
 * remove_id
 * -----------------
 */
exports.removeAddFriend = async (req, res, next) => {
  if (!req.body.send_user_id) {
    return res.status(400).send({
      message: 'send_user_id required',
      status: false,
    });
  } else if (!req.body.remove_id) {
    return res.status(400).send({
      message: 'remove_id required',
      status: false,
    });
  } else {
    const arrResult = await Promise.all([
      User.updateOne(
        {
          _id: req.body.send_user_id,
        },
        {
          $pull: {
            friendRequestsSended: { receive_id: req.body.remove_id },
          },
        }
      ),
      User.updateOne(
        {
          _id: req.body.remove_id,
        },
        {
          $pull: {
            friendRequests: { send_id: req.body.send_user_id },
          },
        }
      ),
    ]);
    if (arrResult) {
      return res.status(200).send({
        mess: 'remove successfully',
        status: true,
        res: arrResult,
      });
    }
    return res.status(500).send({
      mess: 'internal server error',
      status: false,
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
      status: false,
    });
  } else if (!req.body.receive_user) {
    return res.status(400).send({
      message: 'receive_user required',
      status: false,
    });
  } else if (!req.body.receive_id) {
    return res.status(400).send({
      message: 'receive_id required',
      status: false,
    });
  } else if (!req.body.send_user) {
    return res.status(400).send({
      message: 'send_user required',
      status: false,
    });
  } else {
    try {
      let arrResult = await Promise.all([
        User.updateOne(
          //condition:
          {
            _id: req.body.receive_id,
            'friendRequests.send_id': {
              $ne: req.body.send_id,
            },
          },

          //update:
          {
            $push: {
              friendRequests: {
                send_id: req.body.send_id,
                send_user: req.body.send_user,
                mess: !req.body.mess ? 'Kết bạn nha!!!' : req.body.mess,
              },
            },
          }
        ),
        User.updateOne(
          //condition:
          {
            _id: req.body.send_id,
            'friendRequestsSended.receive_id': {
              $ne: req.body.receive_id,
            },
          },
          //update:
          {
            $push: {
              friendRequestsSended: {
                receive_id: req.body.receive_id,
                receive_user: req.body.receive_user,
                mess: !req.body.mess ? 'Kết bạn nha!!!' : req.body.mess,
              },
            },
          }
        ),
      ]);
      console.log('arrResult:');
      console.log(arrResult);
      if (arrResult) {
        return res.status(200).send({
          message: 'Add friend successfully',
          status: true,
        });
      }
      return res.status(500).send({
        message: 'internal server error',
      });
    } catch (err) {
      return res.status(500).send({
        message: 'internal server error',
      });
    }
  }
};

/**
 * API removeAddFriendByUsername:
 * -------------------------------
 * - send_user_id: id of user who send friend request.
 * - send_user:    username of user who send friend request
 * - friend_name:  the username of user who receive friend request
 * --------------------------------
 */
exports.removeAddFriendByUsername = async (req, res, next) => {
  console.log(req.body);
  if (!req.body.send_user_id) {
    return res.status(400).send({
      message: 'send_user_id required',
      status: false,
    });
  } else if (!req.body.friend_name) {
    return res.status(400).send({
      message: 'send_name required',
      status: false,
    });
  } else if (!req.body.send_user) {
    return res.status(400).send({
      message: 'send_user required',
      status: false,
    });
  } else {
    const arrRes = await Promise.all([
      User.updateOne(
        { _id: req.body.send_user_id },
        {
          $pull: {
            friendRequestsSended: { receive_user: req.body.friend_name },
          },
        }
      ),
      User.updateOne(
        {
          username: req.body.friend_name,
        },
        {
          $pull: {
            friendRequests: { send_user: req.body.send_user },
          },
        }
      ),
    ]);
    if (arrRes) {
      return res.status(200).send({
        message: '',
        status: true,
        result: arrRes,
      });
    }
  }
};

exports.removeFriend = async (req, res, next) => {
  if (!req.body.friend_name) {
    return res.status(400).send({
      message: 'friend name required',
      status: false,
    });
  } else if (!req.body.id) {
    return res.status(400).send({
      message: 'user id required',
      status: false,
    });
  } else if (!req.body.username) {
    return res.status(400).send({
      message: 'username required',
      status: false,
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
        ),
      ]);

      if (!arrResult) {
        return res.status(400).send({
          message: 'remove friend failed',
          status: false,
        });
      }

      return res.status(200).send({
        message: 'remove friend successfully',
        status: true,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: 'internal server error',
      });
    }
  }
};

exports.updateUserPassword = async (req, res, next) => {
  if (!req.body.id) {
    return res.status(400).send({
      message: 'id required',
      status: false,
    });
  } else if (!req.body.password) {
    return res.status(400).send({
      message: 'password required',
      status: false,
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
          status: false,
        });
      } else {
        return res.status(200).send({
          message: 'update successfully',
          status: true,
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: 'internal server error',
      });
    }
  }
};

exports.userFriendRequestsSended = async (req, res, next) => {
  if (!req.body.user_id) {
    return res.status(400).send({
      message: 'user_id not found',
      status: false,
    });
  } else {
    User.aggregate([
      {
        $match: {
          _id: new objectid(req.body.user_id),
        },
      },
      {
        $addFields: {
          friendRequestsSended: {
            $map: {
              input: '$friendRequestsSended',
              as: 'row',
              in: {
                receive_id: {
                  $toObjectId: '$$row.receive_id',
                },
                receive_user: '$$row.receive_user',
                mess: '$$row.mess',
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friendRequestsSended.receive_id',
          foreignField: '_id',
          as: 'friendArray',
        },
      },
      {
        $project: {
          friends: 1,
          friendRequestsSended: 1,
          friendArray: 1,
        },
      },
    ]).exec((err, result) => {
      if (err)
        return res.status(500).send({
          message: 'internal server error',
          status: false,
        });

      if (result) {
        const friendRqSend = result[0].friendRequestsSended;
        const friendArr = result[0].friendArray;
        //console.log(friendArr);
        if (friendRqSend === null || friendArr === null) {
          return res.status(200).send({
            mess: 'get friendRequestsSended successfully',
            friendRequestsSended: [],
          });
        } else {
          let value = [];
          for (let i = 0; i < friendRqSend.length; i++) {
            for (let j = 0; j < friendArr.length; j++) {
              if (
                friendRqSend[i].receive_id.toString() ===
                friendArr[j]._id.toString()
              ) {
                //console.log('push');
                value.push({
                  receive_id: friendRqSend[i].receive_id,
                  receive_user: friendRqSend[i].receive_user,
                  mess: friendRqSend[i].mess,
                  friends: friendArr[j].friends,
                });
              }
            }
          }

          return res.status(200).send({
            mess: 'get friendRequestsSended successfully',
            friendRequestsSended: value,
          });
        }
      } else {
        return res.status(500).send({
          message: 'internal server error',
          status: false,
        });
      }
    });
  }
};

exports.createRoom = async (req, res, next) => {
  //console.log('CREATEROOM:', req.body);
  if (!req.body.chat_name) {
    return res.status(400).send({
      mess: 'chat_name not found',
      status: false,
    });
  } else if (!req.body.users) {
    return res.status(400).send({
      mess: 'users not found',
      status: false,
    });
  } else if (!req.body.creator) {
    return res.status(400).send({
      mess: 'creator not found',
      status: false,
    });
  } else {
    let chatGroup = {
      chat_name: req.body.chat_name,
      users: req.body.users,
      creator: req.body.creator,
      content: [],
    };

    ChatGroup.create(chatGroup, (err, _chatGroup) => {
      try {
        if (err) {
          if (err.code === 11000) {
            var field = err.message;
            field = field.split(' dup key')[0].trim();
            field = field.substring(
              field.length - 2,
              field.lastIndexOf(' ') + 1
            );
            return res.status(403).send({
              message: 'a room with this ' + field + ' already exists',
              status: false,
            });
          }

          res.status(500).send({
            mess: 'internal server error',
            status: false,
          });
        } else if (!chatGroup) {
          res.status(403).send({
            mess: `can not insert chatGroup`,
            status: false,
          });
        } else {
          /*
          res.status(200).send({
            mess: `create chatGroup successfully`,
            status: true,
            chatGroup: _chatGroup,
          });
          */
          User.updateMany(
            { username: { $in: _chatGroup.users } },
            { $push: { rooms: _chatGroup._id } },
            (err, raw) => {
              if (err)
                res.status(500).send({
                  mess: 'Internal server error',
                  status: false,
                  err,
                });
              else {
                return res.status(200).send({
                  mess: 'create new room successfully',
                  status: true,
                  raw,
                });
              }
            }
          );
        }
      } catch (err) {
        console.log(err);
      }
    });
  }
};

exports.removeRoom = async (req, res, next) => {};

exports.updateUserInfo = async (req, res, next) => {
  if (!req.body.id) {
    return res.status(403).send({
      mess: 'id not found',
      status: false,
    });
  }
  let userInfo = {};
  if (req.body.fullname != null) userInfo.fullname = req.body.fullname;
  if (req.body.avatar != null) userInfo.avatar = req.body.avatar;
  if (req.body.bio != null) userInfo.bio = req.body.bio;
  if (req.body.phone != null) userInfo.phone = req.body.phone;

  User.updateOne(
    {
      _id: req.body.id,
    },
    {
      $set: userInfo,
    }
  )
    .then((result) => {
      return res.status(200).send({
        mess: 'update successfully',
        status: true,
        result,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({
        mess: 'server error',
        status: false,
      });
    });
};

exports.friendRequests = (req, res, next) => {
  if (!req.body.user_id) {
    return res.status(400).send({
      message: 'user_id not found',
      status: false,
    });
  } else {
    User.aggregate([
      {
        $match: {
          _id: new objectid(req.body.user_id),
        },
      },
      {
        $addFields: {
          friendRequests: {
            $map: {
              input: '$friendRequests',
              as: 'row',
              in: {
                send_id: {
                  $toObjectId: '$$row.send_id',
                },
                send_user: '$$row.send_user',
                mess: '$$row.mess',
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friendRequests.send_id',
          foreignField: '_id',
          as: 'friendArray',
        },
      },
      {
        $project: {
          friends: 1,
          friendRequests: 1,
          friendArray: 1,
        },
      },
    ]).exec((err, result) => {
      console.log(result);
      if (err)
        return res.status(500).send({
          message: 'internal server error',
          status: false,
        });

      if (result) {
        const friendRq = result[0].friendRequests;
        const friendArr = result[0].friendArray;

        console.log();
        //console.log(friendArr);
        if (friendRq === null || friendArr === null) {
          return res.status(200).send({
            mess: 'get friendRequests successfully',
            friendRequests: [],
          });
        } else {
          let value = [];
          for (let i = 0; i < friendRq.length; i++) {
            for (let j = 0; j < friendArr.length; j++) {
              if (
                friendRq[i].send_id.toString() === friendArr[j]._id.toString()
              ) {
                //console.log('push');
                value.push({
                  send_id: friendRq[i].send_id,
                  send_user: friendRq[i].send_user,
                  mess: friendRq[i].mess,
                  friends: friendArr[j].friends,
                });
              }
            }
          }

          return res.status(200).send({
            mess: 'get friendRequestsSended successfully',
            status: true,
            friendRequests: value,
          });
        }
      } else {
        return res.status(500).send({
          message: 'internal server error',
          status: false,
        });
      }
    });
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    console.log(req.body);
    if (!req.body.friend_id) {
      return res.status(400).send({
        mess: 'friend_id not found',
        status: false,
      });
    } else if (!req.body.user_id) {
      return res.status(400).send({
        mess: 'user_id not found',
        status: false,
      });
    } else if (!req.body.friend_username) {
      return res.status(400).send({
        mess: 'friend_username not found',
        status: false,
      });
    } else if (!req.body.username) {
      return res.status(400).send({
        mess: 'username not found',
        status: false,
      });
    } else {
      const result = await Chat.create({
        content: [],
      });
      /*
      result: {_id, content}
      */
      if (result) {
        const arrRes = await Promise.all([
          User.updateOne(
            { _id: req.body.friend_id },
            {
              $pull: {
                friendRequestsSended: {
                  receive_id: req.body.user_id.toString(),
                },
              },
              $push: {
                chats: {
                  [req.body.username]: result._id.toString(),
                },
                friends: req.body.username,
              },
            }
          ),
          User.updateOne(
            {
              _id: req.body.user_id,
            },
            {
              $pull: {
                friendRequests: { send_id: req.body.friend_id.toString() },
              },
              $push: {
                chats: {
                  [req.body.friend_username]: result._id.toString(),
                },
                friends: req.body.friend_username,
              },
            }
          ),
        ]);

        if (arrRes) {
          return res.status(200).send({
            mess: 'accept friend request successfully',
            status: true,
            chat_id: result,
            result: arrRes,
          });
        } else {
          return res.status(500).send({
            mess: 'something wrong',
            status: false,
            result: arrRes,
          });
        }
      }
    }
  } catch (err) {
    return res.status(500).send({
      mess: 'something wrong',
      status: false,
      result: err,
    });
  }
};

exports.declineFriendRequest = async (req, res, next) => {
  try {
    if (!req.body.friend_id) {
      return res.status(400).send({
        mess: 'friend_id not found',
        status: false,
      });
    } else if (!req.body.user_id) {
      return res.status(400).send({
        mess: 'user_id not found',
        status: false,
      });
    } else {
      const arrRes = Promise.all([
        User.updateOne(
          { _id: req.body.friend_id },
          {
            $pull: {
              friendRequestsSended: { receive_id: req.body.user_id },
            },
          }
        ),
        User.updateOne(
          { _id: req.body.user_id },
          {
            $pull: {
              friendRequests: { send_id: req.body.friend_id },
            },
          }
        ),
      ]);

      if (arrRes) {
        return res.status(200).send({
          mess: 'decline friend request successfully',
          status: true,
          result: arrRes,
        });
      } else {
        return res.status(500).send({
          mess: 'something wrong',
          status: false,
          result: arrRes,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({
      mess: 'something wrong',
      status: false,
      result: err,
    });
  }
};

exports.leaveRoom = async (req, res, next) => {
  if (!req.body.room_id) {
    return res.status(400).send({
      mess: 'room_id not found',
      status: false,
    });
  }
  if (!req.body.username) {
    return res.status(400).send({
      mess: 'username not found',
      status: false,
    });
  } else {
    try {
      await ChatGroup.update(
        //Condition:
        {
          _id: req.body.room_id,
        },
        {
          $pull: {
            users: req.body.username,
          },
        }
      );

      await User.update(
        {
          username: req.body.username,
        },
        {
          //chi co _id no moi tu dong parse sang objectid con lai thi khong
          $pull: {
            rooms: new objectid(req.body.room_id),
          },
        }
      );

      return res.status(200).send({
        mess: 'Leave room successfully',
        status: true,
      });
    } catch (err) {
      return res.status(500).send({
        mess: 'internal error',
        err,
      });
    }
  }
};
exports.updateRoom = async (req, res, next) => {};
//Create new post:
exports.createPost = async (req, res, next) => {
  if (!req.body.username) {
    res.status(400).send({
      mess: 'username not found',
      status: false,
    });
  } else if (!req.body.content) {
    res.status(400).send({
      mess: 'content not found',
      status: false,
    });
  } else if (!req.body.timestamp) {
    res.status(400).send({
      mess: 'timestamp not found',
      status: false,
    });
  } else {
    Post.create(
      {
        image: req.body.image,
        like: [],
        content: req.body.content,
        timestamp: req.body.timestamp,
      },
      (err, post) => {
        if (err) {
          if (err.code === 11000) {
            var field = err.message;
            field = field.split(' dup key')[0].trim();
            field = field.substring(
              field.length - 2,
              field.lastIndexOf(' ') + 1
            );
            return res.status(403).send({
              message: 'a room with this ' + field + ' already exists',
              status: false,
            });
          }

          res.status(500).send({
            mess: 'internal server error',
            status: false,
          });
        } else if (!post) {
          res.status(403).send({
            mess: `can not insert chatGroup`,
            status: false,
          });
        } else {
          /*
          res.status(200).send({
            mess: `create chatGroup successfully`,
            status: true,
            chatGroup: _chatGroup,
          });
          */
          User.update(
            //Condition:
            { username: req.body.username },

            {
              $push: {
                posts: post._id.toString(),
              },
            },
            (err, raw) => {
              if (err)
                res.status(500).send({
                  mess: 'Internal server error',
                  status: false,
                  err,
                });
              else {
                return res.status(200).send({
                  mess: 'create new post successfully',
                  status: true,
                  post: post,
                });
              }
            }
          );
        }
      }
    );
  }
};
//Get post:
exports.getPosts = async (req, res, next) => {
  if (!req.body.posts) {
    return res.status(400).send({
      mess: 'posts not found',
      status: false,
    });
  } else {
    Post.find(
      {
        _id: {
          $in: [...req.body.posts],
        },
      },
      function (err, posts) {
        if (err)
          return res.status(500).send({
            mess: 'internal error',
            status: false,
            err: err,
          });

        return res.status(200).send({
          mess: 'get posts successfully',
          status: true,
          posts,
        });
      }
    );
  }
};

exports.getPostsByUsername = async (req, res, next) => {
  if (!req.body.username) {
    return res.status(400).send({
      mess: 'username not found',
      status: false,
    });
  } else {
    try {
      const user = await User.findOne({ username: req.body.username });
      const posts = await Post.find({
        _id: {
          $in: [...user.posts],
        },
      });

      return res.status(200).send({
        mess: 'get posts successfully',
        status: true,
        posts,
      });
    } catch (err) {
      return res.status(500).send({
        mess: 'internal error',
        status: false,
      });
    }
  }
};

//Modify post:
exports.updatePost = async (req, res, next) => {
  if (!req.body.postId) {
  } else {
    Post.updateOne(
      { _id: req.body.postId },
      { ...req.body.updateValue },
      (err, raw) => {
        if (err)
          return res.status(500).send({
            mess: 'internal server error',
            status: false,
          });
        else {
          return res.status(200).send({
            mess: 'update successfully',
            status: true,
            raw: raw,
          });
        }
      }
    );
  }
};
//Delete post:
exports.deletePost = async (req, res, next) => {
  if (!req.body.postId) {
    return res.status(400).send({
      mess: 'postId not found',
      status: false,
    });
  } else {
    Post.deleteOne(
      {
        _id: req.body.postId,
      },
      (err) => {
        if (err)
          return res.status(200).send({
            mess: 'cannot delete',
            status: false,
          });
        else {
          return res.status(200).send({
            mess: 'delete successfully',
            status: true,
          });
        }
      }
    );
  }
};

exports.getUserInfoWithPosts = async (req, res, next) => {
  if (!req.body.username) {
    return res.status(400).send({
      mess: 'username not found',
      status: false,
    });
  } else {
    try {
      let user = await User.findOne({ username: req.body.username });
      let posts = await Post.find({
        _id: {
          $in: [...user.posts],
        },
      });
      //console.log(user);
      //console.log(posts);
      /*
      console.log(
        user.posts.map((val, index) => {
          for (let i = 0; i < posts.length; i++) {
            if (val === posts[i]._id.toString()) {
              return posts[i];
            }
          }
        })
      );
      */

      user.posts = user.posts.map((val, index) => {
        for (let i = 0; i < posts.length; i++) {
          if (val === posts[i]._id.toString()) {
            return posts[i];
          }
        }
      });

      return res.status(200).send({
        mess: 'get userInfo successfully',
        status: true,
        user,
      });
    } catch (err) {
      return res.status(500).send({
        mess: 'internal error',
        err: err.message,
        status: false,
      });
    }
  }
};

exports.likePost = async (req, res, next) => {
  console.log('LIKE POST');
  if (!req.body.username) {
    return res.status(400).send({
      mess: 'username not found',
      status: false,
    });
  } else if (!req.body.postId) {
    return res.status(400).send({
      mess: 'postId not found',
      status: false,
    });
  } else {
    Post.update(
      { _id: req.body.postId },
      {
        $addToSet: { likes: req.body.username },
      },
      (err, raw) => {
        if (err)
          return res
            .status(500)
            .send({ mess: 'internal error', err: err.message });
        return res.status(200).send({
          mess: 'like successfully',
          status: true,
          raw,
        });
      }
    );
  }
};

exports.unLikePost = async (req, res, next) => {
  console.log('UNLIKE POST');
  if (!req.body.username) {
    return res.status(400).send({
      mess: 'username not found',
      status: false,
    });
  } else if (!req.body.postId) {
    return res.status(400).send({
      mess: 'postId not found',
      status: false,
    });
  } else {
    Post.updateOne(
      { _id: req.body.postId },
      { $pull: { likes: req.body.username } },
      (err, raw) => {
        if (err)
          return res
            .status(500)
            .send({ mess: 'internal error', err: err.message });
        return res.status(200).send({
          mess: 'unlike successfully',
          status: true,
          raw,
        });
      }
    );
  }
};
