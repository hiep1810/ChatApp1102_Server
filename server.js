const mongoose = require('mongoose');
const path = require('path');
const express = require('express');

const app = express();
const uri = require('./config/config').MONGO;
mongoose
  .connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('connect: success');
  })
  .catch(err => {
    console.log('connect: error');
    throw err;
  });
let db = mongoose.connection;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes:
app.use('/api', require('./routes/api.route'));

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

let server = require('http').Server(app);
const io = require('socket.io')(server);
const service = require('./socket_service/service')(io);

io.sockets.on('error', e => console.log(e.message));
io.sockets.on('connection', socket => {
  service.listen(socket);
});

let port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log(`Server listening on port ${port}`);
});
