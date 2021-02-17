const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: 'String', required: true },
  password: { type: 'String', required: true, bcrypt: true },
});

userSchema.plugin(require('mongoose-bcrypt'));

const User = mongoose.model("User", userSchema);

module.exports = User;
