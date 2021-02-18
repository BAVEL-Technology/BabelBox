const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminsSchema = new Schema({
  username: { type: 'String', required: true },
  password: { type: 'String', required: true, bcrypt: true },
});

adminsSchema.plugin(require('mongoose-bcrypt'));

const Admins = mongoose.model("Admins", adminsSchema);

module.exports = Admins;
