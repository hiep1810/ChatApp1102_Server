let _io;

const Chat = require('../models/Chat');
const User = require('../models/User');
const ChatGroup = require('../models/ChatGroup');

//online
const arrOnl = [];

function listen(socket) {
  const io = _io;

  socket.on('login', async id => {
    try {
      //Find :
      let sendback = {};
      const result = await User.findOne({ _id: id });

      sendback.info = result;
      sendback.online = [];

      //Add to online list:
      let temp = {
        id: socket.id,
        username: result.username
      };
      arrOnl.push(temp);

      //Find online friends:
      for (let i = 0; i < result.friends.length; i++) {
        let friend;
        let _i = arrOnl.findIndex(e => e.username === result.friends[i]);
        if (_i > -1) {
          friend.username = arrOnl[_i].username;
          (friend.status = 'online'), (friend.id = arrOnl[_i].id);

          //Send friend our id:
          io.to(arrOnl[_i].id).emit('friend-id', {
            username: socket.username,
            id: socket.id
          });
        } else {
          friend.username = arrOnl[_i].username;
          friend.status = 'offline';
          friend.id = null;
        }
        sendback.online.push(friend);
      }
      //Stick username to socket:
      socket.username = result.username;
      socket.user_id = result._id;

      //Join room:
      for (let i = 0; i < result.rooms.length; i++) {
        socket.join(rooms[i]);
      }

      //Sendback:
      socket.emit('login', sendback);
    } catch (err) {
      console.log(err);
    }
  });
  CONSOLE.LOG(a)
  socket.on('typing', val => {
    if (val.socket_id != null) {
      socket.to(friend.socket_id).emit('typing', { username: socket.username });
    } else if (val.room != null) {
      socket.to(room).emit('typing', { username: socket.username });
    }
  });

  socket.on('get-chat', val => {
    try{
        if (val.chat_name != null) {

            let sendback = {};
            const result = await Chat.fineOne({chat_name: val.chat_name});
            if(result != null){
                sendback.mess = result.content;
            }
            else{
                let chat = new Chat({
                    chat_name: val.chat_name,
                    newest_mess: null,
                    content: []
                });
                await chat.save();
                await User.findOneAndUpdate(
                    //condition:
                    {"_id":{"$in": [socket.user_id, val.user_id]}},
                    //update:
                    {"$addToSet": { "chat_rooms": [val.chat_name] }
                });

                sendback.mess = null;          
            }
        }else if(val.room != null){
            let sendback = {};
            const result = await ChatGroup.fineOne({chat_name: val.chat_name});
            if(result != null){
                sendback.mess = result.content;
            }
            else{
                let chatGroup = new ChatGroup({
                    chat_name: val.chat_name,
                    users: [socket.username],
                    newest_mess: null,
                    content: []
                });
                await chatGroup.save();
                await User.findOneAndUpdate(
                    //condition:
                    {"_id":{"$in": [socket.user_id, val.user_id]}},
                    //update:
                    {"$addToSet": { "chat_rooms": [val.chat_name] }
                });

                sendback.mess = null;          
              }
            }
    }catch(err){
        console.log(err);
    }
  });
  
  socket.on('chat', val=>{
    let user = val.user;
    
  });
  socket.on('disconnect');
}

module.exports = (io, mongoose) => {
  _io = io;
  _mongoose = mongoose;
  return { listen };
};
