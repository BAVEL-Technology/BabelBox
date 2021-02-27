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

const users = {};

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
  // handle incoming connections from clients
  io.on('connection', function(socket) {
      // once a client has connected, we expect to get a ping from them saying what room they want to join
      socket.on('room', function(room) {
          socket.join(room);
          io.sockets.in(room).emit('message', 'hi from localhost ' + room);
      });
      //***code for chat events */
      socket.on('new-user', username => {
        const user = {
          name: username,
          id: socket.id
        }
          users[socket.id] = user;
          io.emit("connected", user);
          io.emit("users", Object.values(users));
        });
      //***print out chat message event
      socket.on('chat message', (msg) => {
          //this will send the message to all the sockets
          io.emit('chat message', {
            text: msg,
            user: users[socket.id]
          });
          console.log('message: ' + msg);
        });
  });


  app.set('socketio', io);
}

start()
