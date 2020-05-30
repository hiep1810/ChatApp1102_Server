const express = require('express');
var router = express.Router();
const loginCntrl = require('../controllers/login.controller');
const userCntrl = require('../controllers/user.controller');

router.post('/login', loginCntrl.login);

router.post('/register', loginCntrl.register);

router.post('/createRoom', userCntrl.createRoom);

router.post('/leaveRoom', userCntrl.leaveRoom);

router.post('/friendRequestsSended', userCntrl.userFriendRequestsSended);

router.post('/friendRequests', userCntrl.friendRequests);

router.post('/addFriend', userCntrl.addFriend);

router.post('/removeAddFriend', userCntrl.removeAddFriend);

router.post('/removeAddFriendByUsername', userCntrl.removeAddFriendByUsername);

router.post('/acceptFriendRequest', userCntrl.acceptFriendRequest);

router.post('/declineFriendRequest', userCntrl.declineFriendRequest);

router.post('/removeFriend', userCntrl.removeFriend);

router.post('/getUserInfoFromFRS', userCntrl.getUserInfoFromFRS);

router.post('/updateUserInfo', userCntrl.updateUserInfo);

router.post('/users', userCntrl.getUsers);
//----------------------------------
router.post('/createPost', userCntrl.createPost);

router.post('/getPosts', userCntrl.getPosts);

router.post('/updatePost', userCntrl.updatePost);

router.post('/deletePost', userCntrl.deletePost);

router.post('/getPostsByUsername', userCntrl.getPostsByUsername);

router.post('/getUserInfoWithPosts', userCntrl.getUserInfoWithPosts);

router.post('/likePost', userCntrl.likePost);

router.post('/unlikePost', userCntrl.unLikePost);
//----------------------------------
module.exports = router;
