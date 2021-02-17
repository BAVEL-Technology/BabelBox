const mongoose = require("mongoose");
const mongoCreate = require('../utils/mongoCreate.js')
const camelcase = require('camelcase')

module.exports = {
  browse: async (req, res) => {
    try {
      console.log(camelcase(req.params.bread))
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      console.log(camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1))
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      console.log(Model)
      const data = await Model.find({})
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  read: async (req, res) => {
    try {

    } catch (err) {

    }
  },

  edit: async (req, res) => {
    try {
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      console.log(camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1))
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      console.log(Model)
      const data = await Model.findOneAndUpdate({_id: req.params.id}, req.body)
      console.log(data)
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  add: async (req, res) => {
    try {
      const Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      console.log(camelcase(req.params.bread))
      let data = await Model.create(req.body)
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  destroy: async (req, res) => {
    try {
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      console.log(camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1))
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      console.log(Model)
      const data = await Model.deleteOne({_id: req.params.id})
      console.log(data)
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  }
}
