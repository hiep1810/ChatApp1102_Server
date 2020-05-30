module.exports = (io) => {
  const arrOnl = [];
  const arrRoomOnl = [];

  const callService = require('./call_service');

  //online
  const {
    login,
    hello,
    chat,
    getChat,
    setFriendStatus,
    typing,
  } = require('./chat_service')(io, arrOnl, arrRoomOnl);
  const {
    getGroupChat,
    groupChat,
    getGroupInfo,
  } = require('./chatgroup_service')(io, arrRoomOnl);

  function listen(socket) {
    console.log(socket.id, ' has join server');
    /*
    callService(socket);
    */

    const { callGroupService } = require('./call_group_service')();
    callGroupService(socket, io);

    socket.on('ready-once', (id, userType) => {
      console.log(socket.id + ' ready-once');
      console.log('PASS: ', { id: socket.id, username: socket.username });
      socket
        .to(id)
        .emit(
          'ready-once',
          { id: socket.id, username: socket.username },
          userType
        );
    });

    socket.on('ready', (id, userType) => {
      console.log(socket.id + ' ready?????????');
      console.log('PASS: ', { id: socket.id, username: socket.username });
      socket
        .to(id)
        .emit('ready', { id: socket.id, username: socket.username }, userType);
    });

    socket.on('call', function (id, mess) {
      console.log(socket.id + ' call');
      socket.to(id).emit('call', mess);
    });
    socket.on('offer', function (id, mess) {
      console.log(socket.id + ' offer');
      socket.to(id).emit('offer', mess);
    });

    socket.on('answer', function (id, mess) {
      console.log(socket.id + ' answer');
      socket.to(id).emit('answer', mess);
    });

    socket.on('candidate', function (id, mess) {
      console.log(socket.id + ' candidate');
      socket.to(id).emit('candidate', mess);
    });

    socket.on('end', function (id) {
      console.log(socket.id + 'end');
      socket.to(id).emit('end', id);
    });
    socket.on('get-online', (data) => {
      console.log('get-online:', data);
    });
    socket.on('busy', function (id) {
      console.log(socket.id + 'busy');
      socket.to(id).emit('busy');
    });
    socket.on('action', async (action) => {
      switch (action.type) {
        case 'server/hello': {
          await hello(socket, action);
          break;
        }
        case 'server/login': {
          await login(socket, action);
          console.log('arrOnl outside:', arrOnl);
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
        case 'server/get-group-chat': {
          await getGroupChat(socket, action);
          break;
        }
        case 'server/group-chat': {
          await groupChat(socket, action);
          break;
        }
        case 'server/get-group-info': {
          await getGroupInfo(socket, action);
          break;
        }
        case 'server/log-out': {
          console.log(socket.id, ' has log out');
          let index = arrOnl.findIndex((user) => user.id === socket.id);
          if (index > -1) {
            arrOnl.findIndex.splice(index, 1);
          }
          if (socket.friends)
            for (let friend of socket.friends) {
              friend.id == 'online' &&
                io.to(friend.id).emit('action', {
                  type: 'friends',
                  data: {
                    username: socket.username,
                    status: 'offline',
                    id: null,
                  },
                });
            }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(socket.id, ' has disconnected!');
      console.log('room:', socket.rooms);
      //Delete user in online array:

      console.log('before:', arrOnl);

      let index = arrOnl.findIndex((item) => item.id === socket.id);
      if (index > -1) {
        arrOnl.splice(index, 1);
      }

      console.log('after:', arrOnl);
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
                id: null,
              },
            });
          }
        }
      }
      //======================================================
      //Then from client emit a value to socket id set friend in this list disconnected
    });
  }

  return { listen };
};
