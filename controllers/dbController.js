const __ = require("../models");
const mongoose = require("mongoose");
const mongoCreate = require('../utils/mongoCreate.js')
const mongo = require('../utils/mongoConnection.js')
const camelcase = require('camelcase');

Array.prototype.asyncForEach = async function (callback) {
  for (let i = 0; i < this.length; i++) {
    await callback(this[i]);
  }
}

module.exports = {
  browse: async (req, res) => {
    try {
      //Check for all stored Tables
      let tables = await __.Database.find({})
      //Store table names in memory
      let tableNames = tables.map(table => camelcase(table.name))
      //Store tables in memory
      let response = tables.map(table => table)
      //Check if there are other "models" that were created, they must become tables
      let otherModels = mongoose.modelNames().filter(name => !tableNames.includes(name))
      otherModels.forEach((model) => {
        console.log(mongoose.model(model).schema.obj)
        let mongooseModels = Object.keys(mongoose.model(model).schema.obj)
        mongooseModels = mongooseModels.map((mm) => {
          return {
            name: mm,
            type: mongoose.model(model).schema.obj[mm].type,
            bcrypt: mongoose.model(model).schema.obj[mm].bcrypt ? true : false
          }
        })
        if (model != 'Database') {
          response.push({
            name: model,
            owner: 'Babel',
            props: mongooseModels
          })
        }
      })
      res.status(200).json(response)
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
      //The name of the table
      const filter = { name: req.params.table.replace(/-/g, " ") }
      let table
      if (req.body.props) {
        let props = {
          name: req.body.props.name.toLowerCase(),
          type: req.body.props.type,
        }
        if (req.body.props.default) props.default = req.body.props.default
        if (req.body.props.required) props.required = req.body.props.required
        table = await __.Database.findOneAndUpdate(filter, { $push : {
            props
          }
        })
      } else if (req.body.name) {
        console.log(camelcase(req.body.name.toLowerCase()), camelcase(filter.name))
        let nameData = await __.Database.find({})
        let names = []
        nameData.forEach((data) => names.push(data.name))
        if (names.includes(camelcase(req.body.name.toLowerCase()))) {
          res.status(200).json({status: 'duplicate', message: 'Added props, if sent, but could not update name, because name already exists.'})
          return
        } else {
          console.log('here')
          table = await __.Database.findOneAndUpdate(filter, { name: req.body.name.toLowerCase()})
          //Find the old model
          const OldModel = mongoCreate.mongoModels[camelcase(filter.name)]
          //Find the old data
          let oldData = await OldModel.find({})
          let collections = await mongoose.connection.db.listCollections().toArray()
          let collectionNames = []
          collections.forEach((c) => collectionNames.push(c.name))
          console.log(collectionNames)
          //Create the new model
          await mongoCreate.createDataTables()
          console.log(oldData)
          //Find the new model
          const NewModel = mongoCreate.mongoModels[camelcase(req.body.name.toLowerCase())]
          //Put it in the new model
          await NewModel.insertMany(oldData)
          //Drop the old collection
          if (collectionNames.includes(camelcase(filter.name))) await OldModel.collection.drop();
        }
      }

      console.log(camelcase(filter.name))
      console.log(mongoose.connection.models[camelcase(filter.name)])
      //Drop the old model
      await delete mongoose.connection.models[camelcase(filter.name)];
      await mongoCreate.createDataTables()
      console.log('db created')
      res.status(200).json(table)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  add: async (req, res) => {
    try {
      let body = req.body
      if (body.name) {
        let nameData = await __.Database.find({})
        let names = []
        nameData.forEach((data) => names.push(camelcase(data.name)))
        body.name = body.name.toLowerCase()
        if (names.includes(camelcase(body.name))) {
          res.status(205).json({status: 'duplicate', message: 'Added props, if sent, but could not update name, because name already exists.'})
          return
        }
      }
      let table = await __.Database.create(body)
      await mongoCreate.createDataTables()
      if (mongoose.connection.models[camelcase(body.name)])console.log('Added' + body.name)
      res.status(200).json(table)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  destroy: async (req, res) => {
    try {
      let table = await __.Database.deleteOne({ name: req.params.table.replace(/-/g, " ") })
      console.log(table)
      const OldModel = mongoCreate.mongoModels[camelcase(req.params.table.replace(/-/g, " "))]
      let collections = await mongoose.connection.db.listCollections().toArray()
      let collectionNames = []
      collections.forEach((c) => collectionNames.push(c.name))
      console.log(collectionNames, camelcase(req.params.table.replace(/-/g, " ")))
      if (collectionNames.includes(camelcase(req.params.table.replace(/-/g, " ")))) {
        console.log('dropping')
        console.log(OldModel)
        await OldModel.collection.drop();
      }
      await delete mongoose.connection.models[camelcase(req.params.table.replace(/-/g, " "))];
      mongoCreate.createDataTables()
      res.status(200).json(table)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  readField: async (req, res) => {
    try {

    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  editField: async (req, res) => {
    try {
      let table = await __.Database.findOne({name: req.params.table.replace(/-/g, " ")})
      let field = table.props.filter((prop) => prop._id == req.params.field)[0]
      let oldField = {
        name: field.name,
        type: field.type,
        default: field.default
      }
      Object.keys(req.body).forEach((key) => {
        field[key] = req.body[key]
      })
      let newProps = []
      if (req.body.name) {
        let props = table.props.forEach((prop) => {
          if (prop._id == req.params.field) {
            newProps.push(field)
            newProps.push(oldField)
          } else {
            newProps.push(prop)
          }
        })
        await delete mongoose.connection.models[camelcase(req.params.table)];
        table = await __.Database.findOneAndUpdate({name: req.params.table.replace(/-/g, " ")}, {props: newProps})
        await mongoCreate.createDataTables()
        const Model = mongoCreate.mongoModels[camelcase(req.params.table)]
        let update = await Model.update({}, { $rename: { [oldField.name]: field.name } }, { multi: true, strict: false });
        console.log(update)
      }
      newProps = []
      let props = table.props.forEach((prop) => {
        if (prop._id == req.params.field) {
          newProps.push(field)
        } else {
          newProps.push(prop)
        }
      })
      table = await __.Database.findOneAndUpdate({name: req.params.table.replace(/-/g, " ")}, {props: newProps})
      await delete mongoose.connection.models[camelcase(req.params.table)];
      await mongoCreate.createDataTables()
      console.log(field)
      res.status(200).json(table)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  destroyField: async (req, res) => {
    try {

    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },
}
