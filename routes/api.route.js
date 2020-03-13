const express = require('express');
var router = express.Router();
const loginCntrl = require('../controllers/login.controller');
const userCntrl = require('../controllers/user.controller');

router.post('/login', loginCntrl.login);

router.post('/register', loginCntrl.register);

router.post('/addFriend', userCntrl.addFriend);

router.post('/removeFriend', userCntrl.removeFriend);

module.exports = router;
