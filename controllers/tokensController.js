const mongoose = require("mongoose");
const mongoCreate = require('../utils/mongoCreate.js')
const camelcase = require('camelcase')
const db = require("../models");

module.exports = {
  read: async (req, res) => {
    try {
      let t = await db.Tokens.findOne({ip: req.body.ip})
      if (!t) {
        console.log('no records')
        res.status(200).json({message: 'No Tokens Found!'})
        return
      }
      if (Date.now() > t.exp) {
        res.status(200).json({message: 'Token has expired!'})
        return
      }

      res.status(200).json(t)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  create: async (req, res) => {
    try {
      let t = await db.Tokens.find({ip: req.body.ip})
      console.log(t)
      let deleted = await db.Tokens.deleteMany({ip: t.ip})
      console.log(deleted)
      let newT = await db.Tokens.create({
        ip: req.body.ip,
        token: req.body.token,
        access: req.body.access
      })
      console.log(req.body)
      res.status(200).json(newT)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  }
}
