const mongoose = require('mongoose');
const path = require('path');
const express = require('express');
const Chat = require('./models/Chat');
const app = express();
const uri = require('./config/config').MONGO;
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connect: success');
  })
  .catch((err) => {
    console.log('connect: error');
    throw err;
  });
let db = mongoose.connection;

// serve static files from template
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes:
app.use('/api', require('./routes/api.route'));
app.use('/', require('./routes/website.route'));

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});
let arrOnl = [];
let arrRoomOnl = [];
let server = require('http').Server(app);
const io = require('socket.io')(server);
const service = require('./socket_service/service')(io);

io.sockets.on('error', (e) => console.log(e.message));
io.sockets.on('connection', (socket) => {
  service.listen(socket);
});

let port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log(`Server listening on port ${port}`);
});
