const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  create: async (req, res) => {
    const {
      username,
      password
    } = req.body;
    try {
      let user = await db.Admins.findOne({
        username
      });
      console.log(user)
      if (user) {
        return res.status(400).json({
          msg: "Admins Already Exists"
        });
      }

      user = new db.Admins({
        username,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString", {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
      }
      catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
  },

  read: (req, res) => {
    db.Admins
      .findById(req.params.id)
      .then(dbAdmins => res.json(dbAdmins))
      .catch(err => res.status(422).json(err));
  },

  update: (req, res) => {
    db.Admins
      .findOneAndUpdate({ _id: req.params.id }, req.body)
      .then(dbAdmins => res.json(dbAdmins))
      .catch(err => res.status(422).json(err));
  },

  destroy: (req, res) => {
    db.Admins
      .findById({ _id: req.params.id })
      .then(dbAdmins => dbAdmins.remove())
      .then(dbAdmins => res.json(dbAdmins))
      .catch(err => res.status(422).json(err));
  },

  login: async (req, res) => {
      const { username, password } = req.body;
    try {
      let user = await db.Admins.findOne({
        username
      });
      if (!user)
        return res.status(400).json({
          message: "Admins Not Exist"
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          message: "Incorrect Password !"
        });

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }

  },

  logout: (req, res) => {

  },

  currentAdmin: async (req, res) => {
    try {
      const user = await db.Admins.findById(req.user.id);
      res.status(200).json(user);
    } catch (err) {
      console.log(err)
    }
  }
}
