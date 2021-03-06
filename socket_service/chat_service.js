module.exports = (_io, arrOnl, _arrRoomOnl) => {
  const Chat = require('../models/Chat');
  const User = require('../models/User');
  const ChatGroup = require('../models/ChatGroup');
  const ObjectId = require('mongoose').Types.ObjectId;

  let io = _io;

  const filter = (arr, filter) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!filter(arr[i])) {
        //neu sai thi xoa :
        for (let j = i; j < arr.length - 1; j++) {
          arr[j] = arr[j + 1];
        }
        arr.pop();
      }
    }
  };

  const hello = async (socket, action) => {
    //console.log('Got hello data!', action.data);
    socket.emit('action', { type: 'message', data: 'good day!' });
  };
  const login = async (socket, action) => {
    console.log('list user online: ', arrOnl);
    let data = action.data;
    try {
      let sendback = [];
      socket.username = data.username;
      socket.user_id = data._id;

      //Need to clear before login:

      console.log('Before:', arrOnl);
      //Khong dung filter vi no tao ra arr moi lam mat con tro toi arr phia tren:
      //arrOnl = arrOnl.filter((val) => val.username !== data.username);

      filter(arrOnl, (val) => val.username !== data.username);
      /*
      if (arrOnl.length > 0) {
      arrOnl = arrOnl.reduceRight((_, item, i) => {
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
      },);
      
    }
    */
      console.log('After:', arrOnl);
      //Add to online list:
      arrOnl.push({
        id: socket.id,
        username: data.username,
      });
      console.log('More after:', arrOnl);

      //Find online friends:
      for (let i = 0; i < data.friends.length; i++) {
        let friend;
        let _i = arrOnl.findIndex(
          (e) => e.username === data.friends[i].username
        );
        if (_i > -1) {
          friend = {
            username: arrOnl[_i].username,
            status: 'online',
            id: arrOnl[_i].id,
          };

          //Send friend our id:
          let temp = {
            username: data.username,
            id: socket.id,
            status: 'online',
          };
          //console.log('FRIEND:', io.sockets.connected[arrOnl[_i].id]);
          const list = io.sockets.connected[arrOnl[_i].id].friends; //position of our online friend //their list friend

          list.forEach((val, index) => {
            //find inside their list friend our friend
            if (val.username === data.username) {
              list[index] = temp;
            }
          });

          console.log(
            data.username,
            ' send data ' + temp + 'to ',
            arrOnl[_i].username,
            ' with id:',
            arrOnl[_i].id
          );

          //send to client that we online:
          io.to(arrOnl[_i].id).emit('action', {
            type: 'friends',
            data: temp,
          });
        } else {
          friend = {
            username: data.friends[i].username,
            status: 'offline',
            id: null,
          };
        }
        sendback.push(friend);
      }

      //console.log('sendback:', sendback);
      //Stick username to socket:
      socket.friends = sendback;

      if (data.rooms) {
        //Join room:
        for (let i = 0; i < data.rooms.length; i++) {
          socket.join(rooms[i]);
        }
      }
      //Sendback:
      socket.emit('action', { type: 'friends', data: sendback });
    } catch (err) {
      console.log(err);
    }
  };
  const typing = async (socket, action) => {
    let data = action.data;

    if (data.socket_id != null) {
      socket.to(friend.socket_id).emit('action', {
        type: 'typing',
        data: { username: socket.username },
      });
    } else if (data.room != null) {
      socket.to(room).emit('action', {
        type: 'typing',
        data: { username: socket.username },
      });
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

      socket.emit('action', {
        type: 'get-chat',
        data: { sendback: sendback, send_user: action.data.send_user },
      });
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
     *  image
     *  video
     *  file
     *  fileType
     */

    //1.check if chat room or chat person:
    if (data.chatType == 'person') {
      console.log(data);
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
                chat: data.chat,
                image: data.image,
                video: data.video,
                file: data.file,
                fileType: data.fileType,
              },
            ],
          },
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
          _id: data.chatId,
        },
        {
          $addToSet: {
            content: [
              {
                timestamp: data.timestamp,
                send_user: data.send_user,
                chat: data.chat,
              },
            ],
          },
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
  return { login, hello, typing, getChat, chat, setFriendStatus };
};
