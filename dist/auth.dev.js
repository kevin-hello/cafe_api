"use strict";

var jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy

var jwt = require("jsonwebtoken"),
    passport = require("passport");

require("./passport"); // Your local passport file


var generateJWTToken = function generateJWTToken(user) {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    // This is the username you’re encoding in the JWT
    expiresIn: "7d",
    // This specifies that the token will expire in 7 days
    algorithm: "HS256" // This is the algorithm used to “sign” or encode the values of the JWT

  });
};
/* POST login. */


module.exports = function (router) {
  router.post("/login", function (req, res) {
    passport.authenticate("local", {
      session: false
    }, function (error, user, info) {
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user
        });
      }

      req.login(user, {
        session: false
      }, function (error) {
        if (error) {
          res.send(error);
        }

        var token = generateJWTToken(user.toJSON());
        return res.json({
          user: user,
          token: token
        });
      });
    })(req, res);
  });
};