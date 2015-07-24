// define getusermedia
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// init socket.io
var socket = io();
var clients = {};
var canvases = {};
var ctxs = {};
var thisSocket;

var initDone = false;
socket.on('initialize', function(data) {
  if (initDone) {
    $('#other_clients').empty();
  }

  thisSocket = data.id;
  clients = data.clients;
  renderClients();

  initDone = true;
});

socket.on('webcam_update', function(data) {
  // only do the update for non-self
  if (data.id != thisSocket) {
    clients[data.id] = data.data;
    drawClientfunction(clients[data.id], data.id);
  }
});

socket.on('client_left', function(data) {
  removeClient(data.id)
});

// socket.emit('chat message', $('#m').val());

var videoConstraints = {
  video: {
    mandatory: {
      maxWidth: 320,
      maxHeight: 180
    }
  }
};

if (navigator.getUserMedia) {
  navigator.getUserMedia(videoConstraints, function(localMediaStream) {
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(localMediaStream);

    video.onloadedmetadata = function(e) {
      console.log('Loaded');
    };
  },

  function(err) {
    console.log('failed to get webcam: ' + err);
  });
}

var video;
var canvas;
var ctx;
$(window).ready(function() {
  video = document.getElementById('myvideo');
  canvas = document.getElementById('mycanvas');
  ctx = canvas.getContext('2d');

  // draw to the canvas every 2000 ms
  setInterval(drawToCanvas, 1000);
});

// cache the elements
function drawToCanvas() {
  console.log('Drawing...');
  // update the canvas to match the video size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  var canvasData = canvas.toDataURL();
  socket.emit('updateCanvas', {width: video.videoWidth, height: video.videoHeight, imageData: canvasData});
}

function addClient() {

}

function renderClients() {
  // loop the clients
  for (var index in clients) {
    drawClientfunction(clients[index], index);
  }
}

function drawClientfunction(client, id) {
  var ctx;
  if (id in canvases) {
    // get the canvas drawing context
    ctx = ctxs[id];

    // update the height and width in case they have changed
    // but only do it if they have, it's laggy otherwise
    if (canvases[id].width() != client.width || canvases[id].height() != client.height) {
      canvases[id].get(0).width = client.width;
      canvases[id].get(0).height = client.height;
      canvases[id].width(client.width).height(client.height);
    }
  } else {
    // create the new canvas
    canvases[id] = $('<canvas/>', {id: id}).width(client.width).height(client.height);
    canvases[id].get(0).width = client.width;
    canvases[id].get(0).height = client.height;
    $('#other_clients').append(canvases[id]);

    // get the canvas drawing context
    ctx = canvases[id][0].getContext('2d');
    ctxs[id] = ctx;
  }

  // load the image onto the canvas
  var image = new Image();
  image.onload = function() {
    ctx.drawImage(image, 0, 0);
  };

  image.src = client.imageData;
}

function removeClient(clientId) {
  // remove the client
  delete clients[clientId];
  renderClients();
  $('#' + clientId).remove();
}
