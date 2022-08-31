"use strict";

var mongoose = require("mongoose");

var bcrypt = require("bcrypt");

var cafeSchema = mongoose.Schema({
  Name: {
    type: String,
    required: true
  },
  Area: {
    Name: String,
    Description: String,
    StreetAddress: String,
    City: String,
    ZipCode: String,
    Latitude: String,
    Longitude: String
  },
  Hours: String,
  Phone: String,
  Seating: String,
  Parking: String,
  Website: String,
  ImagePathExterior: String,
  ImagePathInterior: String,
  ImagePathMisc: String,
  TakeOutOnly: Boolean,
  Wifi: Boolean,
  Beans: Boolean,
  Restroom: Boolean,
  Instagram: String,
  Latitude: mongoose.Types.Decimal128,
  Longitude: mongoose.Types.Decimal128,
  Location: String
});
var areaSchema = mongoose.Schema({
  AreaName: {
    type: String,
    required: true
  },
  AreaDescription: {
    type: String,
    required: true
  },
  Latitude: String,
  Longitude: String
});
var userSchema = mongoose.Schema({
  Username: {
    type: String,
    required: true
  },
  Password: {
    type: String,
    required: true
  },
  Email: {
    type: String,
    required: true
  },
  Birthday: Date,
  FavoriteCafes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cafe"
  }]
});

userSchema.statics.hashPassword = function (password) {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password);
};

var Cafe = mongoose.model("Cafe", cafeSchema);
var Area = mongoose.model("Area", areaSchema);
var User = mongoose.model("User", userSchema);
module.exports.Cafe = Cafe;
module.exports.Area = Area;
module.exports.User = User;