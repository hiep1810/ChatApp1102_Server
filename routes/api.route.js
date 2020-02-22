const express = require('express');
var router = express.Router();
const loginCntrl = require('../controllers/login.controller');

router.post('/login', loginCntrl.login);

router.post('/register', null);

module.exports = router;
