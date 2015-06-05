var Chat = function(socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
  var message = {
    room: room,
    text: text
  };
  this.socket.emit('message', message);
};

Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', { newRoom: room });
};

Chat.prototype.processCommand = function(command) {
  var words = command.split(command);
  var command = words[0];
  var message = false;

  switch (words[0]) {
    case '/комната':
      words.shift();
      var room = words.join(' ');
      this.changeRoom(room);
      break;
    case '/nick':
      words.shift();
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;
    default:
      message = 'Нет такой команды!';
      break;
  }
  return message;
};
