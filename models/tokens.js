const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokensSchema = new Schema({
  token: { type: 'String' },
  ip: { type: 'String' },
  exp: { type: 'Date', default: new Date().setDate(new Date().getDate() + 1)},
  access: { type: 'String' },
});


const Tokens = mongoose.model("Tokens", tokensSchema);

module.exports = Tokens;
