let mongoose = require("mongoose");
let db = require("./models");
let bcrypt = require('bcrypt');

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/mongooseTest", {
  useNewUrlParser: true,
  useFindAndModify: false
});

const seedDB = async () => {
  const salt = await bcrypt.genSalt(10);
  let password = await bcrypt.hash('q$^K4~DYdMSk4[{,z:jR&amp;.[:', salt);

  let adminSeeds = [
    {
      username: 'nickgraffis',
      password
    },
    {
      username: 'robertschmahl',
      password
    },
    {
      username: 'christianpayne',
      password
    },
    {
      username: 'stevetong',
      password
    },
    {
      username: 'andrewdoka',
      password
    },
    {
      username: 'dustinpidcock',
      password
    },
    {
      username: 'ivansilvar',
      password
    }
  ]

  db.Admins.deleteMany({})
    .then(() => db.Admins.collection.insertMany(adminSeeds))
    .then(data => {
      console.log(data.result.n + " records inserted!");
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

seedDB()
