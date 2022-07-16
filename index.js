const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models");

//URI Connection
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//input validator
const { check, validationResult } = require("express-validator");

const Cafes = Models.Cafe;
const Users = Models.User;
const Areas = Models.Area;
app = express();

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { escapeRegExp, rest } = require("lodash");

//CORS
const cors = require("cors");
app.use(cors()); //allows all domains

// calling express
app.use(express.json()); //for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/ x-www-form-urlencoded
app.use(morgan("common"));

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

// Get a list of all cafes
/**
 * this is the API endpoint for getting a list of ALL the cafes
 * using the rest API via GET
 * this requires a bearer token(jwt) to access the list
 */
app.get(
  "/cafes",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Cafes.find().then((cafes) => {
      res.status(201).json(cafes);
    });
  }
);

// Get a list of all cafe areas
/**
 * this is the API endpoint for getting a list of ALL the areas that have cafes
 * using the rest API via GET
 * this requires a bearer token(jwt) to access the list
 */
app.get(
  "/areas",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Areas.find().then((areas) => {
      res.status(201).json(areas);
    });
  }
);

// Get a data about a single area
/**
 * this is the API endpoint for a specific cafe by name
 * using the rest API via GET and
 * @param Name
 */
app.get(
  "/areas/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Cafes.findOne({ "Area.Name": req.params.Name }).then((area) => {
      res.json(area);
    });
  }
);
// get data about a single cafe by cafe name
/**
 * this is the API endpoint for a specific cafe by name
 * using the rest API via GET and
 * @param Name
 * The cafe name will also be used within the URL after "/cafes"
 * if the cafe name has spaces in it, spaces will become "%20" in the URL
 * Example:
 * To search for "Maru Coffee"
 * the end point would be: https://cafe-app-la.herokuapp.com/cafes/Maru%20Coffee
 */
app.get(
  "/cafes/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Cafes.findOne({ Name: req.params.Name }).then((cafe) => {
      res.json(cafe);
    });
  }
);

//Get data about a single user by Username
/**
 * This API endpoint is used to get a user by username
 * using the rest API via GET
 * This requires the userID to get the user data
 */
app.get(
  "/users/:UserID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ UserID: req.params.UserID })
      // .populate("FavoriteCafes")
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("error " + err);
      });
  }
);

// register a new user
/**
 * This API endpoint is used for posting new users
 * using rest API via POST and
 * @param Username
 * @param Password
 * @param Email
 * @param Birthday
 * If the data is sent correctly this will post a new user with the data used within the params
 */
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
          return res.status(409).send(req.body.Username + "already exists");
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

// Update a user's info, by userID
/**
 * This API endpoint is used for updating a user's data
 * using rest API via PUT and
 * @param Username
 * @param Password
 * @param Email
 * @param Birthday
 * If the data is sent correctly this will update a user's data with the data used within the params
 */
app.put(
  "/users/:UserID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { UserID: req.params.UserID },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
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
/**
 * This is the API endpoint for deleting a user by username
 * using the rest API via DELETE
 * this requires the username for this to function!
 */
app.delete(
  "/users/:UserID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ UserID: req.params.UserID }).then((user) => {
      if (!user) {
        res.status(400).send("user was not found");
      } else {
        res.status(200).send("user was deleted.");
      }
    });
  }
);

// add a cafe to user's favorites
/**
 * This is the API endpoint for adding a cafe to the list of favorites to the user
 * using the rest API via POST
 * This requires the userID of the user from the database to function
 * This also requires the cafe ID to be able to add the correct cafe to the favorites list
 */
app.post(
  "/users/:UserID/cafes/:CafeID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { UserID: req.params.UserID },
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
/**
 * This API endpoint is to delete a favorite cafe from the list on users
 * using the rest API via DELETE
 * This requires the userID of the user from the database to function
 * This also requires the cafe ID to be able to remove the correct cafe from the favorites list
 */
app.delete(
  "/users/:UserID/cafes/:CafeID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { UserID: req.params.UserID },
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
