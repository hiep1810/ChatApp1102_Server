const Chat = require('../models/Chat');
const User = require('../models/User');
const ChatGroup = require('../models/ChatGroup');
const ObjectId = require('mongoose').Types.ObjectId;
let io;
let arrOnl;
const hello = async (socket, action) => {
  //console.log('Got hello data!', action.data);
  socket.emit('action', { type: 'message', data: 'good day!' });
};
const login = async (socket, action) => {
  console.log('list user online: ', arrOnl);
  let data = action.data;

  //console.log(socket.id, 'on login');
  try {
    let sendback = [];
    //console.log(data.username);
    //console.log(data.user_id);
    socket.username = data.username;
    socket.user_id = data._id;

    //Need to clear before login:
    if (arrOnl.length > 0) {
      arrOnl.reduceRight((_, item, i) => {
        if (item.username === data.username) {
          console.log(
            'username:',
            data.username,
            'duplicated at ',
            i,
            '.Delete...'
          );
          arrOnl.splice(i, 1);
        }
      });
    }

    //Add to online list:
    arrOnl.push({
      id: socket.id,
      username: data.username
    });

    //Find online friends:
    for (let i = 0; i < data.friends.length; i++) {
      let friend;
      let _i = arrOnl.findIndex(e => e.username === data.friends[i].username);
      if (_i > -1) {
        friend = {
          username: arrOnl[_i].username,
          status: 'online',
          id: arrOnl[_i].id
        };

        //Send friend our id:
        console.log(
          data.username,
          ' send data to ',
          arrOnl[_i].username,
          ' with id:',
          arrOnl[_i].id
        );

        //console.log('data.username here:', data.username);

        let temp = {
          username: data.username,
          id: socket.id,
          status: 'online'
        };
        //find that friend and add :
        console.log(
          '--------------list: ',
          io.sockets.connected[arrOnl[_i].id].friends
        );

        const list = io.sockets.connected[arrOnl[_i].id].friends;

        list.forEach((val, index) => {
          if (val.username === data.username) {
            list[index] = temp;
          }
        });
        //send to client that we online:
        io.to(arrOnl[_i].id).emit('action', {
          type: 'friend-id',
          data: temp
        });
      } else {
        friend = {
          username: data.friends[i].username,
          status: 'offline',
          id: null
        };
      }
      sendback.push(friend);
    }

    //Stick username to socket:
    socket.friends = sendback;

    //console.log(data.username, ' list friend: ', socket.friends);

    if (data.rooms) {
      //Join room:
      for (let i = 0; i < data.rooms.length; i++) {
        socket.join(rooms[i]);
      }
    }
    //Sendback:
    socket.emit('action', { type: 'login', data: sendback });
  } catch (err) {
    console.log(err);
  }
};
const typing = async (socket, action) => {
  let data = action.data;

  if (data.socket_id != null) {
    socket
      .to(friend.socket_id)
      .emit('action', { type: 'typing', data: { username: socket.username } });
  } else if (data.room != null) {
    socket
      .to(room)
      .emit('action', { type: 'typing', data: { username: socket.username } });
  }
};

const getChat = async (socket, action) => {
  let data = action.data;
  //console.log(socket.id, ' on get chat');
  try {
    let sendback = {};
    if (data.chatType == 'person') {
      sendback.chatType = 'person';
      const result = await Chat.findOne({ _id: data.chatId });
      if (result != null) {
        sendback = result;
      } else {
        sendback = null;
      }
    } else if (data.chatType == 'group') {
      sendback.chatType = 'group';
      const result = await ChatGroup.fineOne({ _id: data.room_id });
      if (result != null) {
        sendback = result;
      } else {
        sendback = null;
      }
    }
    socket.emit('action', { type: 'get-chat', data: sendback });
  } catch (err) {
    console.log(err);
  }
};

const chat = async (socket, action) => {
  let data = action.data;
  //console.log(socket.id, ' on chat');
  //console.log(data);

  //What do we do here:
  //in val we get chats name or chat group name, if any of it exist send mess
  //to destination we want to send to
  //

  //chat:
  /** chatId
   *  send_user
   *  timestamp
   *  chatType
   *  chat
   *  receiveId
   */

  //1.check if chat room or chat person:
  if (data.chatType == 'person') {
    //2.save chat to database:
    Chat.findOneAndUpdate(
      //condition
      { _id: data.chatId },
      //update:
      {
        $addToSet: {
          content: [
            {
              timestamp: data.timestamp,
              send_user: data.send_user,
              chat: data.chat
            }
          ]
        }
      },
      (err, result) => {
        //console.log('result here');
        if (err) console.log(err);
        else if (result && data.receiveId) {
          //console.log('res:', result);
          socket
            .to(data.receiveId)
            .emit('action', { type: 'chat', data: data });
        }
      }
    );
  } else if (data.chatType == 'group') {
    ChatGroup.findOneAndUpdate(
      //condition:
      {
        _id: data.chatId
      },
      {
        $addToSet: {
          content: [
            {
              timestamp: data.timestamp,
              send_user: data.send_user,
              chat: data.chat
            }
          ]
        }
      },
      (err, result) => {
        if (err) console.log(err);
        else if (result) {
          //console.log('res:', result);
          socket
            .to(data.receiveId)
            .emit('action', { type: 'chat', data: data });
        }
      }
    );
  }
};

const setFriendStatus = async (socket, action) => {
  //So your friend emit 'friend-id' to you and you have to save it and send it to your listfriends online to save it
  let data = action.data;
  for (let i = 0; i < socket.friends.length; i++) {
    if (data.username == socket.friends[i].username) {
      if (data.status == 'offline') {
        socket.friends[i].status = 'offline';
        socket.friends[i].id = null;
      } else if (data.status == 'online') {
        socket.friends[i].status = 'offline';
        socket.friends[i].id = data.id;
      }
      break;
    }
  }
};

module.exports = (_io, _arrOnl) => {
  io = _io;
  arrOnl = _arrOnl;
  return { login, hello, typing, getChat, chat, setFriendStatus };
};
