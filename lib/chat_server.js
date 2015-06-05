var socketio = require('socket.io');
var io;

var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

function handleClientDisconnection(socket) {
  socket.on('disconnect', function(){
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function hanbleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) { // serve name changing
    if (name.indexOf('Guest') >= 0) { // check if the selected name is Guest
      socket.emit('nameResult', {
        success: false,
        message: 'Имена не могут начинаться с Guest'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) { // check new selected name
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex]; // delete the old one client's name
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' теперь зовётся как ' + name + '.'
        });
      } else { // serve taken name
        socket.emit('nameResult', {
          success: false,
          message: 'Это имя уже взято.'
        });
      }
    }
  });
}

function joinRoom(socket, room) {
  socket.join(room); // select channel for client
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
  socket.broadcast.to(room).emit('message', { // fire message for clients
    text: nickNames[socket.id] + ' вошёл в комнату ' + room + '.'
  });

  /*var usersInRoom = io.sockets.clients(room); // getting client's count
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Пользователей в комнате: ' + usersInRoom.length;
    socket.emit('message', { text: usersInRoomSummary }); // fire message about client's count
  }*/
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber; // new user get his own nick
  nickNames[socket.id] = name; // remembered this name
  socket.emit('nameResult', { // fire this event to client
    success: true,
    name: name
  });
  namesUsed.push(name); // this name is already in use
  return guestNumber + 1; // next guest number
}


var serveSocketConnection = function(socket) {
  guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
  joinRoom(socket, 'Lobby'); // add client to default room
  hanbleMessageBroadcasting(socket, nickNames); // serve messages
  handleNameChangeAttempts(socket, nickNames, namesUsed); // serve name changes
  handleRoomJoining(socket); // serve room operations

  /*socket.on('rooms', function() {
    socket.emit('rooms', io.sockets.manager.rooms);
  });*/
  handleClientDisconnection(socket, nickNames, namesUsed); // serve disconnection
}

var listen = function(server) {
  io = socketio.listen(server); // run sockets on existed server
  //io.set('log level', 1); // shut up, sockets, shut up!

  io.sockets.on('connection', serveSocketConnection);
}

module.exports.listen = listen;
