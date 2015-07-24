var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// routes
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/script.js', function(req, res) {
  res.sendFile(__dirname + '/javascript/script.js');
});

app.get('/style.css', function(req, res) {
  res.sendFile(__dirname + '/css/style.css');
});

var webcamData = {};

// socket.io connections
io.on('connection', function(socket) {
  console.log('a user connected');

  // let all the existing clients know a new one has joined
  io.to('webcams').emit('client_joined', {data: socket.id});

  // join the new client to the webcams room
  socket.join('webcams');

  // send all the webcams to initialize with
  socket.emit('initialize', {id: socket.id, clients: webcamData});

  socket.on('updateCanvas', function(data) {
    webcamData[socket.id] = data;

    io.to('webcams').emit('webcam_update', {id: socket.id, data: data});
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');

    // delete the clients value for this socket
    delete webcamData[socket.id];

    // leave the rooms
    socket.leave('webcams');

    // let all the other clients know about the disconnection
    io.to('webcams').emit('client_left', {id: socket.id});
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
