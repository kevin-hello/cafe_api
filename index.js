const express = require("express"),
  bodyParser = require("body-parser"),
  uuid = require("uuid");

const morgan = require("morgan"),
  app = express(),
  mongoose = require("mongoose"),
  Models = require("./models");

const Cafes = Models.Cafe;
const Users = Models.User;
const Areas = Models.Area;

//input validator
const { check, validationResult } = require("express-validator");

const { escapeRegExp, rest } = require("lodash");

//URI Connection
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//CORS
const cors = require("cors");
app.use(cors());

app.use(morgan("common"));

//body parser middleware

app.use(express.json()); //for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/ x-www-form-urlencoded

//imports auth.js file
let auth = require("./auth")(app);

//import passport.js file
const passport = require("passport");
require("./passport");

// access documentation.html using express.static function
app.use(express.static("public"));

// GET requests
app.get("/hello", (req, res) => {
  res.send("Welcome to my cafe API!");
});

//Get data about a single user by Username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .populate("FavoriteCafes")
      .then((user) => {
        res.json(user);
      });
  }
);

// Get a list of all cafes
app.get(
  "/cafes",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Cafes.find().then((cafes) => {
      res.status(201).json(cafes);
    });
  }
);

// get data about a single cafe by cafe name
app.get(
  "/cafes/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Cafes.findOne({ Name: req.params.Name }).then((cafe) => {
      res.json(cafe);
    });
  }
);

// register a new user
/* JSON expected in this format:
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post(
  "/users",
  //validation logic
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      //searching to see if user with requested username already exists
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + "already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          }).then((user) => {
            res.status(201).json(user);
          });
        }
      });
  }
);

// Update a user's info, by username
/* JSON expected in this format:
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// Delete a user by username
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username }).then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted.");
      }
    });
  }
);

// add a cafe to user's favorites
app.post(
  "/users/:Username/cafes/:CafeID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteCafes: req.params.CafeID },
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// remove a cafe from user's favorites
app.delete(
  "/users/:Username/cafes/:CafeID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $pull: { FavoriteCafes: req.params.CafeID } },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// error handling

app.use((err, req, res, next) => {
  try {
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + error);
  }
});

// listen for requests

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
