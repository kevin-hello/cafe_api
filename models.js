const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

let cafeSchema = mongoose.Schema({
  Name: { type: String, required: true },
  Area: {
    Name: String,
    Description: String,
    StreetAddress: String,
    City: String,
    ZipCode: String,
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
});

let areaSchema = mongoose.Schema({
  AreaName: { type: String, required: true },
  AreaDescription: { type: String, required: true },
});

let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  FavoriteCafes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cafe" }],
});

userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password);
};

let Cafe = mongoose.model("Cafe", cafeSchema);
let Area = mongoose.model("Area", areaSchema);
let User = mongoose.model("User", userSchema);

module.exports.Cafe = Cafe;
module.exports.Area = Area;
module.exports.User = User;
