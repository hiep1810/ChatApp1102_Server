function callService(socket) {
  socket.on('ready', (id) => {
    console.log(socket.id + ' ready');
    console.log('PASS: ', { id: socket.id, username: socket.username });
    socket.to(id).emit('ready', { id: socket.id, username: socket.username });
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

  socket.on('busy', function (id) {
    console.log(socket.id + 'busy');
    socket.to(id).emit('busy');
  });
}

module.exports = function () {
  return { callService };
};
