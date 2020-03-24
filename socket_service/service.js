let _io;

const Chat = require('../models/Chat');
const User = require('../models/User');
const ChatGroup = require('../models/ChatGroup');
const arrOnl = [];

//online

function listen(socket) {
  console.log(socket.id, ' has join server');
  const io = _io;
  const {
    login,
    hello,
    chat,
    getChat,
    setFriendStatus,
    typing
  } = require('./chat_service')(io, arrOnl);

  socket.on('action', async action => {
    switch (action.type) {
      case 'server/hello': {
        await hello(socket, action);
        break;
      }
      case 'server/login': {
        await login(socket, action);
        break;
      }
      case 'server/chat': {
        await chat(socket, action);
        break;
      }
      case 'server/get-chat': {
        await getChat(socket, action);
        break;
      }
      case 'server/set-friend-status': {
        await setFriendStatus(socket, action);
        break;
      }
      case 'server/typing': {
        await typing(socket, action);
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(socket.id, ' has disconnected!');

    //Delete user in online array:
    let index = arrOnl.findIndex(item => item.id === socket.id);
    if (index > -1) {
      arrOnl.splice(index, 1);
    }
    console.log('socket.friends: ', socket.friends);
    //Send disconnect event to other friend:

    //======================================================
    if (socket.friends) {
      //cant read property '0' of undefined: solved
      for (let i = 0; i < socket.friends.length; i++) {
        if (socket.friends[i].status == 'online') {
          io.to(socket.friends[i].id).emit('action', {
            type: 'friends',
            data: {
              username: socket.username,
              status: 'offline',
              id: null
            }
          });
        }
      }
    }
    //======================================================
    //Then from client emit a value to socket id set friend in this list disconnected
  });
}

module.exports = (io, mongoose) => {
  _io = io;
  _mongoose = mongoose;
  return { listen };
};
