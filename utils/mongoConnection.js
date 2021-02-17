const mongoose = require("mongoose");

module.exports = {
  connect: () => {
    return mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/mongooseTest", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
  },

  disconnect: () => {
    return mongoose.disconnect()
  },

  connection: () => {
    return mongoose.connection
  },

  readyState: () => {
    return mongoose.connection.readyState
  }
}
