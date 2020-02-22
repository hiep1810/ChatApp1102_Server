var User = require('../../app/models/user.model');

exports.login = (req, res, next) => {
  // confirm that user typed same password twice
  User.a;
  if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function(
      error,
      user
    ) {
      if (error) {
        res.status(500).send({
          mess: 'server error',
          login: false
        });
        return;
      } else if (!user) {
        res.status(401).send({
          mess: 'username or password is wrong',
          login: false
        });
        return;
      } else {
        res.status(200).send({
          mess: 'login successfully',
          login: true,
          user: user
        });
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
