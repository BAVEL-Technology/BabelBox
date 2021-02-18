const db = require("../models");
const mongoose = require("mongoose");
const mongo = require('./mongoConnection.js');
const camelcase = require('camelcase');

Array.prototype.asyncForEach = async function (callback) {
  for (let i = 0; i < this.length; i++) {
    await callback(this[i]);
  }
}

const models = {}

const createDataTables = async () => {
  return new Promise(async (resolve) => {
    try {
      if (mongo.readyState == 1) {
        await mongo.disconnect()
        await mongo.connect()
      } else {
        await mongo.connect()
      }
      const database = await db.Database.find({})
      await database.asyncForEach(async (table) => {
        if (mongoose.connection.models[camelcase(table.name)]) {
          console.log(`${camelcase(table.name)} already exists.`)
        } else {
          console.log(`Working on ${camelcase(table.name)}.`)
          let modelName = camelcase(table.name)
          let schema = {}
          let useBcrypt = false
          await table.props.asyncForEach(async (prop) => {
            console.log(`Added ${camelcase(prop.name)}.`)
            let type = { type: prop.type }
            if (prop.required) type.required = prop.required
            if (prop.default) {
              if (prop.default.includes('()')) {
                type.default = eval(prop.default)
              } else {
                type.default = prop.default
              }
            }
            if (prop.bcrypt) {
              useBcrypt = true
              type.bcrypt = true
            }
            schema[camelcase(prop.name)] = type
          })
          let modelSchema = new mongoose.Schema(schema, { collection: modelName })
          if (useBcrypt) modelSchema.plugin(require('mongoose-bcrypt'));
          models[modelName] = mongoose.model(modelName, modelSchema)
          console.log(models[modelName].prototype instanceof mongoose.Model)
        }
      })
      resolve(200)
    } catch (err) {
      console.log(err)
      resolve(err)
    }
  })
}

module.exports = {
  createDataTables: createDataTables,
  mongoModels: models
}
