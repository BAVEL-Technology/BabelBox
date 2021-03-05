const express = require('express');
const PORT = process.env.PORT || 5000;
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const routes = require('./routes');
const app = express();
const axios = require('axios');
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
  // handle incoming connections from clients
  io.on('connection', function(socket) {
    socket.on('start timer', (data) => {
      console.log('staring the timer')
      const func = eval(data.function)
      console.log(func)
      setTimeout(() => {
        func()
      }, data.time)
    })
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    socket.on('room', function(room) {
        const users = [];
          socket.join(room);
          io.sockets.in(room).emit('message', 'hi from localhost ' + room);
          //***code for chat events */
          socket.on('new-user', username => {
            const user = {
              name: username,
              id: socket.id
            }
            console.log(user.name);
              // users[socket.id] = user;
              users.push(user);
              console.log(users);
              io.sockets.in(room).emit("start", user);
              // io.emit("users", Object.values(users));
            });
          //***print out chat message event
          socket.on('chat message', (msg) => {
            const user = users.find(user => {
              return user.id === socket.id;});
              console.log(user);
              //this will send the message to all the sockets
              io.sockets.in(room).emit('chat message', {
                text: msg,
                user: users.find(user => {
                  return user.id === socket.id;
                })
              });
              console.log('message: ' + msg);
            });

          const removeUser = (id) => {
            const index = users.findIndex((user) => user.id === id);

            if(index !== -1) return users.splice(index, 1)[0];
          };

          socket.on('disconnect', (data) => {
            console.log('User has left')
            console.log(socket.id)
            removeUser(socket.id);
            })
      });
  });


  app.set('socketio', io);
}

start()
