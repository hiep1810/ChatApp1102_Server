module.exports = (_io, _arrRoomOnl) => {
  const ChatGroup = require('../models/ChatGroup');

  //on disconnect not in any room anymore

  const getGroupInfo = async (socket, action) => {
    try {
      let data = action.data;

      console.log('SOCKET>ROOM:', socket.rooms);
      //Join room (group):
      for (let room of data) {
        if (!socket.rooms[room]) {
          socket.join(room);
        }
      }

      //Get group information:
      const result = await ChatGroup.find(
        //Condition:
        { _id: { $in: data } }
      );

      console.log('RESULT:', result);
      //After get all group info then send data to client:
      socket.emit('action', {
        type: 'get-group-info',
        data: result,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const getGroupChat = async (socket, action) => {
    //console.log('getGroupChat:', action.data);
    try {
      let data = action.data;
      let sendback = {};

      const result = await ChatGroup.findOne({ _id: data.chatId });
      sendback = result;
      //console.log('HOHO');
      socket.emit('action', {
        type: 'get-group-chat',
        data: { sendback: sendback, send_user: data.send_user },
      });
    } catch (err) {
      console.log(err);
    }
  };

  const groupChat = async (socket, action) => {
    //console.log('groupChat:', action.data);
    let data = action.data;
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
    if (data.chatType == 'group') {
      //console.log('HOHO');
      try {
        const result = await ChatGroup.findOneAndUpdate(
          //condition:
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
          }
        );
        if (result)
          socket
            .to(data.chatId)
            .emit('action', { type: 'group-chat', data: data });
      } catch (err) {
        console.log(err);
      }
    }
  };

  return { getGroupChat, groupChat, getGroupInfo };
};
