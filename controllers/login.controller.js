var User = require('../models/User');

exports.login = (req, res, next) => {
  // confirm that user typed same password twice
  console.log(req.body.logemail, req.body.logpassword);
  if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function(
      error,
      user
    ) {
      if (error) {
        res.status(500).send({
          message: 'server error',
          status: false
        });
        return;
      } else if (!user) {
        res.status(401).send({
          message: 'username or password is wrong',
          status: false
        });
        return;
      } else {
        if (user.status) {
          res.status(404).send({
            message: 'user not found',
            status: false
          });
        } else {
          user.password = null;
          let friends = user.friends.map(value => {
            return {
              username: value,
              status: 'offline',
              id: null
            };
          });

          user.friends = friends;
          for (let i = 0; i < user.friends.length; i++) {}
          res.status(200).send({
            mess: 'login successfully',
            login: true,
            user: user
          });
        }
        return;
      }
    });
  } else {
    //var err = new Error('All fields required.');
    res.status(400).send({
      mess: 'All fields required',
      login: false
    });
    next();
  }
};

exports.register = (req, res, next) => {
  if (!req.body.username) {
    return res.status(400).send({
      mess: 'username required',
      status: false
    });
  } else if (!req.body.password) {
    return res.status(400).send({
      mess: 'password required',
      status: false
    });
  } else if (!req.body.email) {
    return res.status(400).send({
      mess: 'email required',
      status: false
    });
  }
  let user = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  };

  //Throw new Error then when catch it will show throw error position
  User.create(user, (err, user) => {
    try {
      if (err) {
        if (err.code === 11000) {
          // email or username could violate the unique index. we need to find out which field it was.
          //console.log(err.message);
          var field = err.message;
          field = field.split(' dup key')[0].trim();
          field = field.substring(field.length - 2, field.lastIndexOf(' ') + 1);
          return res.status(400).send({
            message: 'An account with this ' + field + ' already exists.',
            status: false
          });
        }
        res.status(500).send({
          mess: 'internal server error',
          status: false
        });
        throw new Error(err);
      } else if (!user) {
        res.status(401).send({
          mess: `can not insert user`,
          status: false
        });
      } else {
        res.status(200).send({
          mess: `create user successfully`,
          status: true
        });
      }
    } catch (err) {
      console.log(err);
    }
  });
};
