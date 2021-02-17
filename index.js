const express = require('express');
const PORT = process.env.PORT || 5000;
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const routes = require('./routes');
const app = express();
const mongoCreate = require('./utils/mongoCreate.js')
//hello
app.use(cors());
app.use(express.json());
app.use(routes);
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// var fs = require('fs')
//   , inflection = require('inflection')
// // Lookup models directory
// const createModels = () => {
//   fs.readdirSync(__dirname + '/models/').forEach(function (file){
//     var filePath = __dirname + '/models/' + file;
//     // Match all .js files but this
//     if (fs.statSync(filePath).isFile() && file != 'index.js' && file != 'database.js' && /.*.js/.test(file)) {
//       // Inflect the model name
//       var modelName = inflection.camelize(file.replace('.js', '').replace('-', '_'));
//       // Load the model
//       var modelSchema = require(filePath)[modelName + 'Schema'];
//       console.log(modelName)
//       if (typeof modelSchema != 'undefined') {
//         mongoose.model(modelName, modelSchema);
//         console.log('Loaded model "%s" from file "%s"', modelName, file);
//       }
//       else {
//         console.error('Schema for model "%s" not found in file "%s"', modelName, file);
//       }
//     };
//   });
// }

// app.get('/', (req, res) => {
//    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
// });

// app.post('/test', async (req, res) => {
//   try {
//     console.log(req.body)
//     if (!req.body.name) {
//       res.status(400).json(err)
//       return
//     }
//     let db = await __.Database.create({
//       name: req.body.name,
//       owner: '1j48j59n84o3'
//     })
//
//     createDataTables()
//
//     res.status(200).json(db)
//   } catch (err) {
//     console.log(err)
//     res.status(400).json(err)
//   }
// })
//
// app.put('/test/:model', async (req, res) => {
//   try {
//     // let model = models[req.params.model]
//     let newDB = await __.Database.findOneAndUpdate({ name: req.params.model }, { $push : {
//       props: {
//         key: req.body.key,
//         value: req.body.value
//       }
//     } })
//
//     console.log(newDB)
//     res.status(200).json('done')
//   } catch (err) {
//     console.log(err)
//     res.status(400).json(err)
//   }
// })
//
// app.get('/test', async (req, res) => {
//   const schemas = [];
//   mongoose.modelNames().forEach(function(modelName){
//       schemas.push({
//         schema: mongoose.model(modelName).schema.obj,
//         model: modelName
//       });
//   })
//
//   res.json(schemas)
// })
//
// app.get('/db', async (req, res) => {
//   const dbTable = await __.Database.find({})
//   console.log(dbTable)
//   res.json(dbTable)
// });

app.get('/', (req, res) => {
   res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, function() {
  mongoCreate.createDataTables()
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
