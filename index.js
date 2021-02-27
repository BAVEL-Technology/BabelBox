const express = require('express');
const PORT = process.env.PORT || 5000;
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const routes = require('./routes');
const app = express();
app.use(cors());
const socket = require('socket.io');
const mongoCreate = require('./utils/mongoCreate.js')
//hello
app.use(express.json());
app.use(routes);
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
   res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const start = () => {
  const server = app.listen(PORT, function() {
    console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
  });
  mongoCreate.createDataTables()
  const io = socket(server, {
    cors: {
      origin: '*',
    }
  });
  app.set('socketio', io);
  const newConnection = (socket) => {
    const callback = (data) => {
      console.log('Got it yall');
    }

    console.log('new connection: ' + socket.id);
    socket.on('I got it wrong', callback);
  }

  io.sockets.on('connection', newConnection);
}

start()
