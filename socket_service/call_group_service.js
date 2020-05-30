module.exports = () => {
  function callGroupService(socket, io) {
    // * Ready-room-once only use one time when emit from caller to all other
    // receiver.
    // * The ready-room-once will be listened at the entry of the
    // app
    // * When receive the ready-room-once, all other receiver will
    // create new peerCon[username] of the caller
    socket.on('ready-room-once', (room, username) => {
      console.log(socket.id + ' ready-room-once ' + room._id);
      //console.log('ROOM:', io.sockets.clients); //deprecated
      //console.log('ROOM:', io.sockets.adapter.rooms);
      //console.log('ROOOOM:', io);
      //console.log('SOCKET>ROOM:', socket.rooms);
      socket.to(room._id).emit('ready-room-once', username, socket.id, room);
    });

    // * When the receivers go to the callscreen, they emit ready-room
    // to tell other receiver (and caller) that create peerCon[their_username]
    // to ready to call
    socket.on('ready-room', (room, username) => {
      console.log(socket.id, ' ready-room');
      socket.to(room).emit('ready-room', username, socket.id);
    });

    // * When accept call, the receiver will turn into the caller,
    // they emit the is-caller to check whenever the one who receive this
    // message is accept call or not (The one who accept the call will turn
    // into the caller)

    socket.on('is-caller', (roomId, username) => {
      console.log(socket.id, ' is-caller', roomId);
      socket.to(roomId).emit('is-caller', username, socket.id);
    });

    // * When receive is-caller, the users check themself if they are caller,
    // then will emit to all room that they are caller
    socket.on('caller', (id, username) => {
      console.log(socket.id, ' caller');
      socket.to(id).emit('caller', username, socket.id);
    });

    // * After check all current caller, they will emit the offer to all
    // other caller (not the one who is allready connected)
    socket.on('offer-room', (id, username, mess) => {
      console.log(socket.id, ' offer-room: ', id, username);
      socket.to(id).emit('offer-room', socket.id, username, mess);
    });

    socket.on('answer-room', (id, username, mess) => {
      console.log(socket.id, ' answer');
      socket.to(id).emit('answer-room', socket.id, username, mess);
    });

    socket.on('candidate-room', (id, username, mess) => {
      console.log(
        socket.id,
        ' candidate: ',
        id + ' ' + username + ' ' + !!mess
      );
      socket.to(id).emit('candidate-room', username, mess);
    });

    socket.on('end-room', (id, username) => {
      console.log(socket.id, ' end');
      socket.to(id).emit('end-room', username);
    });

    socket.on('busy-room', (id) => {
      socket.to(id).emit('busy-room', socket.username);
    });
  }
  return { callGroupService };
};
